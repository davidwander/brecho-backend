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
  jwtSecret: process.env.JWT_SECRET ? 'Configurado' : 'Não configurado'
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configurar WebSocket
setupWebSocketHandlers(io);

// Adiciona o socket.io ao request
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

app.use(routes);

export { server }; 