import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    // Verifica se o token começa com Bearer
    if (!authorization.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Formato de token inválido' });
    }

    // Extrai o token removendo 'Bearer ' do início
    const token = authorization.slice(7);
    
    // Adiciona log para debug
    console.log('Token recebido:', token.substring(0, 20) + '...');

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return response.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    try {
      const data = jwt.verify(token, process.env.JWT_SECRET);
      const { id } = data as TokenPayload;

      request.userId = id;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.error('Token expirado');
        return response.status(401).json({ error: 'Token expirado' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.error('Token malformado ou assinatura inválida:', error.message);
        return response.status(401).json({ error: 'Token inválido' });
      }
      console.error('Erro desconhecido na validação do token:', error);
      return response.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('Erro na validação do token:', error);
    return response.status(401).json({ error: 'Token inválido' });
  }
} 