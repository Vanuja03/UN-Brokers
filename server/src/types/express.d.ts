import 'express-serve-static-core';
import type { AdminRole } from '../config/constants.js';

declare module 'express-serve-static-core' {
  interface Request {
    admin?: {
      id: string;
      name: string;
      email: string;
      role: AdminRole;
      tokenVersion: number;
    };
  }
}
