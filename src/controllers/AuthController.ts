import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

  async authenticate(request: Request, response: Response) {
    try {
      const { email, password } = request.body;

      // Validação dos campos
      if (!email || !password) {
        return response.status(400).json({ 
          error: 'Dados incompletos',
          details: 'Email e senha são obrigatórios'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return response.status(401).json({ 
          error: 'Credenciais inválidas',
          details: 'Email ou senha incorretos'
        });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        return response.status(401).json({ 
          error: 'Credenciais inválidas',
          details: 'Email ou senha incorretos'
        });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
        expiresIn: '1d'
      });

      return response.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      });
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      return response.status(500).json({ 
        error: 'Erro ao autenticar usuário',
        details: error.message || 'Erro interno no servidor'
      });
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