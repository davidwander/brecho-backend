import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

export class AuthController {
  async register(request: Request, response: Response) {
    try {
      const { name, email, password } = request.body;

      // Validação dos campos
      if (!name || !email || !password) {
        return response.status(400).json({ 
          error: 'Dados incompletos',
          details: 'Nome, email e senha são obrigatórios'
        });
      }

      // Validação do formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return response.status(400).json({ 
          error: 'Email inválido',
          details: 'O formato do email não é válido'
        });
      }

      // Validação do tamanho da senha
      if (password.length < 6) {
        return response.status(400).json({ 
          error: 'Senha inválida',
          details: 'A senha deve ter no mínimo 6 caracteres'
        });
      }

      const userExists = await prisma.user.findUnique({
        where: { email }
      });

      if (userExists) {
        return response.status(409).json({ 
          error: 'Usuário já existe',
          details: 'Este email já está cadastrado'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 8);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      }).catch((error) => {
        console.error('Erro ao criar usuário:', error);
        throw new Error('Erro ao criar usuário no banco de dados');
      });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
        expiresIn: '1d'
      });

      return response.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      });
    } catch (error: any) {
      console.error('Erro no registro:', error);
      return response.status(500).json({ 
        error: 'Erro ao registrar usuário',
        details: error.message || 'Erro interno no servidor'
      });
    }
  }

  async login(request: Request, response: Response) {
    try {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return response.status(401).json({ error: 'Usuário não encontrado' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return response.status(401).json({ error: 'Senha inválida' });
      }

      if (!process.env.JWT_SECRET) {
        return response.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      // Gera o token de acesso (JWT)
      const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h' // Token expira em 1 hora
      });

      // Gera o refresh token
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Refresh token expira em 7 dias
      });

      // Salva o refresh token no banco
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: addDays(new Date(), 7)
        }
      });

      return response.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async refreshToken(request: Request, response: Response) {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return response.status(400).json({ error: 'Refresh token não fornecido' });
      }

      if (!process.env.JWT_SECRET) {
        return response.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      // Busca o refresh token no banco
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (!storedToken) {
        return response.status(401).json({ error: 'Refresh token inválido' });
      }

      // Verifica se o token expirou
      if (new Date() > storedToken.expiresAt) {
        // Remove o token expirado
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });
        return response.status(401).json({ error: 'Refresh token expirado' });
      }

      try {
        // Verifica se o token é válido
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as { id: string };

        // Gera novo access token
        const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
          expiresIn: '1h'
        });

        // Gera novo refresh token
        const newRefreshToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
          expiresIn: '7d'
        });

        // Remove o refresh token antigo
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });

        // Salva o novo refresh token
        await prisma.refreshToken.create({
          data: {
            userId: decoded.id,
            token: newRefreshToken,
            expiresAt: addDays(new Date(), 7)
          }
        });

        return response.json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        });
      } catch (error) {
        return response.status(401).json({ error: 'Refresh token inválido' });
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async logout(request: Request, response: Response) {
    try {
      const { refreshToken } = request.body;

      if (refreshToken) {
        // Remove o refresh token do banco
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken }
        });
      }

      return response.status(204).send();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async validate(request: Request, response: Response) {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        return response.status(401).json({ error: 'Token não fornecido' });
      }

      const [, token] = authHeader.split(' ');

      try {
        // Verifica se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        // Verifica se o usuário ainda existe
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });

        if (!user) {
          return response.status(401).json({ error: 'Usuário não encontrado' });
        }

        // Retorna os dados do usuário
        return response.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      } catch (err) {
        return response.status(401).json({ error: 'Token inválido' });
      }
    } catch (error) {
      return response.status(400).json({ error: 'Erro ao validar token' });
    }
  }
} 