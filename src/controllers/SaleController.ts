import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateSale } from '../utils/validation';
import { SALE_STATUS, PRODUCT_STATUS } from '../constants/status';

const prisma = new PrismaClient();

export class SaleController {
  async create(request: Request, response: Response) {
    try {
      const { clientId, products, total, paymentType } = request.body;
      const userId = request.userId;

      const errors = validateSale(request.body);
      if (errors.length > 0) {
        return response.status(400).json({ errors });
      }

      // Verificar estoque dos produtos
      for (const item of products) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          return response.status(400).json({ error: `Produto ${item.productId} não encontrado` });
        }

        if (product.quantity < item.quantity) {
          return response.status(400).json({ error: `Estoque insuficiente para o produto ${product.name}` });
        }
      }

      const sale = await prisma.sale.create({
        data: {
          clientId,
          userId,
          total: Number(total),
          paymentType,
          status: SALE_STATUS.PENDING,
          products: {
            create: products.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              price: Number(item.price)
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

      // Atualizar o estoque dos produtos
      for (const item of products) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (product) {
          const newQuantity = product.quantity - item.quantity;
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: newQuantity,
              status: newQuantity === 0 ? PRODUCT_STATUS.SOLD : PRODUCT_STATUS.AVAILABLE
            }
          });
        }
      }

      return response.status(201).json(sale);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao criar venda' });
    }
  }

  async list(request: Request, response: Response) {
    try {
      const sales = await prisma.sale.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          client: true,
          products: {
            include: {
              product: true
            }
          },
          delivery: true
        }
      });

      return response.json(sales);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao listar vendas' });
    }
  }

  async findById(request: Request, response: Response) {
    try {
      const { id } = request.params;

      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          client: true,
          products: {
            include: {
              product: true
            }
          },
          delivery: true
        }
      });

      if (!sale) {
        return response.status(404).json({ error: 'Venda não encontrada' });
      }

      return response.json(sale);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao buscar venda' });
    }
  }

  async updateStatus(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { status } = request.body;

      if (!Object.values(SALE_STATUS).includes(status)) {
        return response.status(400).json({ error: 'Status inválido' });
      }

      const sale = await prisma.sale.update({
        where: { id },
        data: { status },
        include: {
          client: true,
          products: {
            include: {
              product: true
            }
          },
          delivery: true
        }
      });

      return response.json(sale);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao atualizar status da venda' });
    }
  }

  async listByClient(request: Request, response: Response) {
    try {
      const { clientId } = request.params;

      const sales = await prisma.sale.findMany({
        where: { clientId },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          products: {
            include: {
              product: true
            }
          },
          delivery: true
        }
      });

      return response.json(sales);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao listar vendas do cliente' });
    }
  }
} 