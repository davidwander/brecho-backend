import { Router } from 'express';
import { DeliveryController } from '../controllers/DeliveryController';

const deliveryRoutes = Router();
const deliveryController = new DeliveryController();

deliveryRoutes.post('/', deliveryController.create);
deliveryRoutes.get('/', deliveryController.list);
deliveryRoutes.get('/:id', deliveryController.findById);
deliveryRoutes.patch('/:id/status', deliveryController.updateStatus);
deliveryRoutes.patch('/:id/date', deliveryController.updateDate);

export { deliveryRoutes }; 