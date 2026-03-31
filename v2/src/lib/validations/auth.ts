import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z
    .string()
    .min(8, "הסיסמה חייבת להכיל לפחות 8 תווים")
    .regex(/\d/, "הסיסמה חייבת להכיל לפחות ספרה אחת")
    .regex(/[a-zA-Z]/, "הסיסמה חייבת להכיל לפחות אות אחת"),
  name: z.string().min(1, "שם הוא שדה חובה"),
  role: z.enum(["patient", "provider"]).default("patient"),
  languagePreference: z.string().default("he"),
});

export const loginSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "סיסמה היא שדה חובה"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "הסיסמה חייבת להכיל לפחות 8 תווים")
    .regex(/\d/, "הסיסמה חייבת להכיל לפחות ספרה אחת")
    .regex(/[a-zA-Z]/, "הסיסמה חייבת להכיל לפחות אות אחת"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
