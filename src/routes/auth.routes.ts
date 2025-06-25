import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.authenticate);
authRoutes.get('/validate', authMiddleware, authController.validate);
authRoutes.post('/refresh-token', authController.refreshToken);
authRoutes.post('/logout', authController.logout);

export { authRoutes }; 