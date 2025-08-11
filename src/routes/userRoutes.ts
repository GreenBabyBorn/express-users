import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '../../generated/prisma';

const router = Router();

router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

router.get('/:id', authenticateToken, UserController.getUserById);
router.get('/', authenticateToken, authorizeRoles([Role.ADMIN]), UserController.getAllUsers);
router.put('/:id/status', authenticateToken, UserController.blockUser);

export default router;
