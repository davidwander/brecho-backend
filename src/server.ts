import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupWebSocketHandlers } from './websocket';

// Log das variáveis de ambiente (remova em produção)
console.log('Variáveis de ambiente carregadas:', {
  databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
  jwtSecret: process.env.JWT_SECRET ? 'Configurado' : 'Não configurado',
  nodeEnv: process.env.NODE_ENV || 'development'
});

const app = express();
const server = createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Configuração do CORS para Express
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Token-Expiring-Soon'],
  credentials: true
};

app.use(cors(corsOptions));

// Configuração do parsing JSON com limite aumentado
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log da requisição
  console.log(`📥 ${req.method} ${req.url}`, {
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'authorization': req.headers.authorization ? 'Bearer [REDACTED]' : 'None'
    },
    query: req.query,
    body: req.method !== 'GET' ? '(REDACTED)' : undefined
  });

  // Intercepta o fim da resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Middleware para garantir headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'X-Token-Expiring-Soon');
  
  // Responde imediatamente a requisições OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configurar WebSocket
setupWebSocketHandlers(io);

// Adiciona o socket.io ao request
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Middleware de tratamento de erros
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use(routes);

export { server }; 