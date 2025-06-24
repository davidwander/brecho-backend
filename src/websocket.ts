import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupWebSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Produto
    socket.on('product:create', async (data, callback) => {
      try {
        const product = await prisma.product.create({
          data: {
            name: data.name,
            type: data.type,
            description: data.description,
            costPrice: data.costPrice,
            profitMargin: data.profitMargin,
            salePrice: data.salePrice,
            quantity: data.quantity,
            reserved: data.reserved || false,
            sold: data.sold || false,
            code: data.code
          }
        });
        
        // Notifica todos os clientes sobre o novo produto
        socket.broadcast.emit('product:created', product);
        
        // Retorna o produto criado para o cliente que fez a requisição
        callback(null, product);
      } catch (error) {
        console.error('Erro ao criar produto:', error);
        callback({ message: 'Erro ao criar produto', details: error.message });
      }
    });

    socket.on('product:update', async (data) => {
      try {
        const product = await prisma.product.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description,
            price: data.price,
            quantity: data.quantity,
            category: data.category,
            status: data.status
          }
        });
        
        io.emit('product:updated', product);
      } catch (error) {
        socket.emit('error', { message: 'Erro ao atualizar produto' });
      }
    });

    // Venda
    socket.on('sale:create', async (data) => {
      try {
        const sale = await prisma.sale.create({
          data: {
            clientId: data.clientId,
            userId: data.userId,
            total: data.total,
            paymentType: data.paymentType,
            products: {
              create: data.products.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          },
          include: {
            client: true,
            products: {
              include: {
                product: true
              }
            }
          }
        });
        
        io.emit('sale:created', sale);
      } catch (error) {
        socket.emit('error', { message: 'Erro ao criar venda' });
      }
    });

    socket.on('sale:update_status', async (data) => {
      try {
        const sale = await prisma.sale.update({
          where: { id: data.id },
          data: { status: data.status },
          include: {
            client: true,
            products: {
              include: {
                product: true
              }
            }
          }
        });
        
        io.emit('sale:status_updated', sale);
      } catch (error) {
        socket.emit('error', { message: 'Erro ao atualizar status da venda' });
      }
    });

    // Entrega
    socket.on('delivery:create', async (data) => {
      try {
        const delivery = await prisma.delivery.create({
          data: {
            saleId: data.saleId,
            address: data.address,
            date: data.date ? new Date(data.date) : null,
            status: 'pending'
          },
          include: {
            sale: {
              include: {
                client: true,
                products: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        });
        
        io.emit('delivery:created', delivery);
      } catch (error) {
        socket.emit('error', { message: 'Erro ao criar entrega' });
      }
    });

    socket.on('delivery:update_status', async (data) => {
      try {
        const delivery = await prisma.delivery.update({
          where: { id: data.id },
          data: { status: data.status },
          include: {
            sale: {
              include: {
                client: true
              }
            }
          }
        });
        
        io.emit('delivery:status_updated', delivery);
      } catch (error) {
        socket.emit('error', { message: 'Erro ao atualizar status da entrega' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
} 