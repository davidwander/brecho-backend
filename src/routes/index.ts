import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { productRoutes } from './product.routes';
import { clientRoutes } from './client.routes';
import { saleRoutes } from './sale.routes';
import { deliveryRoutes } from './delivery.routes';
import { authMiddleware } from '../middlewares/auth';

const routes = Router();

routes.use('/auth', authRoutes);

// Rotas protegidas
routes.use(authMiddleware);
routes.use('/products', productRoutes);
routes.use('/clients', clientRoutes);
routes.use('/sales', saleRoutes);
routes.use('/deliveries', deliveryRoutes);

// Aqui serão adicionadas as outras rotas protegidas

export { routes }; 