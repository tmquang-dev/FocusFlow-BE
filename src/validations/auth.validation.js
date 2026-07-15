import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .email('Định dạng email không hợp lệ'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .email('Định dạng email không hợp lệ'),
    code: z
      .string({ required_error: 'Mã OTP là bắt buộc' })
      .length(6, 'Mã OTP phải có đúng 6 chữ số')
      .regex(/^\d+$/, 'Mã OTP chỉ được chứa các chữ số'),
  }),
});

export const completeRegisterSchema = z.object({
  body: z
    .object({
      password: z
        .string({ required_error: 'Mật khẩu là bắt buộc' })
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .max(100, 'Mật khẩu không được dài quá 100 ký tự'),
      confirm_password: z
        .string({ required_error: 'Xác nhận mật khẩu là bắt buộc' }),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: 'Mật khẩu xác nhận không trùng khớp',
      path: ['confirm_password'],
    }),
});
