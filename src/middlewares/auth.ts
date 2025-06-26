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
    return response.status(401).json({ 
      error: 'Token não fornecido',
      details: 'O cabeçalho de autorização é obrigatório'
    });
  }

  try {
    // Verifica se o token começa com Bearer
    if (!authorization.startsWith('Bearer ')) {
      return response.status(401).json({ 
        error: 'Formato de token inválido',
        details: 'O token deve começar com "Bearer "'
      });
    }

    // Extrai o token removendo 'Bearer ' do início
    const token = authorization.slice(7);
    
    // Validação básica do formato do token
    if (!token || token.split('.').length !== 3) {
      return response.status(401).json({ 
        error: 'Token inválido',
        details: 'O formato do token JWT é inválido'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado no ambiente');
      return response.status(500).json({ 
        error: 'Erro de configuração do servidor',
        details: 'Variáveis de ambiente não configuradas corretamente'
      });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;

      // Validações adicionais do payload
      if (!decodedToken.id) {
        return response.status(401).json({ 
          error: 'Token inválido',
          details: 'O payload do token não contém o ID do usuário'
        });
      }

      // Verifica se o token está próximo de expirar (menos de 5 minutos)
      const expirationTime = decodedToken.exp * 1000; // Converter para milissegundos
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      if (timeUntilExpiration < 300000) { // 5 minutos em milissegundos
        response.setHeader('X-Token-Expiring-Soon', 'true');
      }

      request.userId = decodedToken.id;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return response.status(401).json({ 
          error: 'Token expirado',
          details: 'O token de acesso expirou',
          code: 'TOKEN_EXPIRED',
          shouldRefresh: true
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        return response.status(401).json({ 
          error: 'Token inválido',
          details: 'O token está malformado ou possui uma assinatura inválida',
          code: 'INVALID_TOKEN',
          shouldRefresh: false
        });
      }
      
      console.error('Erro desconhecido na validação do token:', error);
      return response.status(401).json({ 
        error: 'Token inválido',
        details: 'Ocorreu um erro ao validar o token',
        code: 'UNKNOWN_ERROR',
        shouldRefresh: false
      });
    }
  } catch (error) {
    console.error('Erro na validação do token:', error);
    return response.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao processar a autenticação'
    });
  }
} 