import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClientController {
  async create(request: Request, response: Response) {
    try {
      const { name, phone, email, address } = request.body;

      const client = await prisma.client.create({
        data: {
          name,
          phone,
          email,
          address
        }
      });

      return response.status(201).json(client);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao criar cliente' });
    }
  }

  async list(request: Request, response: Response) {
    try {
      const clients = await prisma.client.findMany({
        orderBy: {
          name: 'asc'
        },
        include: {
          sales: true
        }
      });

      return response.json(clients);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao listar clientes' });
    }
  }

  async findById(request: Request, response: Response) {
    try {
      const { id } = request.params;

      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          sales: {
            include: {
              products: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });

      if (!client) {
        return response.status(404).json({ error: 'Cliente não encontrado' });
      }

      return response.json(client);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao buscar cliente' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { name, phone, email, address } = request.body;

      const client = await prisma.client.update({
        where: { id },
        data: {
          name,
          phone,
          email,
          address
        }
      });

      return response.json(client);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async delete(request: Request, response: Response) {
    try {
      const { id } = request.params;

      await prisma.client.delete({
        where: { id }
      });

      return response.status(204).send();
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao deletar cliente' });
    }
  }

  async search(request: Request, response: Response) {
    try {
      const { q } = request.query;

      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: String(q), mode: 'insensitive' } },
            { email: { contains: String(q), mode: 'insensitive' } },
            { phone: { contains: String(q), mode: 'insensitive' } }
          ]
        },
        orderBy: {
          name: 'asc'
        }
      });

      return response.json(clients);
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao pesquisar clientes' });
    }
  }
} 