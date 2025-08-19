import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import axios from 'axios';
import { storage } from './storage';

// JWT secret - in production this should be from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  phone: string;
  sessionToken: string;
}

// Generate secure random code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure session token
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Sign JWT token
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Send verification code via Telegram Bot
export async function sendTelegramCode(phone: string, code: string): Promise<boolean> {
  try {
    // Note: Bot token should be provided as environment variable
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.log(`Mock sending Telegram code: ${code} to ${phone} via @Ducharha_bot`);
      return true; // In development, simulate success
    }

    // Find user by phone in Telegram (this is a simplified example)
    // In real implementation, you'd need to have a mapping of phone numbers to Telegram user IDs
    // or use a different approach like having users send /start to the bot first
    
    const message = `🔐 Ваш код для входа в ДУЧАРХА: ${code}\n\nКод действителен 5 минут.\nНе сообщайте этот код никому!`;
    
    // This is a placeholder - in real implementation you'd need the chat_id
    // const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    //   chat_id: chatId, // You need to get this somehow
    //   text: message,
    //   parse_mode: 'HTML'
    // });

    console.log(`Would send via Telegram: ${message} to ${phone}`);
    return true;
    
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  sessionToken?: string;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Токен доступа не найден' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }

  // Check if session is still valid
  const session = await storage.getSession(decoded.sessionToken);
  if (!session) {
    return res.status(401).json({ message: 'Сессия истекла' });
  }

  // Get user data
  const user = await storage.getUser(decoded.userId);
  if (!user) {
    return res.status(401).json({ message: 'Пользователь не найден' });
  }

  req.user = user;
  req.sessionToken = decoded.sessionToken;
  next();
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next();
  }

  const session = await storage.getSession(decoded.sessionToken);
  const user = session ? await storage.getUser(decoded.userId) : null;

  if (user && session) {
    req.user = user;
    req.sessionToken = decoded.sessionToken;
  }

  next();
}

// Cleanup expired codes and sessions (should be called periodically)
export async function cleanupExpiredAuth() {
  await storage.cleanupExpiredCodes();
  await storage.cleanupExpiredSessions();
}