import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { User, Workspace, Task, Otp } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import {
  getRegisterEmailTemplate,
  getForgotPasswordEmailTemplate,
} from '../utils/emailTemplates.js';

const getResendClient = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const getFromEmail = () =>
  process.env.EMAIL_FROM
    ? `FocusFlow <${process.env.EMAIL_FROM}>`
    : 'FocusFlow <onboarding@resend.dev>';

const JWT_REGISTRATION_SECRET =
  process.env.JWT_REGISTRATION_SECRET || 'temp_registration_secret_key';
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';
const JWT_RESET_SECRET =
  process.env.JWT_RESET_SECRET || 'temp_reset_secret_key';

/**
 * Send registration OTP
 * @param {string} email
 */
export const sendOtp = async (email) => {
  // 1. Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(
      400,
      'EMAIL_ALREADY_EXISTS',
      'This email address is already registered.'
    );
  }

  // 2. Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // 3. Save or update OTP in DB (upsert)
  await Otp.findOneAndUpdate(
    { email },
    { code, expires_at: expiresAt },
    { upsert: true, new: true }
  );

  // Log OTP for development & debugging
  console.log(`[OTP REGISTER] OTP code for ${email} is: ${code}`);

  // 4. Send email via Resend
  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: 'FocusFlow - Verification Code',
      html: getRegisterEmailTemplate(code),
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      throw new ApiError(
        500,
        'EMAIL_SEND_FAILED',
        `Failed to send OTP email: ${error.message}`
      );
    }
  }
};

/**
 * Verify registration OTP
 * @param {string} email
 * @param {string} code
 * @returns {Promise<string>} registrationToken
 */
export const verifyOtp = async (email, code) => {
  // 1. Find valid OTP record in DB
  const otpRecord = await Otp.findOne({
    email,
    code,
    expires_at: { $gt: new Date() },
  });
  if (!otpRecord) {
    throw new ApiError(
      400,
      'INVALID_OTP',
      'Invalid or expired OTP code.'
    );
  }

  // 2. Delete OTP record after verification
  await Otp.deleteOne({ _id: otpRecord._id });

  // 3. Generate registration_token (10 minutes)
  const registrationToken = jwt.sign({ email }, JWT_REGISTRATION_SECRET, {
    expiresIn: '10m',
  });

  return registrationToken;
};

/**
 * Complete account registration
 * @param {string} registrationToken
 * @param {string} password
 * @returns {Promise<object>} { access_token, user }
 */
export const completeRegister = async (registrationToken, password) => {
  let email;

  // 1. Decode & verify registrationToken
  try {
    const decoded = jwt.verify(registrationToken, JWT_REGISTRATION_SECRET);
    email = decoded.email;
  } catch {
    throw new ApiError(
      401,
      'INVALID_TOKEN',
      'Invalid or expired registration token.'
    );
  }

  // 2. Re-check if user exists (prevent race condition)
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(
      400,
      'EMAIL_ALREADY_EXISTS',
      'This email address is already registered.'
    );
  }

  // 3. Extract default full_name from email prefix
  const fullName = email.split('@')[0];

  // 4. Create User (password will be hashed in pre-save hook)
  const user = await User.create({
    email,
    password_hash: password,
    full_name: fullName,
    auth_provider: 'local',
  });

  // 5. Initialize default onboarding workspace & tasks
  const workspace = await Workspace.create({
    name: 'Workspace 1',
    user_id: user._id,
  });

  const defaultTasks = [
    {
      workspace_id: workspace._id,
      user_id: user._id,
      title: 'Welcome to FocusFlow! 🚀',
      description:
        'This is your workspace. Try starting a Pomodoro session for this task.',
      status: 'TO_DO',
      order: 0,
    },
    {
      workspace_id: workspace._id,
      user_id: user._id,
      title: 'Working with Kanban Board 📋',
      description:
        'Drag and drop task cards between columns (Backlog, To Do, In Progress, Done) to update task status.',
      status: 'TO_DO',
      order: 1,
    },
    {
      workspace_id: workspace._id,
      user_id: user._id,
      title: 'Focus with Pomodoro Timer ⏱️',
      description:
        'Click the Pomodoro icon to start a 25-minute focus session. System automatically tracks your progress.',
      status: 'TO_DO',
      order: 2,
    },
  ];

  await Task.create(defaultTasks);

  // 6. Generate access token (1 day)
  const accessToken = jwt.sign(
    { id: user._id, email: user.email },
    JWT_ACCESS_SECRET,
    {
      expiresIn: '1d',
    }
  );

  return {
    access_token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
    },
  };
};

/**
 * User Login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} { access_token, user }
 */
export const login = async (email, password) => {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.'
    );
  }

  // 2. Check if account uses social auth provider
  if (user.auth_provider !== 'local') {
    throw new ApiError(
      400,
      'SOCIAL_LOGIN_REQUIRED',
      `This account was registered via ${user.auth_provider}. Please sign in with ${user.auth_provider === 'google' ? 'Google' : 'GitHub'}.`
    );
  }

  // 3. Match password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.'
    );
  }

  // 4. Generate access token (1 day)
  const accessToken = jwt.sign(
    { id: user._id, email: user.email },
    JWT_ACCESS_SECRET,
    {
      expiresIn: '1d',
    }
  );

  return {
    access_token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
    },
  };
};

/**
 * Send password reset OTP
 * @param {string} email
 */
export const forgotPassword = async (email) => {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(
      404,
      'EMAIL_NOT_FOUND',
      'No account found with this email address.'
    );
  }

  // 2. Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // 3. Save or update OTP in DB
  await Otp.findOneAndUpdate(
    { email },
    { code, expires_at: expiresAt },
    { upsert: true, new: true }
  );

  // Log OTP for development & debugging
  console.log(`[OTP FORGOT PASSWORD] OTP code for ${email} is: ${code}`);

  // 4. Send email via Resend
  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: 'FocusFlow - Reset Your Password',
      html: getForgotPasswordEmailTemplate(code),
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      throw new ApiError(
        500,
        'EMAIL_SEND_FAILED',
        `Failed to send OTP email: ${error.message}`
      );
    }
  }
};

/**
 * Verify password reset OTP
 * @param {string} email
 * @param {string} code
 * @returns {Promise<string>} resetToken
 */
export const verifyPasswordOtp = async (email, code) => {
  // 1. Find OTP in DB
  const otpRecord = await Otp.findOne({
    email,
    code,
    expires_at: { $gt: new Date() },
  });
  if (!otpRecord) {
    throw new ApiError(
      400,
      'INVALID_OTP',
      'Invalid or expired OTP code.'
    );
  }

  // 2. Delete OTP record
  await Otp.deleteOne({ _id: otpRecord._id });

  // 3. Generate reset_token (10 minutes)
  const resetToken = jwt.sign({ email }, JWT_RESET_SECRET, {
    expiresIn: '10m',
  });

  return resetToken;
};

/**
 * Reset new password
 * @param {string} resetToken
 * @param {string} password
 */
export const resetPassword = async (resetToken, password) => {
  let email;

  // 1. Decode & verify reset_token
  try {
    const decoded = jwt.verify(resetToken, JWT_RESET_SECRET);
    email = decoded.email;
  } catch {
    throw new ApiError(
      401,
      'INVALID_TOKEN',
      'Invalid or expired reset token.'
    );
  }

  // 2. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(
      404,
      'EMAIL_NOT_FOUND',
      'No account found with this email address.'
    );
  }

  // 3. Update new password
  user.password_hash = password;
  await user.save();
};
