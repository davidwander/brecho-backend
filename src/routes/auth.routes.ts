import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth';

const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.get('/validate', authMiddleware, AuthController.validate);
authRoutes.post('/refresh-token', AuthController.refreshToken);
authRoutes.post('/logout', AuthController.logout);

export { authRoutes }; 