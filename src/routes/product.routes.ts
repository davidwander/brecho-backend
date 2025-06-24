import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/auth';

const productRoutes = Router();
const productController = new ProductController();

// Aplica o middleware de autenticação em todas as rotas
productRoutes.use(authMiddleware);

productRoutes.post('/', productController.create);
productRoutes.get('/', productController.list);
productRoutes.get('/:id', productController.findById);
productRoutes.put('/:id', productController.update);
productRoutes.delete('/:id', productController.delete);
productRoutes.patch('/:id/status', productController.updateStatus);
productRoutes.patch('/:id/stock', productController.updateStock);

export { productRoutes }; 