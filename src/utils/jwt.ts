import jwt from 'jsonwebtoken';
import { User } from '../../generated/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; 

export const generateToken = (user: User) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};
