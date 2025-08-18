import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserCreateInputSchema, UserSchema } from "../../generated/zod";

export const loginSchema = UserSchema.pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = UserCreateInputSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Validation error during registration:", error.message);
    } else {
      console.error("An unknown error occurred during registration:", error);
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Validation error during login:", error.message);
    } else {
      console.error("An unknown error occurred during login:", error);
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
