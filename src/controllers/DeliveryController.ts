import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateDelivery } from '../utils/validation';
import { DELIVERY_STATUS, SALE_STATUS } from '../constants/status';

const prisma = new PrismaClient();

export class DeliveryController {
  async create(request: Request, response: Response) {
    try {
      const { saleId, address, date } = request.body;

      const errors = validateDelivery(request.body);
      if (errors.length > 0) {
        return response.status(400).json({ errors });
      }

      const sale = await prisma.sale.findUnique({
        where: { id: saleId }
      });

      if (!sale) {
        return response.status(404).json({ error: 'Venda não encontrada' });
      }

      if (sale.status === SALE_STATUS.CANCELLED) {
        return response.status(400).json({ error: 'Não é possível criar entrega para uma venda cancelada' });
      }

      const delivery = await prisma.delivery.create({
        data: {
          saleId,
          address,
          date: date ? new Date(date) : null,
          status: DELIVERY_STATUS.PENDING
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

      // Atualizar o status da venda
      await prisma.sale.update({
        where: { id: saleId },
        data: { status: SALE_STATUS.DELIVERY_SCHEDULED }
      });

      return response.status(201).json(delivery);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao criar entrega' });
    }
  }

  async list(request: Request, response: Response) {
    try {
      const deliveries = await prisma.delivery.findMany({
        orderBy: {
          date: 'asc'
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

      return response.json(deliveries);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao listar entregas' });
    }
  }

  async updateStatus(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { status } = request.body;

      if (!Object.values(DELIVERY_STATUS).includes(status)) {
        return response.status(400).json({ error: 'Status inválido' });
      }

      const delivery = await prisma.delivery.update({
        where: { id },
        data: { status },
        include: {
          sale: {
            include: {
              client: true
            }
          }
        }
      });

      // Se a entrega foi concluída, atualizar o status da venda
      if (status === DELIVERY_STATUS.COMPLETED) {
        await prisma.sale.update({
          where: { id: delivery.saleId },
          data: { status: SALE_STATUS.DELIVERED }
        });
      }

      return response.json(delivery);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao atualizar status da entrega' });
    }
  }

  async findById(request: Request, response: Response) {
    try {
      const { id } = request.params;

      const delivery = await prisma.delivery.findUnique({
        where: { id },
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

      if (!delivery) {
        return response.status(404).json({ error: 'Entrega não encontrada' });
      }

      return response.json(delivery);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao buscar entrega' });
    }
  }

  async updateDate(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { date } = request.body;

      const delivery = await prisma.delivery.update({
        where: { id },
        data: {
          date: new Date(date)
        },
        include: {
          sale: {
            include: {
              client: true
            }
          }
        }
      });

      return response.json(delivery);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao atualizar data da entrega' });
    }
  }
} 