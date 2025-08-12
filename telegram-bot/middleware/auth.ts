import { Context } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

interface AuthContext extends Context {
  session: {
    isAuthenticated?: boolean;
    userPhone?: string;
    isAdmin?: boolean;
  };
}

const whitelistedPhones = process.env.WHITELISTED_PHONES?.split(',').map(p => p.trim()) || [];
const adminPhone = process.env.ADMIN_PHONE;

// Phone verification middleware
export const phoneAuthMiddleware = async (ctx: AuthContext, next: () => Promise<void>) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  
  // Check if user is already authenticated
  if (ctx.session?.isAuthenticated) {
    await next();
    return;
  }
  
  // For demo purposes, we'll simulate phone verification
  // In production, you'd implement proper Telegram phone verification
  const userPhone = await getUserPhoneFromTelegram(userId);
  
  if (!userPhone || !whitelistedPhones.includes(userPhone)) {
    await ctx.reply(`
🚫 *Access Denied*

This bot is restricted to authorized users only.

Your Telegram account must be registered with one of the whitelisted phone numbers.

Contact the administrator for access.
    `);
    return;
  }
  
  // Set session data
  ctx.session.isAuthenticated = true;
  ctx.session.userPhone = userPhone;
  ctx.session.isAdmin = userPhone === adminPhone;
  
  await next();
};

// Simulate getting phone from Telegram (in production, use proper API)
async function getUserPhoneFromTelegram(userId?: number): Promise<string | null> {
  // This is a simulation - in production you'd use Telegram's API
  // to get the user's phone number after they share it
  
  // For demo, we'll allow the first whitelisted phone
  return whitelistedPhones[0] || null;
}

// Admin-only middleware
export const adminOnlyMiddleware = async (ctx: AuthContext, next: () => Promise<void>) => {
  if (!ctx.session?.isAdmin) {
    await ctx.reply('🔒 This command requires administrator privileges.');
    return;
  }
  
  await next();
};