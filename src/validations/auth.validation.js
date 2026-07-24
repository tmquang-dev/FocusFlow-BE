import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
    code: z
      .string()
      .min(1, 'OTP code is required')
      .length(6, 'OTP code must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP code must contain digits only'),
  }),
});

export const completeRegisterSchema = z.object({
  body: z
    .object({
      password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters'),
      confirm_password: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: 'Passwords do not match',
      path: ['confirm_password'],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
  }),
});

export const verifyPasswordOtpSchema = verifyOtpSchema;

export const resetPasswordSchema = completeRegisterSchema;

export const resendOtpSchema = sendOtpSchema;
