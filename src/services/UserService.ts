import prisma from '../config/prismaClient';
import bcrypt from 'bcryptjs';
import { Role } from '../../generated/prisma';

interface CreateUserPayload {
  fullName: string;
  dateOfBirth: Date;
  email: string;
  password: string;
  role?: Role; 
}

class UserService {
  async createUser(data: CreateUserPayload) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

   
    const roleToAssign = data.role && Object.values(Role).includes(data.role) ? data.role : Role.USER;

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        password: hashedPassword, 
        role: roleToAssign,
        isActive: true,
      },
    });
    return user;
  }

  async authenticateUser(email: string, password_candidate: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return null; 
    }

    const isValidPassword = await bcrypt.compare(password_candidate, user.password);
    if (!isValidPassword) {
      return null; 
    }
    return user;
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async getAllUsers() {
    return prisma.user.findMany();
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }
}

export default new UserService();
