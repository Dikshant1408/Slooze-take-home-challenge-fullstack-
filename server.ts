import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './src/graphql/schema';
import { resolvers } from './src/graphql/resolvers';
import { verifyToken } from './src/lib/auth';
import { logger } from './src/lib/logger';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// Environment validation
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`Environment variable ${envVar} is not set. Using default (not suitable for production).`);
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  // HTTP request logging
  app.use(morgan('combined'));

  // Rate limiting - general API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
  });

  app.use('/graphql', apiLimiter);
  app.use(express.json({ limit: '1mb' }));

  // Apollo Server setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      const user = token ? verifyToken(token) : null;
      return { user };
    },
    formatError: (err) => {
      // Centralized error handling: log errors and sanitize response
      if (err.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        logger.error('GraphQL internal error', { message: err.message, path: err.path });
        return { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } };
      }
      return err;
    },
  });

  await server.start();

  // Apply stricter rate limiting to auth mutations via HTTP middleware
  app.post('/graphql', (req, res, next) => {
    const body = req.body;
    if (body?.query?.includes('login') || body?.query?.includes('register')) {
      return authLimiter(req, res, next);
    }
    next();
  });

  server.applyMiddleware({ app, path: '/graphql' });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving with rate limiting
    app.use(apiLimiter);
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server ready`, { url: `http://localhost:${PORT}${server.graphqlPath}` });
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server', { message: err.message });
  process.exit(1);
});
