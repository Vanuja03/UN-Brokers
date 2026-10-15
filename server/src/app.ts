import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimits.js';
import { router } from './routes/index.js';
import { assertNoOperatorKeys } from './utils/sanitize.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origin not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Idempotency-Key'],
    }),
  );
  app.use(apiLimiter);
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use((req, _res, next) => {
    try {
      if (req.body && typeof req.body === 'object') assertNoOperatorKeys(req.body);
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use('/api', router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
