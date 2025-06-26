import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { productRoutes } from './product.routes';
import { clientRoutes } from './client.routes';
import { saleRoutes } from './sale.routes';
import { deliveryRoutes } from './delivery.routes';
import { authMiddleware } from '../middlewares/auth';

const routes = Router();

// Rota de health check (não requer autenticação)
routes.get('/health', (_, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas da API
routes.use('/auth', authRoutes);

// Rotas protegidas
routes.use(authMiddleware);
routes.use('/products', productRoutes);
routes.use('/clients', clientRoutes);
routes.use('/sales', saleRoutes);
routes.use('/deliveries', deliveryRoutes);

// Aqui serão adicionadas as outras rotas protegidas

export { routes }; 