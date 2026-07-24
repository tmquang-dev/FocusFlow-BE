/**
 * Create professional HTML Email Template for Registration OTP
 * @param {string} code - 6-digit OTP code
 * @returns {string} HTML content
 */
export const getRegisterEmailTemplate = (code) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FocusFlow Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                FocusFlow
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #e0e7ff; opacity: 0.9;">
                Master Your Time & Boost Productivity
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #111827;">
                Verify Your Account
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Thank you for choosing <strong>FocusFlow</strong>! Please use the verification code below to complete your registration:
              </p>

              <!-- OTP Code Display Box -->
              <div style="background-color: #f3f4f6; border: 2px dashed #c7d2fe; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 13px; text-transform: uppercase; font-weight: 600; color: #4f46e5; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                  VERIFICATION CODE
                </span>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #1e1b4b; letter-spacing: 8px; margin: 4px 0;">
                  ${code}
                </div>
              </div>

              <!-- Warning / Expiration Note -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                  ⚠️ This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                If you did not request this code, please safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} FocusFlow Team. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Create professional HTML Email Template for Password Reset OTP
 * @param {string} code - 6-digit OTP code
 * @returns {string} HTML content
 */
export const getForgotPasswordEmailTemplate = (code) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset FocusFlow Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                FocusFlow
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #fee2e2; opacity: 0.9;">
                Password Reset Request
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #111827;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                We received a request to reset the password for your FocusFlow account. Enter the verification code below to proceed:
              </p>

              <!-- OTP Code Display Box -->
              <div style="background-color: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 13px; text-transform: uppercase; font-weight: 600; color: #dc2626; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                  RESET CODE
                </span>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #991b1b; letter-spacing: 8px; margin: 4px 0;">
                  ${code}
                </div>
              </div>

              <!-- Warning / Expiration Note -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                  ⚠️ This code is valid for <strong>5 minutes</strong>. Never share this code with anyone.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                If you did not request a password reset, your account is secure and you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} FocusFlow Team. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
