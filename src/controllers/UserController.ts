import { Request, Response } from "express";
import UserService from "../services/UserService";
import { generateToken } from "../utils/jwt";
import { Role } from "../../generated/prisma";
import { UserCreateInputSchema } from "../../generated/zod";
import z from "zod";
import { loginSchema } from "../middleware/validationMiddleware";

class UserController {
  async registerUser(req: Request, res: Response) {
    try {
      const { fullName, dateOfBirth, email, password, role } =
        req.body as z.infer<typeof UserCreateInputSchema>;

      const user = await UserService.createUser({
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        email,
        password,
        role,
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return res
          .status(409)
          .json({ message: "User with this email already exists." });
      }
      console.error(error);
      res.status(500).json({ message: "Error registering user." });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required." });
      }

      const user = await UserService.authenticateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ token, user: userWithoutPassword });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging in user:", error.message);
      } else {
        console.error("An unknown error occurred during login:", error);
      }
      res.status(500).json({ message: "Error logging in user." });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (userRole !== Role.ADMIN && userId !== id) {
        return res.status(403).json({ message: "Access denied." });
      }

      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching user:", error.message);
      } else {
        console.error("An unknown error occurred while fetching user:", error);
      }
      res.status(500).json({ message: "Error fetching user." });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (page <= 0 || pageSize <= 0) {
        return res
          .status(400)
          .json({ message: "Page and pageSize must be positive integers." });
      }

      const { users, totalUsers } = await UserService.getAllUsers(
        page,
        pageSize,
      );

      const usersWithoutPasswords = users.map((user) => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      const totalPages = Math.ceil(totalUsers / pageSize);

      res.status(200).json({
        users: usersWithoutPasswords,
        totalUsers,
        currentPage: page,
        pageSize,
        totalPages,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching users:", error.message);
      } else {
        console.error("An unknown error occurred while fetching users:", error);
      }
      res.status(500).json({ message: "Error fetching users." });
    }
  }

  async blockUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (userRole !== Role.ADMIN && userId !== id) {
        return res.status(403).json({ message: "Access denied." });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean." });
      }

      const updatedUser = await UserService.updateUserStatus(id, isActive);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }
      const { password: _, ...updatedUserWithoutPassword } = updatedUser;
      res.status(200).json(updatedUserWithoutPassword);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error updating user status:", error.message);
      } else {
        console.error(
          "An unknown error occurred while updating user status:",
          error,
        );
      }
      res.status(500).json({ message: "Error updating user status." });
    }
  }
}

export default new UserController();
