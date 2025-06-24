import { Router } from 'express';
import { SaleController } from '../controllers/SaleController';

const saleRoutes = Router();
const saleController = new SaleController();

saleRoutes.post('/', saleController.create);
saleRoutes.get('/', saleController.list);
saleRoutes.get('/:id', saleController.findById);
saleRoutes.patch('/:id/status', saleController.updateStatus);
saleRoutes.get('/client/:clientId', saleController.listByClient);

export { saleRoutes }; 