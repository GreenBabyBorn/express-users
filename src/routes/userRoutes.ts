import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { validateRegistration, validateLogin } from '../middleware/validationMiddleware';
import { Role } from '../../generated/prisma';

const router = Router();

router.post('/register', validateRegistration, UserController.registerUser);
router.post('/login', validateLogin, UserController.loginUser);

router.get('/:id', authenticateToken, UserController.getUserById);
router.get('/', authenticateToken, authorizeRoles([Role.ADMIN]), UserController.getAllUsers);
router.put('/:id/status', authenticateToken, UserController.blockUser);

export default router;
