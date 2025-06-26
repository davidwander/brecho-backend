import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

class AuthController {
  static async register(request: Request, response: Response) {
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

  static async login(request: Request, response: Response) {
    try {
      const { email, password } = request.body;

      console.log('Tentativa de login para:', email);

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        console.log('Usuário não encontrado:', email);
        return response.status(401).json({ error: 'Usuário não encontrado' });
      }

      console.log('Usuário encontrado:', {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      });

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        console.log('Senha inválida para usuário:', email);
        return response.status(401).json({ error: 'Senha inválida' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET não configurado');
        return response.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      // Gera o token de acesso (JWT) com payload mais completo
      const accessToken = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          type: 'access'
        }, 
        process.env.JWT_SECRET, 
        {
          expiresIn: '1h',
          audience: 'brecho-app',
          issuer: 'brecho-backend',
          subject: user.id
        }
      );

      // Gera o refresh token com payload mínimo
      const refreshToken = jwt.sign(
        { 
          id: user.id,
          type: 'refresh'
        }, 
        process.env.JWT_SECRET, 
        {
          expiresIn: '7d',
          audience: 'brecho-app',
          issuer: 'brecho-backend',
          subject: user.id
        }
      );

      // Remove tokens antigos do usuário
      console.log('Removendo tokens antigos do usuário:', user.id);
      await prisma.refreshToken.deleteMany({
        where: { 
          userId: user.id,
          OR: [
            { expiresAt: { lte: new Date() } }, // Remove tokens expirados
            { createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Remove tokens mais antigos que 30 dias
          ]
        }
      });

      // Salva o refresh token no banco com mais informações
      console.log('Salvando novo refresh token para o usuário:', user.id);
      const savedRefreshToken = await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: addDays(new Date(), 7)
        }
      });

      console.log('Refresh token salvo:', {
        id: savedRefreshToken.id,
        userId: savedRefreshToken.userId,
        expiresAt: savedRefreshToken.expiresAt
      });

      const responseData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        accessToken,
        refreshToken
      };

      console.log('Login bem-sucedido para:', email, {
        userId: user.id,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        refreshTokenId: savedRefreshToken.id
      });

      return response.json(responseData);
    } catch (error) {
      console.error('Erro no login:', error);
      return response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async refreshToken(request: Request, response: Response) {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return response.status(400).json({ 
          error: 'Refresh token não fornecido',
          details: 'O token de atualização é necessário para renovar o acesso'
        });
      }

      if (!process.env.JWT_SECRET) {
        return response.status(500).json({ 
          error: 'Erro de configuração do servidor',
          details: 'Variáveis de ambiente não configuradas corretamente'
        });
      }

      // Busca o refresh token no banco
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken) {
        return response.status(401).json({ 
          error: 'Refresh token inválido',
          details: 'O token de atualização não foi encontrado'
        });
      }

      // Verifica se o token expirou
      if (new Date() > storedToken.expiresAt) {
        // Remove o token expirado
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });
        return response.status(401).json({ 
          error: 'Refresh token expirado',
          details: 'O token de atualização expirou, faça login novamente'
        });
      }

      try {
        // Verifica se o token é válido e tem o tipo correto
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as { id: string; type: string };

        if (decoded.type !== 'refresh') {
          return response.status(401).json({ 
            error: 'Token inválido',
            details: 'O tipo de token é inválido para esta operação'
          });
        }

        // Gera novo access token com payload completo
        const newAccessToken = jwt.sign(
          { 
            id: decoded.id,
            email: storedToken.user.email,
            type: 'access'
          }, 
          process.env.JWT_SECRET, 
          {
            expiresIn: '1h',
            audience: 'brecho-app',
            issuer: 'brecho-backend',
            subject: decoded.id
          }
        );

        // Gera novo refresh token
        const newRefreshToken = jwt.sign(
          { 
            id: decoded.id,
            type: 'refresh'
          }, 
          process.env.JWT_SECRET, 
          {
            expiresIn: '7d',
            audience: 'brecho-app',
            issuer: 'brecho-backend',
            subject: decoded.id
          }
        );

        // Remove o refresh token antigo
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });

        // Salva o novo refresh token
        const newStoredToken = await prisma.refreshToken.create({
          data: {
            userId: decoded.id,
            token: newRefreshToken,
            expiresAt: addDays(new Date(), 7)
          }
        });

        console.log('Refresh token renovado com sucesso:', {
          userId: decoded.id,
          newTokenId: newStoredToken.id,
          expiresAt: newStoredToken.expiresAt
        });

        return response.json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: storedToken.user.id,
            name: storedToken.user.name,
            email: storedToken.user.email
          }
        });
      } catch (error) {
        console.error('Erro na verificação do refresh token:', error);
        return response.status(401).json({ 
          error: 'Refresh token inválido',
          details: 'O token de atualização está malformado ou possui uma assinatura inválida'
        });
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return response.status(500).json({ 
        error: 'Erro interno do servidor',
        details: 'Ocorreu um erro ao processar a renovação do token'
      });
    }
  }

  static async logout(request: Request, response: Response) {
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

  static async validate(request: Request, response: Response) {
    try {
      // O middleware de autenticação já validou o token
      // Se chegou aqui, significa que o token é válido
      const userId = request.user?.id;

      if (!userId) {
        return response.status(401).json({ error: 'Token inválido' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (!user) {
        return response.status(401).json({ error: 'Usuário não encontrado' });
      }

      return response.json({ user });
    } catch (error) {
      console.error('Erro na validação do token:', error);
      return response.status(500).json({ error: 'Erro ao validar token' });
    }
  }
}

export default AuthController; 