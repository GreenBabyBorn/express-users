import { Request, Response } from 'express';
import UserService from '../services/UserService';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { generateToken } from '../utils/jwt';
import { Role } from '../../generated/prisma';

class UserController {
  async registerUser(req: Request, res: Response) {
    try {
      const { fullName, dateOfBirth, email, password, role } = req.body;

      if (!fullName || !dateOfBirth || !email || !password) {
        return res.status(400).json({ message: 'All fields are required for registration.' });
      }

      const user = await UserService.createUser({
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        email,
        password,
        role,
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'User with this email already exists.' });
      }
      console.error(error);
      res.status(500).json({ message: 'Error registering user.' });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const user = await UserService.authenticateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user; // Exclude password from user object
      res.status(200).json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error logging in user.' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (userRole !== Role.ADMIN && userId !== id) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user.' });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      const usersWithoutPasswords = users.map(user => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching users.' });
    }
  }

  async blockUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (userRole !== Role.ADMIN && userId !== id) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean.' });
      }

      const updatedUser = await UserService.updateUserStatus(id, isActive);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const { password: _, ...updatedUserWithoutPassword } = updatedUser;
      res.status(200).json(updatedUserWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating user status.' });
    }
  }
}

export default new UserController();
