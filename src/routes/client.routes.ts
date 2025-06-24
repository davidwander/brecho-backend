import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';

const clientRoutes = Router();
const clientController = new ClientController();

clientRoutes.post('/', clientController.create);
clientRoutes.get('/', clientController.list);
clientRoutes.get('/search', clientController.search);
clientRoutes.get('/:id', clientController.findById);
clientRoutes.put('/:id', clientController.update);
clientRoutes.delete('/:id', clientController.delete);

export { clientRoutes }; 