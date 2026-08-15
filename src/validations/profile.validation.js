import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z
      .string()
      .trim()
      .min(1, 'Họ và tên không được để trống')
      .max(100, 'Họ và tên không được vượt quá 100 ký tự')
      .optional(),
    avatar_url: z
      .string()
      .url('Đường dẫn ảnh đại diện không hợp lệ')
      .nullable()
      .optional(),
  }),
});

export const unlinkOAuthSchema = z.object({
  body: z.object({
    provider: z.enum(['github', 'google'], {
      errorMap: () => ({
        message:
          "Nhà cung cấp OAuth không hợp lệ (chỉ hỗ trợ 'github' hoặc 'google')",
      }),
    }),
  }),
});

export const linkOAuthSchema = z.object({
  body: z.object({
    provider: z.enum(['github', 'google'], {
      errorMap: () => ({
        message:
          "Nhà cung cấp OAuth không hợp lệ (chỉ hỗ trợ 'github' hoặc 'google')",
      }),
    }),
    auth_code: z.string().min(1, 'Mã xác thực auth_code là bắt buộc'),
  }),
});
