import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// ========== AUTH SCHEMAS ==========

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must be at most 50 characters")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

// ========== TASK SCHEMAS ==========

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .trim(),
  description: z.string().max(2000, "Description is too long").optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional().default("Medium"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  status: z.enum(["Pending", "In-progress", "Completed"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  category: z.string().max(50).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(["Low", "Medium", "High", "Completed"]).optional(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  status: z.enum(["Pending", "In-progress", "Completed"]).optional(),
  completed: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  category: z.string().max(50).optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        completed: z.boolean().default(false),
        order: z.number().int().min(0).optional(),
      })
    )
    .max(50)
    .optional(),
});

// ========== NLP SCHEMA ==========

export const nlpCommandSchema = z.object({
  command: z
    .string()
    .min(3, "Command is too short")
    .max(500, "Command is too long")
    .trim(),
});

// ========== USER SCHEMAS ==========

export const updateFcmTokenSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  fcmToken: z.string().min(1, "FCM token is required"),
});

export const updateUserSchema = z.object({
  username: z.string().min(2).max(50).trim().optional(),
  avatar: z.string().url().optional(),
  taskAnalysisSchedule: z
    .object({
      firstRunTime: z.string().optional(),
      secondRunTime: z.string().optional(),
      enabled: z.boolean().optional(),
    })
    .optional(),
});
