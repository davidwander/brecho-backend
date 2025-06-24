import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateProduct } from '../utils/validation';
import { PRODUCT_STATUS } from '../constants/status';

const prisma = new PrismaClient();

export class ProductController {
  async create(request: Request, response: Response) {
    try {
      const { 
        name, 
        type,
        description, 
        costPrice,
        profitMargin,
        salePrice,
        quantity,
        code = null,
        reserved = false,
        sold = false
      } = request.body;

      console.log('Dados recebidos:', request.body);

      const errors = validateProduct(request.body);
      if (errors.length > 0) {
        console.log('Erros de validação:', errors);
        return response.status(400).json({ errors });
      }

      try {
        const product = await prisma.product.create({
          data: {
            name,
            type,
            code,
            description,
            costPrice: Number(costPrice),
            profitMargin: Number(profitMargin),
            salePrice: Number(salePrice),
            quantity: Number(quantity),
            status: PRODUCT_STATUS.AVAILABLE,
            reserved,
            sold
          }
        });

        // Emite evento via Socket.IO
        request.io?.emit('product:created', product);

        return response.status(201).json(product);
      } catch (dbError: any) {
        console.error('Erro no banco de dados:', dbError);
        return response.status(500).json({ 
          error: 'Erro ao criar produto no banco de dados',
          details: dbError.message 
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      return response.status(400).json({ 
        error: 'Erro ao criar produto',
        details: error.message 
      });
    }
  }

  async list(request: Request, response: Response) {
    try {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          description: true,
          costPrice: true,
          profitMargin: true,
          salePrice: true,
          quantity: true,
          status: true,
          reserved: true,
          sold: true,
          createdAt: true,
          updatedAt: true,
          sales: {
            select: {
              id: true
            }
          }
        }
      });

      return response.json(products);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      return response.status(400).json({ error: 'Erro ao listar produtos' });
    }
  }

  async findById(request: Request, response: Response) {
    try {
      const { id } = request.params;

      const product = await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          description: true,
          costPrice: true,
          profitMargin: true,
          salePrice: true,
          quantity: true,
          status: true,
          reserved: true,
          sold: true,
          createdAt: true,
          updatedAt: true,
          sales: {
            select: {
              id: true
            }
          }
        }
      });

      if (!product) {
        return response.status(404).json({ error: 'Produto não encontrado' });
      }

      return response.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return response.status(400).json({ error: 'Erro ao buscar produto' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { 
        name, 
        type,
        description, 
        costPrice,
        profitMargin,
        salePrice,
        quantity,
        code,
        status,
        reserved,
        sold
      } = request.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          type,
          code,
          description,
          costPrice: Number(costPrice),
          profitMargin: Number(profitMargin),
          salePrice: Number(salePrice),
          quantity: Number(quantity),
          status,
          reserved,
          sold
        }
      });

      return response.json(product);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return response.status(400).json({ error: 'Erro ao atualizar produto' });
    }
  }

  async delete(request: Request, response: Response) {
    try {
      const { id } = request.params;

      await prisma.product.delete({
        where: { id }
      });

      return response.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return response.status(400).json({ error: 'Erro ao deletar produto' });
    }
  }

  async updateStock(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { quantity } = request.body;

      if (quantity < 0) {
        return response.status(400).json({ error: 'Quantidade não pode ser negativa' });
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          quantity: Number(quantity),
          status: quantity === 0 ? PRODUCT_STATUS.UNAVAILABLE : PRODUCT_STATUS.AVAILABLE
        }
      });

      return response.json(product);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      return response.status(400).json({ error: 'Erro ao atualizar estoque' });
    }
  }

  async updateStatus(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { status } = request.body;

      const product = await prisma.product.update({
        where: { id },
        data: { status }
      });

      return response.json(product);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return response.status(400).json({ error: 'Erro ao atualizar status' });
    }
  }
} 