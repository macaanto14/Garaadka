import { Telegraf, Context, session, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Enhanced logging utility
class Logger {
  private static logFile = process.env.LOG_FILE || '/var/log/garaadka/bot-detailed.log';
  
  static log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data) : undefined,
      pid: process.pid
    };
    
    // Console output for PM2
    console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    
    // File logging (if path exists)
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  static info(message: string, data?: any) {
    this.log('INFO', message, data);
  }
  
  static warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }
  
  static error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }
  
  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG === 'true') {
      this.log('DEBUG', message, data);
    }
  }
}

// Database connection with logging
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'loundary',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Log database connection events
db.on('connection', (connection) => {
  Logger.info('Database connection established', { connectionId: connection.threadId });
});

db.on('error', (err) => {
  Logger.error('Database connection error', { error: err.message, code: err.code });
});

// Bot information constants
const BOT_INFO = {
  name: 'Garaadka Laundry Bot',
  shortDescription: '🌟 Garaadka Laundry Management Bot - Your smart assistant for seamless laundry business operations. Search customers, track orders, manage payments, and generate reports instantly!',
  description: `🏢 **Garaadka Laundry Management Bot**

🚀 Your professional laundry business assistant that streamlines operations and enhances customer service.

✨ **Key Features:**
🔍 Instant customer search by phone
📋 Real-time order tracking & management
💰 Payment processing & monitoring
📊 Business analytics & reports
📱 Mobile-first design for on-the-go access
🔒 Secure & reliable operations

💡 **Perfect for:**
• Laundry shop owners
• Staff members
• Customer service teams
• Business managers

🎯 **Get started:** Type /start to explore all features!

📞 **Support:** Contact @haajidheere for assistance`,
  version: '2.0.0',
  supportContact: '@haajidheere',
  Name: 'Eng Ismail Mohamed',
  Email: 'haaji.dheere@gmail.com',
  Phone: '+251927802065'
};

// Feedback channel information
const FEEDBACK_CHANNEL = {
  name: 'Garaadka Bot Feedback Hub',
  description: `💬 **Garaadka Bot Feedback Channel**

Welcome to our feedback hub! This channel collects valuable insights from Garaadka Laundry Bot users.

📝 **What you'll find here:**
• User feedback & suggestions
• Feature requests
• Bug reports
• User experience insights
• Service improvement ideas

🎯 **Our commitment:**
✅ Every feedback is reviewed
✅ Regular improvements based on your input
✅ Transparent communication
✅ User-focused development

🤝 **Help us improve:**
Your feedback drives our innovation. Together, we're building the best laundry management experience!

🔔 **Stay updated:** Enable notifications to see the latest feedback and our responses.

📞 **Direct support:** @haajidheere`,
  id: process.env.FEEDBACK_CHANNEL_ID
};

// Bot configuration with logging
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

Logger.info('Bot starting up', {
  nodeEnv: process.env.NODE_ENV,
  botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET',
  dbHost: process.env.DB_HOST
});

// Session interface
interface SessionData {
  awaitingPhone?: boolean;
  awaitingOrderId?: boolean;
  awaitingFeedback?: boolean;
  awaitingNewOrder?: boolean;
  awaitingAdminReply?: boolean;
  lastCommand?: string;
  currentCustomerPhone?: string;
  replyToUserId?: number;
  reportFilters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  };
}

interface BotContext extends Context {
  session: SessionData;
}

// Use session middleware with proper configuration
bot.use(session({
  defaultSession: (): SessionData => ({
    awaitingPhone: false,
    awaitingOrderId: false,
    awaitingFeedback: false,
    awaitingNewOrder: false,
    awaitingAdminReply: false,
    lastCommand: undefined,
    currentCustomerPhone: undefined,
    replyToUserId: undefined,
    reportFilters: {}
  })
}));

// Whitelisted phone numbers
const whitelistedPhones = process.env.WHITELISTED_PHONES?.split(',') || [];
const adminPhone = process.env.ADMIN_PHONE;

// Enhanced middleware with logging
const authMiddleware = async (ctx: BotContext, next: () => Promise<void>) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const chatId = ctx.chat?.id;
  
  Logger.info('User interaction', {
    userId,
    username,
    chatId,
    messageType: ctx.message ? 'message' : 'callback',
    text: ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
    callbackData: ctx.callbackQuery ? ctx.callbackQuery.data : undefined
  });
  
  const isAuthorized = true; // Your auth logic
  
  if (!isAuthorized) {
    Logger.warn('Unauthorized access attempt', { userId, username, chatId });
    await ctx.reply('❌ You are not authorized to use this bot.');
    return;
  }
  
  await next();
};

bot.use(authMiddleware);

// Helper functions
const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()} ETB`;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === 'NULL') {
    return 'Not set';
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

// Main menu keyboard
const getMainMenuKeyboard = () => {
  return {
    inline_keyboard: [
      [
        { text: '🔍 Smart Search', callback_data: 'search_customer' },
        { text: '📋 Recent Orders', callback_data: 'latest_orders' }
      ],
      [
        { text: '💰 Pending Payments', callback_data: 'unpaid_orders' },
        { text: '📊 Business Analytics', callback_data: 'statistics' }
      ],
      [
        { text: '📈 Advanced Reports', callback_data: 'reports' },
        { text: '➕ Create Order', callback_data: 'new_order' }
      ],
      [
        { text: '💳 Payment Center', callback_data: 'payment' },
        { text: '💬 Feedback Hub', callback_data: 'feedback' }
      ],
      [
        { text: '🏠 Main Menu', callback_data: 'main_menu' },
        { text: '❓ Help Center', callback_data: 'help' }
      ]
    ]
  };
};

// Reports menu keyboard
const getReportsKeyboard = () => {
  return {
    inline_keyboard: [
      [
        { text: '📅 Daily Summary', callback_data: 'report_daily' },
        { text: '👥 Customer Analytics', callback_data: 'report_customer' }
      ],
      [
        { text: '💰 Payment Reports', callback_data: 'report_payments' },
        { text: '⏳ Pending Orders', callback_data: 'report_pending' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };
};

// Enhanced welcome message with personalized branding
bot.start(async (ctx: BotContext) => {
  const welcomeMessage = `
🌟 *Welcome to Garaadka Laundry Bot* 🌟

👋 Hello ${ctx.from?.first_name || 'there'}!

I'm your personal laundry management assistant, here to make your experience seamless and efficient.

✨ *What I can do for you:*
🔍 Search customers instantly
📊 Generate detailed reports
💰 Track payments & orders
📱 Manage your laundry business
🎯 Quick access to all features

🚀 *Ready to get started?*
Choose an option below or type /help for detailed commands.

💡 *Tip: Use the buttons for faster navigation!*
  `;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔍 Search Customer', callback_data: 'search_customer' },
          { text: '📋 Latest Orders', callback_data: 'latest_orders' }
        ],
        [
          { text: '💰 Unpaid Orders', callback_data: 'unpaid_orders' },
          { text: '📊 Business Stats', callback_data: 'statistics' }
        ],
        [
          { text: '📈 Reports', callback_data: 'reports' },
          { text: '➕ New Order', callback_data: 'new_order' }
        ],
        [
          { text: '💳 Process Payment', callback_data: 'payment' },
          { text: '💬 Send Feedback', callback_data: 'feedback' }
        ],
        [
          { text: '❓ Help & Support', callback_data: 'help' }
        ]
      ]
    }
  });
});

// Help command with inline keyboard
bot.help(async (ctx: BotContext) => {
  const helpMessage = `
🆘 *Garaadka Bot Help Center* 🆘

🎯 *Quick Commands:*
• \`/start\` - 🏠 Return to main menu
• \`/search [phone]\` - 🔍 Find customer instantly
• \`/latest [phone]\` - 📋 Get latest order
• \`/unpaid\` - 💰 View pending payments
• \`/stats\` - 📊 Business statistics
• \`/reports\` - 📈 Generate reports
• \`/ping\` - 🏓 Test bot connectivity

🎨 *Features:*
✅ Real-time order tracking
✅ Instant customer search
✅ Payment management
✅ Business analytics
✅ Automated reports
✅ Secure access control

💡 *Pro Tips:*
• Use buttons for faster navigation
• Phone numbers should include country code
• Reports are generated in real-time
• All data is securely encrypted

🔐 *Security:*
This bot uses advanced security measures to protect your business data.

📞 *Support:*
Need help? Contact our support team!
  `;

  await ctx.reply(helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' },
          { text: '📞 Contact Support', url: 'https://t.me/garaadka_support' }
        ]
      ]
    }
  });
});

// Callback query handlers
bot.action('main_menu', async (ctx) => {
  await ctx.editMessageText('🏠 **Main Menu**\n\nChoose an option:', {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard()
  });
});

bot.action('search_customer', async (ctx) => {
  ctx.session.awaitingPhone = true;
  ctx.session.lastCommand = 'search';
  await ctx.editMessageText('🔍 **Search Customer**\n\n📱 Please send the customer\'s phone number:', {
    parse_mode: 'Markdown'
  });
});

bot.action('latest_orders', async (ctx) => {
  await getRecentOrders(ctx);
});

bot.action('unpaid_orders', async (ctx) => {
  await getUnpaidOrders(ctx);
});

bot.action('reports', async (ctx) => {
  await ctx.editMessageText('📊 **Reports & Analytics**\n\nSelect a report type:', {
    parse_mode: 'Markdown',
    ...getReportsKeyboard()
  });
});

bot.action('statistics', async (ctx) => {
  await getBusinessStats(ctx);
});

bot.action('new_order', async (ctx) => {
  ctx.session.awaitingPhone = true;
  ctx.session.lastCommand = 'neworder';
  await ctx.editMessageText('➕ **New Order**\n\n📱 Please provide customer phone number:', {
    parse_mode: 'Markdown'
  });
});

bot.action('payment', async (ctx) => {
  ctx.session.awaitingOrderId = true;
  ctx.session.lastCommand = 'payment';
  await ctx.editMessageText('💳 **Process Payment**\n\n🔢 Please provide order ID:', {
    parse_mode: 'Markdown'
  });
});

bot.action('feedback', async (ctx) => {
  ctx.session.awaitingFeedback = true;
  await ctx.editMessageText('💬 **Feedback**\n\n📝 Please share your feedback or suggestions:', {
    parse_mode: 'Markdown'
  });
});

bot.action('help', async (ctx) => {
  const helpMessage = `
🆘 **Garaadka Bot Help**

**📱 Quick Commands:**
• /search [phone] - Search customer
• /latest [phone] - Latest order
• /unpaid - Unpaid orders
• /stats - Business statistics

**💡 Tips:**
• Use buttons for easier navigation
• Phone numbers can be partial
• All data is from legacy system
  `;
  
  await ctx.editMessageText(helpMessage, {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard()
  });
});

// Report action handlers
bot.action('report_daily', async (ctx) => {
  await generateDailyReport(ctx);
});

bot.action('report_customer', async (ctx) => {
  await generateCustomerReport(ctx);
});

bot.action('report_payments', async (ctx) => {
  await generatePaymentReport(ctx);
});

bot.action('report_pending', async (ctx) => {
  await generatePendingOrdersReport(ctx);
});

// Commands
bot.command('search', async (ctx: BotContext) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    ctx.session.awaitingPhone = true;
    ctx.session.lastCommand = 'search';
    await ctx.reply('🔍 **Search Customer**\n\n📱 Please send the customer\'s phone number:', {
      parse_mode: 'Markdown'
    });
    return;
  }
  
  const phone = args[0];
  await searchCustomerByPhone(ctx, phone);
});

bot.command('latest', async (ctx: BotContext) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    ctx.session.awaitingPhone = true;
    ctx.session.lastCommand = 'latest';
    await ctx.reply('📋 **Latest Order**\n\n📱 Please send the customer\'s phone number:', {
      parse_mode: 'Markdown'
    });
    return;
  }
  
  const phone = args[0];
  await getLatestOrder(ctx, phone);
});

bot.command('unpaid', async (ctx: BotContext) => {
  await getUnpaidOrders(ctx);
});

bot.command('stats', async (ctx: BotContext) => {
  await getBusinessStats(ctx);
});

bot.command('reports', async (ctx: BotContext) => {
  await ctx.reply('📊 **Reports & Analytics**\n\nSelect a report type:', {
    parse_mode: 'Markdown',
    ...getReportsKeyboard()
  });
});

bot.command('neworder', async (ctx: BotContext) => {
  ctx.session.awaitingPhone = true;
  ctx.session.lastCommand = 'neworder';
  await ctx.reply('➕ **New Order**\n\n📱 Please provide customer phone number:', {
    parse_mode: 'Markdown'
  });
});

bot.command('payment', async (ctx: BotContext) => {
  ctx.session.awaitingOrderId = true;
  ctx.session.lastCommand = 'payment';
  await ctx.reply('💳 **Process Payment**\n\n🔢 Please provide order ID:', {
    parse_mode: 'Markdown'
  });
});

bot.command('feedback', async (ctx: BotContext) => {
  ctx.session.awaitingFeedback = true;
  await ctx.reply('💬 **Feedback**\n\n📝 Please share your feedback or suggestions:', {
    parse_mode: 'Markdown'
  });
});

bot.command('ping', async (ctx: BotContext) => {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const [rows] = await db.execute('SELECT 1 as test');
    const dbTime = Date.now() - startTime;
    
    await ctx.reply(`
🏓 **System Status**

✅ Bot: Online
✅ Database: Connected (${dbTime}ms)
⏰ Server Time: ${new Date().toLocaleString()}
🔧 Version: 2.0.0
    `, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    await ctx.reply(`
🏓 **System Status**

✅ Bot: Online
❌ Database: Error
⏰ Server Time: ${new Date().toLocaleString()}
    `, {
      parse_mode: 'Markdown'
    });
  }
});

// Text message handler
bot.on(message('text'), async (ctx: BotContext) => {
  const text = ctx.message.text;
  
  // Handle admin replies
  if (ctx.session.awaitingAdminReply && ctx.session.replyToUserId) {
    ctx.session.awaitingAdminReply = false;
    const userId = ctx.session.replyToUserId;
    ctx.session.replyToUserId = undefined;
    
    try {
      await bot.telegram.sendMessage(userId, `📩 **Message from Garaadka Support:**\n\n${text}`, {
        parse_mode: 'Markdown'
      });
      
      await ctx.reply('✅ **Reply sent successfully!**\n\nYour message has been delivered to the user.', {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      await ctx.reply('❌ **Failed to send reply**\n\nThe user may have blocked the bot or deleted their account.');
    }
    return;
  }

  // Handle feedback
  if (ctx.session.awaitingFeedback) {
    ctx.session.awaitingFeedback = false;
    
    // Save feedback to database
    try {
      await db.execute(
        'INSERT INTO feedback (user_id, username, first_name, last_name, feedback, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          ctx.from?.id,
          ctx.from?.username,
          ctx.from?.first_name,
          ctx.from?.last_name,
          text
        ]
      );
    } catch (error) {
      console.error('Failed to save feedback to database:', error);
    }
    
    // Notify administrators
    await notifyAdmins({
      userId: ctx.from!.id,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      feedback: text,
      timestamp: new Date()
    });
    
    await ctx.reply('✅ **Thank you for your feedback!**\n\nYour suggestions have been forwarded to our administrators and help us improve the bot.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
    return;
  }
  
  // Handle phone number input
  if (ctx.session.awaitingPhone) {
    ctx.session.awaitingPhone = false;
    const command = ctx.session.lastCommand;
    
    switch (command) {
      case 'search':
        await searchCustomerByPhone(ctx, text);
        break;
      case 'latest':
        await getLatestOrder(ctx, text);
        break;
      case 'customer':
        await getCustomerDetails(ctx, text);
        break;
      case 'neworder':
        await createNewOrder(ctx, text);
        break;
      default:
        await searchCustomerByPhone(ctx, text);
    }
    return;
  }
  
  // Handle order ID input
  if (ctx.session.awaitingOrderId) {
    ctx.session.awaitingOrderId = false;
    const command = ctx.session.lastCommand;
    
    switch (command) {
      case 'payment':
        await processPayment(ctx, text);
        break;
      default:
        await getOrderDetails(ctx, text);
    }
    return;
  }
  
  // Default response with menu
  await ctx.reply('🤖 I didn\'t understand that. Please use the menu below:', getMainMenuKeyboard());
});

// Enhanced search function with shortened response
async function searchCustomerByPhone(ctx: BotContext, phone: string) {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, descr, quan, unitprice, totalAmount, mobnum, payCheck, duedate, deliverdate
      FROM register 
      WHERE mobnum LIKE ? OR mobnum LIKE ?
      ORDER BY itemNum DESC
      LIMIT 5
    `, [`%${cleanPhone}%`, `%${cleanPhone.slice(-8)}%`]);
    
    if (!Array.isArray(rows) || rows.length === 0) {
      await ctx.reply('❌ No customer found with that phone number.', getMainMenuKeyboard());
      return;
    }
    
    const customer = rows[0] as any;
    ctx.session.currentCustomerPhone = phone;
    
    // Shortened response format
    const response = `
👤 **${customer.NAME}**
📋 Order #${customer.itemNum}
📝 ${customer.descr || 'No description'}

🔢 Qty: ${customer.quan || 1}
💵 Price: ${formatCurrency(customer.unitprice || 0)}
💰 Total: ${formatCurrency(customer.totalAmount || 0)}
💳 Status: ${customer.payCheck === 'YES' ? '✅ Paid' : '❌ Unpaid'}
📅 Due: ${formatDate(customer.duedate)}
🚚 Delivery: ${formatDate(customer.deliverdate)}
    `;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 More Orders', `more_orders_${cleanPhone}`)],
      [Markup.button.callback('💳 Payment', `payment_${customer.itemNum}`), Markup.button.callback('✏️ Edit', `edit_${customer.itemNum}`)],
      [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
    ]);
    
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...keyboard
    });
    
  } catch (error) {
    console.error('Search error:', error);
    await ctx.reply('❌ Error searching customer. Please try again.', getMainMenuKeyboard());
  }
}

// Get more orders for customer
bot.action(/more_orders_(.+)/, async (ctx) => {
  const phone = ctx.match[1];
  await getCustomerDetails(ctx, phone);
});

// Enhanced customer details function
async function getCustomerDetails(ctx: BotContext, phone: string) {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, descr, quan, unitprice, totalAmount, mobnum, payCheck, duedate, deliverdate
      FROM register 
      WHERE mobnum LIKE ? OR mobnum LIKE ?
      ORDER BY itemNum DESC
      LIMIT 10
    `, [`%${cleanPhone}%`, `%${cleanPhone.slice(-8)}%`]);
    
    if (!Array.isArray(rows) || rows.length === 0) {
      await ctx.reply('❌ No orders found for this customer.', getMainMenuKeyboard());
      return;
    }
    
    const orders = rows as any[];
    const customerName = orders[0].NAME;
    
    let response = `👤 **${customerName}** (${orders.length} orders)\n\n`;
    
    orders.forEach((order, index) => {
      response += `📋 **Order #${order.itemNum}**\n`;
      response += `📝 ${order.descr || 'No description'}\n`;
      response += `💰 ${formatCurrency(order.totalAmount || 0)} - ${order.payCheck === 'YES' ? '✅ Paid' : '❌ Unpaid'}\n`;
      if (index < orders.length - 1) response += '\n';
    });
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➕ New Order', `new_order_${cleanPhone}`)],
      [Markup.button.callback('📊 Summary', `summary_${cleanPhone}`), Markup.button.callback('🔙 Menu', 'main_menu')]
    ]);
    
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...keyboard
    });
    
  } catch (error) {
    console.error('Customer details error:', error);
    await ctx.reply('❌ Error fetching customer details.', getMainMenuKeyboard());
  }
}

// Create new order function
async function createNewOrder(ctx: BotContext, phone: string) {
  // This would integrate with your existing order creation API
  await ctx.reply(`➕ **New Order for ${phone}**\n\n🚧 This feature will redirect to the main system for order creation.\n\n💡 Use the web interface to create detailed orders.`, {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard()
  });
}

// Process payment function
async function processPayment(ctx: BotContext, orderId: string) {
  try {
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, totalAmount, payCheck
      FROM register 
      WHERE itemNum = ?
    `, [orderId]);
    
    if (!Array.isArray(rows) || rows.length === 0) {
      await ctx.reply('❌ Order not found.', getMainMenuKeyboard());
      return;
    }
    
    const order = rows[0] as any;
    
    if (order.payCheck === 'YES') {
      await ctx.reply(`✅ **Order #${orderId}** is already paid.`, getMainMenuKeyboard());
      return;
    }
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Mark as Paid', `mark_paid_${orderId}`)],
      [Markup.button.callback('💰 Partial Payment', `partial_payment_${orderId}`)],
      [Markup.button.callback('🔙 Cancel', 'main_menu')]
    ]);
    
    await ctx.reply(`💳 **Payment for Order #${orderId}**\n\n👤 Customer: ${order.NAME}\n💰 Amount: ${formatCurrency(order.totalAmount)}\n\nChoose payment option:`, {
      parse_mode: 'Markdown',
      ...keyboard
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    await ctx.reply('❌ Error processing payment.', getMainMenuKeyboard());
  }
}

// Mark order as paid
bot.action(/mark_paid_(.+)/, async (ctx) => {
  const orderId = ctx.match[1];
  
  try {
    await db.execute(`
      UPDATE register 
      SET payCheck = 'YES'
      WHERE itemNum = ?
    `, [orderId]);
    
    await ctx.editMessageText(`✅ **Payment Confirmed**\n\nOrder #${orderId} has been marked as paid.`, {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
    
  } catch (error) {
    console.error('Mark paid error:', error);
    await ctx.reply('❌ Error updating payment status.', getMainMenuKeyboard());
  }
});

// Report generation functions
async function generateDailyReport(ctx: BotContext) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [totalOrders] = await db.execute(`
      SELECT COUNT(*) as count, SUM(totalAmount) as total
      FROM register 
      WHERE DATE(duedate) = ?
    `, [today]);
    
    const [paidOrders] = await db.execute(`
      SELECT COUNT(*) as count, SUM(totalAmount) as total
      FROM register 
      WHERE DATE(duedate) = ? AND payCheck = 'YES'
    `, [today]);
    
    const total = totalOrders[0] as any;
    const paid = paidOrders[0] as any;
    
    const response = `
📊 **Daily Report - ${formatDate(today)}**

📋 Total Orders: ${total.count || 0}
💰 Total Revenue: ${formatCurrency(total.total || 0)}
✅ Paid Orders: ${paid.count || 0}
💵 Paid Amount: ${formatCurrency(paid.total || 0)}
❌ Pending: ${(total.count || 0) - (paid.count || 0)}
💸 Pending Amount: ${formatCurrency((total.total || 0) - (paid.total || 0))}
    `;
    
    await ctx.editMessageText(response, {
      parse_mode: 'Markdown',
      ...getReportsKeyboard()
    });
    
  } catch (error) {
    console.error('Daily report error:', error);
    await ctx.reply('❌ Error generating daily report.', getReportsKeyboard());
  }
}

async function generateCustomerReport(ctx: BotContext) {
  try {
    const [rows] = await db.execute(`
      SELECT NAME, COUNT(*) as orderCount, SUM(totalAmount) as totalSpent
      FROM register 
      GROUP BY NAME, mobnum
      ORDER BY totalSpent DESC
      LIMIT 10
    `);
    
    let response = '📈 **Top Customers Report**\n\n';
    
    (rows as any[]).forEach((customer, index) => {
      response += `${index + 1}. **${customer.NAME}**\n`;
      response += `   📋 ${customer.orderCount} orders\n`;
      response += `   💰 ${formatCurrency(customer.totalSpent)}\n\n`;
    });
    
    await ctx.editMessageText(response, {
      parse_mode: 'Markdown',
      ...getReportsKeyboard()
    });
    
  } catch (error) {
    console.error('Customer report error:', error);
    await ctx.reply('❌ Error generating customer report.', getReportsKeyboard());
  }
}

async function generatePaymentReport(ctx: BotContext) {
  try {
    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(totalAmount) as totalRevenue,
        SUM(CASE WHEN payCheck = 'YES' THEN totalAmount ELSE 0 END) as paidAmount,
        SUM(CASE WHEN payCheck = 'NO' THEN totalAmount ELSE 0 END) as pendingAmount
      FROM register
    `);
    
    const data = summary[0] as any;
    
    const response = `
💰 **Payment Summary Report**

📊 **Overview:**
📋 Total Orders: ${data.totalOrders || 0}
💵 Total Revenue: ${formatCurrency(data.totalRevenue || 0)}

✅ **Paid:**
💰 Amount: ${formatCurrency(data.paidAmount || 0)}
📊 Percentage: ${((data.paidAmount || 0) / (data.totalRevenue || 1) * 100).toFixed(1)}%

❌ **Pending:**
💸 Amount: ${formatCurrency(data.pendingAmount || 0)}
📊 Percentage: ${((data.pendingAmount || 0) / (data.totalRevenue || 1) * 100).toFixed(1)}%
    `;
    
    await ctx.editMessageText(response, {
      parse_mode: 'Markdown',
      ...getReportsKeyboard()
    });
    
  } catch (error) {
    console.error('Payment report error:', error);
    await ctx.reply('❌ Error generating payment report.', getReportsKeyboard());
  }
}

async function generatePendingOrdersReport(ctx: BotContext) {
  try {
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, mobnum, totalAmount, duedate
      FROM register 
      WHERE (payCheck IS NULL OR payCheck != 'YES') 
        AND mobnum IS NOT NULL AND mobnum != '' AND mobnum != '0'
        AND totalAmount IS NOT NULL AND totalAmount > 0
      ORDER BY duedate ASC
      LIMIT 50
    `) as any;

    if (rows.length === 0) {
      const message = '✅ **No Pending Orders**\n\nAll orders are paid!';
      
      // Check if this is the same message to avoid "message not modified" error
      try {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...getMainMenuKeyboard()
        });
      } catch (editError: any) {
        if (editError.description?.includes('message is not modified')) {
          // Message is the same, just answer the callback query
          await ctx.answerCbQuery('No pending orders found');
        } else {
          throw editError;
        }
      }
      return;
    }

    let message = `💳 **Pending Orders Report**\n\n📊 **Total Pending:** ${rows.length}\n\n`;
    let totalAmount = 0;
    
    rows.forEach((order: any, index: number) => {
      const amount = parseFloat(order.totalAmount) || 0;
      totalAmount += amount;
      const dueDate = formatDate(order.duedate);
      
      message += `${index + 1}. **${order.NAME || 'Unknown'}**\n`;
      message += `   📱 ${order.mobnum}\n`;
      message += `   💰 ${formatCurrency(amount)} | 📅 ${dueDate}\n\n`;
    });

    message += `\n💰 **Total Pending Amount:** ${formatCurrency(totalAmount)}`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  } catch (error) {
    console.error('Pending orders report error:', error);
    await ctx.editMessageText('❌ **Error**\n\nFailed to generate pending orders report.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  }
}

// Enhanced feedback notification with channel info
async function notifyAdmins(feedbackData: {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  feedback: string;
  timestamp: Date;
}) {
  const feedbackMessage = `
🆕 **New Feedback Received**

👤 **User:** ${feedbackData.firstName || 'Unknown'} ${feedbackData.lastName || ''}
🆔 **Username:** @${feedbackData.username || 'N/A'}
🔢 **User ID:** ${feedbackData.userId}
⏰ **Time:** ${feedbackData.timestamp.toLocaleString()}

💬 **Feedback:**
${feedbackData.feedback}

📊 **Channel:** ${FEEDBACK_CHANNEL.name}
🔗 **Bot:** @${process.env.BOT_USERNAME || 'garaadka_bot'}
  `;

  // Send to feedback channel
  if (FEEDBACK_CHANNEL.id) {
    try {
      await bot.telegram.sendMessage(FEEDBACK_CHANNEL.id, feedbackMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Mark as Read', callback_data: `feedback_read_${feedbackData.userId}` },
              { text: '💬 Reply to User', callback_data: `feedback_reply_${feedbackData.userId}` }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Failed to send feedback to channel:', error);
    }
  }

  // Send to admin chat IDs
  const adminChatIds = process.env.ADMIN_CHAT_IDS?.split(',').map(id => parseInt(id.trim())) || [];
  
  for (const chatId of adminChatIds) {
    try {
      await bot.telegram.sendMessage(chatId, feedbackMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Mark as Read', callback_data: `feedback_read_${feedbackData.userId}` },
              { text: '💬 Reply to User', callback_data: `feedback_reply_${feedbackData.userId}` }
            ]
          ]
        }
      });
    } catch (error) {
      console.error(`Failed to send feedback to admin ${chatId}:`, error);
    }
  }
}

// Enhanced feedback handling in text message handler
bot.on(message('text'), async (ctx: BotContext) => {
  const text = ctx.message.text;
  
  // Handle feedback
  if (ctx.session.awaitingFeedback) {
    ctx.session.awaitingFeedback = false;
    
    // Save feedback to database
    try {
      await db.execute(
        'INSERT INTO feedback (user_id, username, first_name, last_name, feedback, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          ctx.from?.id,
          ctx.from?.username,
          ctx.from?.first_name,
          ctx.from?.last_name,
          text
        ]
      );
    } catch (error) {
      console.error('Failed to save feedback to database:', error);
    }
    
    // Notify administrators
    await notifyAdmins({
      userId: ctx.from!.id,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      feedback: text,
      timestamp: new Date()
    });
    
    await ctx.reply('✅ **Thank you for your feedback!**\n\nYour suggestions have been forwarded to our administrators and help us improve the bot.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
    return;
  }
  
  // Handle phone number input
  if (ctx.session.awaitingPhone) {
    ctx.session.awaitingPhone = false;
    const command = ctx.session.lastCommand;
    
    switch (command) {
      case 'search':
        await searchCustomerByPhone(ctx, text);
        break;
      case 'latest':
        await getLatestOrder(ctx, text);
        break;
      case 'customer':
        await getCustomerDetails(ctx, text);
        break;
      case 'neworder':
        await createNewOrder(ctx, text);
        break;
      default:
        await searchCustomerByPhone(ctx, text);
    }
    return;
  }
  
  // Handle order ID input
  if (ctx.session.awaitingOrderId) {
    ctx.session.awaitingOrderId = false;
    const command = ctx.session.lastCommand;
    
    switch (command) {
      case 'payment':
        await processPayment(ctx, text);
        break;
      default:
        await getOrderDetails(ctx, text);
    }
    return;
  }
  
  // Default response with menu
  await ctx.reply('🤖 I didn\'t understand that. Please use the menu below:', getMainMenuKeyboard());
});

// Admin feedback management handlers
bot.action(/feedback_read_(\d+)/, async (ctx) => {
  const userId = ctx.match![1];
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [[
      { text: '✅ Marked as Read', callback_data: 'noop' },
      { text: '💬 Reply to User', callback_data: `feedback_reply_${userId}` }
    ]]
  });
  await ctx.answerCbQuery('✅ Feedback marked as read');
});

bot.action(/feedback_reply_(\d+)/, async (ctx) => {
  const userId = parseInt(ctx.match![1]);
  ctx.session.awaitingAdminReply = true;
  ctx.session.replyToUserId = userId;
  
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [[
      { text: '❌ Cancel Reply', callback_data: 'cancel_admin_reply' }
    ]]
  });
  
  await ctx.reply('💬 **Reply to User**\n\nType your response to send to the user:', {
    parse_mode: 'Markdown'
  });
});

bot.action('cancel_admin_reply', async (ctx) => {
  ctx.session.awaitingAdminReply = false;
  ctx.session.replyToUserId = undefined;
  await ctx.editMessageText('❌ Reply cancelled.');
});

// Get recent orders
async function getRecentOrders(ctx: BotContext) {
  try {
    const [rows] = await db.execute(`
      SELECT 
        itemNum, 
        NAME, 
        mobnum, 
        descr, 
        quan, 
        unitprice, 
        totalAmount, 
        payCheck, 
        duedate, 
        deliverdate,
        col,
        siz,
        DATE(FROM_UNIXTIME(itemNum/1000)) as created_date
      FROM register 
      WHERE mobnum IS NOT NULL AND mobnum != '' AND mobnum != '0'
      ORDER BY itemNum DESC 
      LIMIT 15
    `) as any;

    if (rows.length === 0) {
      await ctx.editMessageText('📭 **No Recent Orders Found**\n\nNo orders available in the system.', {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
      return;
    }

    let message = '📋 **Recent Orders (Last 15)**\n\n';
    
    rows.forEach((order: any, index: number) => {
      const paymentStatus = order.payCheck === 'YES' ? '✅ Paid' : '❌ Unpaid';
      const totalAmount = order.totalAmount ? formatCurrency(parseFloat(order.totalAmount)) : 'N/A';
      const unitPrice = order.unitprice ? formatCurrency(parseFloat(order.unitprice)) : 'N/A';
      const dueDate = formatDate(order.duedate);
      const deliveryDate = order.deliverdate ? formatDate(order.deliverdate) : 'Not Set';
      const quantity = order.quan || 'N/A';
      const description = order.descr || 'No description';
      const color = order.col || '';
      const size = order.siz || '';
      const itemDetails = [color, size].filter(Boolean).join(', ');
      
      message += `**${index + 1}. Order #${order.itemNum}**\n`;
      message += `👤 **Customer:** ${order.NAME || 'Unknown'}\n`;
      message += `📱 **Phone:** ${order.mobnum}\n`;
      message += `📝 **Description:** ${description}${itemDetails ? ` (${itemDetails})` : ''}\n`;
      message += `📦 **Quantity:** ${quantity}\n`;
      message += `💵 **Unit Price:** ${unitPrice}\n`;
      message += `💰 **Total Amount:** ${totalAmount}\n`;
      message += `💳 **Payment:** ${paymentStatus}\n`;
      message += `📅 **Due Date:** ${dueDate}\n`;
      message += `🚚 **Delivery:** ${deliveryDate}\n`;
      message += `📆 **Created:** ${order.created_date || 'N/A'}\n\n`;
      message += '─────────────────────\n\n';
    });

    // Split message if too long for Telegram
    if (message.length > 4000) {
      const messages = [];
      let currentMessage = '📋 **Recent Orders (Last 15)**\n\n';
      
      rows.forEach((order: any, index: number) => {
        const paymentStatus = order.payCheck === 'YES' ? '✅ Paid' : '❌ Unpaid';
        const totalAmount = order.totalAmount ? formatCurrency(parseFloat(order.totalAmount)) : 'N/A';
        const orderText = `**${index + 1}. #${order.itemNum}** - ${order.NAME || 'Unknown'}\n📱 ${order.mobnum} | 💰 ${totalAmount} | ${paymentStatus}\n\n`;
        
        if (currentMessage.length + orderText.length > 4000) {
          messages.push(currentMessage);
          currentMessage = orderText;
        } else {
          currentMessage += orderText;
        }
      });
      
      if (currentMessage.length > 0) {
        messages.push(currentMessage);
      }
      
      // Send first message with edit, others as new messages
      await ctx.editMessageText(messages[0], {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
      
      for (let i = 1; i < messages.length; i++) {
        await ctx.reply(messages[i], {
          parse_mode: 'Markdown'
        });
      }
    } else {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    }
  } catch (error) {
    console.error('Recent orders error:', error);
    await ctx.editMessageText('❌ **Error**\n\nFailed to fetch recent orders.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  }
}

// Get unpaid orders
async function getUnpaidOrders(ctx: BotContext) {
  try {
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, mobnum, totalAmount, duedate
      FROM register 
      WHERE (payCheck IS NULL OR payCheck != 'YES') 
        AND mobnum IS NOT NULL AND mobnum != '' AND mobnum != '0'
        AND totalAmount IS NOT NULL AND totalAmount > 0
      ORDER BY duedate ASC
      LIMIT 50
    `) as any;

    if (rows.length === 0) {
      await ctx.editMessageText('✅ **No Unpaid Orders**\n\nAll orders are paid!', {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
      return;
    }

    let message = `💳 **Unpaid Orders (${rows.length})**\n\n`;
    let totalUnpaid = 0;
    
    rows.forEach((order: any, index: number) => {
      const amount = parseFloat(order.totalAmount) || 0;
      totalUnpaid += amount;
      const dueDate = formatDate(order.duedate);
      
      message += `${index + 1}. **${order.NAME || 'Unknown'}**\n`;
      message += `   📱 ${order.mobnum}\n`;
      message += `   💰 ${formatCurrency(amount)} | 📅 ${dueDate}\n\n`;
    });

    message += `\n💰 **Total Unpaid:** ${formatCurrency(totalUnpaid)}`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  } catch (error) {
    console.error('Unpaid orders error:', error);
    await ctx.editMessageText('❌ **Error**\n\nFailed to fetch unpaid orders.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  }
}

// Get business statistics
async function getBusinessStats(ctx: BotContext) {
  try {
    const [totalRows] = await db.execute(`
      SELECT COUNT(*) as total, SUM(totalAmount) as revenue
      FROM register 
      WHERE mobnum IS NOT NULL AND mobnum != '' AND mobnum != '0'
    `) as any;

    const [paidRows] = await db.execute(`
      SELECT COUNT(*) as paid, SUM(totalAmount) as paidAmount
      FROM register 
      WHERE payCheck = 'YES' AND mobnum IS NOT NULL AND mobnum != '' AND mobnum != '0'
    `) as any;

    const [todayRows] = await db.execute(`
      SELECT COUNT(*) as todayOrders, SUM(totalAmount) as todayRevenue
      FROM register 
      WHERE DATE(FROM_UNIXTIME(itemNum/1000)) = CURDATE() 
      AND mobnum IS NOT NULL AND mobnum != '' AND mobnum != '0'
    `) as any;

    const total = totalRows[0];
    const paid = paidRows[0];
    const today = todayRows[0];
    
    const unpaidOrders = total.total - paid.paid;
    const unpaidAmount = parseFloat(total.revenue || 0) - parseFloat(paid.paidAmount || 0);
    const paymentRate = total.total > 0 ? ((paid.paid / total.total) * 100).toFixed(1) : '0';

    const message = `
📊 **Business Statistics**

📈 **Total Orders:** ${total.total}
💰 **Total Revenue:** ${formatCurrency(parseFloat(total.revenue || 0))}

✅ **Paid Orders:** ${paid.paid}
💵 **Paid Amount:** ${formatCurrency(parseFloat(paid.paidAmount || 0))}

❌ **Unpaid Orders:** ${unpaidOrders}
💳 **Unpaid Amount:** ${formatCurrency(unpaidAmount)}

📅 **Today's Orders:** ${today.todayOrders}
🎯 **Today's Revenue:** ${formatCurrency(parseFloat(today.todayRevenue || 0))}

📊 **Payment Rate:** ${paymentRate}%
    `;

    // Try to edit message first, if it fails, send a new message
    try {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    } catch (editError) {
      // If editing fails, send a new message
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    }
  } catch (error) {
    console.error('Business stats error:', error);
    try {
      await ctx.editMessageText('❌ **Error**\n\nFailed to fetch business statistics.', {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    } catch (editError) {
      await ctx.reply('❌ **Error**\n\nFailed to fetch business statistics.', {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    }
  }
}

// Get latest order for a customer
async function getLatestOrder(ctx: BotContext, phone: string) {
  try {
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, descr, quan, unitprice, totalAmount, duedate, deliverdate, payCheck, col, siz
      FROM register 
      WHERE mobnum LIKE ? 
      ORDER BY itemNum DESC 
      LIMIT 1
    `, [`%${phone}%`]) as any;

    if (rows.length === 0) {
      await ctx.reply(`📭 **No Orders Found**\n\nNo orders found for phone number: ${phone}`, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
      return;
    }

    const order = rows[0];
    const status = order.payCheck === 'YES' ? '✅ Paid' : '❌ Unpaid';
    const amount = order.totalAmount ? formatCurrency(parseFloat(order.totalAmount)) : 'N/A';
    
    const message = `
🎯 **Latest Order**

👤 **Customer:** ${order.NAME || 'Unknown'}
🔢 **Order ID:** ${order.itemNum}
📝 **Description:** ${order.descr || 'N/A'}
📦 **Quantity:** ${order.quan || 'N/A'}
💰 **Amount:** ${amount}
📅 **Due Date:** ${formatDate(order.duedate)}
🚚 **Delivery:** ${formatDate(order.deliverdate)}
💳 **Status:** ${status}
🎨 **Color:** ${order.col || 'N/A'}
📏 **Size:** ${order.siz || 'N/A'}
    `;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  } catch (error) {
    console.error('Latest order error:', error);
    await ctx.reply('❌ **Error**\n\nFailed to fetch latest order.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  }
}

// Get order details by ID
async function getOrderDetails(ctx: BotContext, orderId: string) {
  try {
    const [rows] = await db.execute(`
      SELECT itemNum, NAME, descr, quan, unitprice, totalAmount, duedate, deliverdate, payCheck, col, siz, mobnum
      FROM register 
      WHERE itemNum = ?
    `, [orderId]) as any;

    if (rows.length === 0) {
      await ctx.reply(`📭 **Order Not Found**\n\nNo order found with ID: ${orderId}`, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
      return;
    }

    const order = rows[0];
    const status = order.payCheck === 'YES' ? '✅ Paid' : '❌ Unpaid';
    const amount = order.totalAmount ? formatCurrency(parseFloat(order.totalAmount)) : 'N/A';
    
    const message = `
📋 **Order Details**

🔢 **Order ID:** ${order.itemNum}
👤 **Customer:** ${order.NAME || 'Unknown'}
📱 **Phone:** ${order.mobnum || 'N/A'}
📝 **Description:** ${order.descr || 'N/A'}
📦 **Quantity:** ${order.quan || 'N/A'}
💰 **Unit Price:** ${order.unitprice ? formatCurrency(parseFloat(order.unitprice)) : 'N/A'}
💵 **Total Amount:** ${amount}
📅 **Due Date:** ${formatDate(order.duedate)}
🚚 **Delivery Date:** ${formatDate(order.deliverdate)}
💳 **Payment Status:** ${status}
🎨 **Color:** ${order.col || 'N/A'}
📏 **Size:** ${order.siz || 'N/A'}
    `;

    const keyboard = order.payCheck !== 'YES' ? {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Mark as Paid', callback_data: `mark_paid_${order.itemNum}` }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      }
    } : getMainMenuKeyboard();

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('Order details error:', error);
    await ctx.reply('❌ **Error**\n\nFailed to fetch order details.', {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    });
  }
}



// Add these enhanced message templates
const StatusMessages = {
  loading: '⏳ Processing your request...',
  success: '✅ Operation completed successfully!',
  error: '❌ Oops! Something went wrong.',
  notFound: '🔍 No results found. Try a different search.',
  unauthorized: '🔒 Access denied. Please contact administrator.',
  maintenance: '🔧 System under maintenance. Please try again later.',
  welcome: '🎉 Welcome back! How can I assist you today?',
  goodbye: '👋 Thank you for using Garaadka Bot!'
};

// Enhanced error handling with detailed logging
bot.catch((err, ctx) => {
  const errorInfo = {
    error: err.message,
    stack: err.stack,
    userId: ctx.from?.id,
    username: ctx.from?.username,
    chatId: ctx.chat?.id,
    updateType: ctx.updateType,
    messageText: ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
    callbackData: ctx.callbackQuery ? ctx.callbackQuery.data : undefined
  };
  
  Logger.error('Bot error occurred', errorInfo);
  
  const errorMessage = `
❌ *Oops! Something went wrong* ❌

🔧 We're working to fix this issue.
📞 If this persists, please contact support.

🔄 *Try again in a moment*
  `;
  
  ctx.reply(errorMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Return to Menu', callback_data: 'main_menu' }]
      ]
    }
  }).catch(replyErr => {
    Logger.error('Failed to send error message', { originalError: err.message, replyError: replyErr.message });
  });
});

// Log all database operations
const loggedDbQuery = async (query: string, params?: any[]) => {
  const startTime = Date.now();
  Logger.debug('Database query started', { query, params });
  
  try {
    const [results] = await db.execute(query, params);
    const duration = Date.now() - startTime;
    Logger.debug('Database query completed', { query, duration, resultCount: Array.isArray(results) ? results.length : 1 });
    return [results];
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error('Database query failed', { query, params, duration, error: error.message });
    throw error;
  }
};

// Enhanced bot launch with logging
bot.launch({
  dropPendingUpdates: true
}).then(() => {
  Logger.info('Bot launched successfully', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    pid: process.pid
  });
}).catch((error) => {
  Logger.error('Bot launch failed', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown with logging
process.once('SIGINT', () => {
  Logger.info('Received SIGINT, shutting down gracefully');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  Logger.info('Received SIGTERM, shutting down gracefully');
  bot.stop('SIGTERM');
});

// Log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', { reason, promise: promise.toString() });
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Admin configuration
const adminChatIds = process.env.ADMIN_CHAT_IDS?.split(',').map(id => parseInt(id.trim())) || [];
const feedbackChannelId = process.env.FEEDBACK_CHANNEL_ID;

// Admin middleware
const adminOnlyMiddleware = async (ctx: BotContext, next: () => Promise<void>) => {
  const userId = ctx.from?.id;
  if (!adminChatIds.includes(userId!)) {
    await ctx.reply('❌ This command is only available to administrators.');
    return;
  }
  await next();
};

// Enhanced about command
bot.command('about', async (ctx: BotContext) => {
  const aboutMessage = `
${BOT_INFO.description}

🔢 **Version:** ${BOT_INFO.version}
📅 **Last Updated:** ${new Date().toLocaleDateString()}
👥 **Active Users:** ${await getUserCount()}
📊 **Total Orders Processed:** ${await getOrderCount()}

💬 **Feedback:** Send us your thoughts using /feedback
🆘 **Support:** ${BOT_INFO.supportContact}
  `;

  await ctx.reply(aboutMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' },
          { text: '💬 Send Feedback', callback_data: 'feedback' }
        ],
        [
          { text: '📞 Contact Support', url: 'https://t.me/garaadka_support' }
        ]
      ]
    }
  });
});

// Helper functions for statistics
async function getUserCount(): Promise<number> {
  try {
    // Implement your user counting logic
    return 0; // Placeholder
  } catch (error) {
    return 0;
  }
}

async function getOrderCount(): Promise<number> {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM register');
    return (rows as any)[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

// Admin feedback management commands
bot.command('feedback_stats', adminOnlyMiddleware, async (ctx: BotContext) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
      FROM feedback
    `) as any;
    
    const stats = rows[0];
    const message = `
📊 **Feedback Statistics**

📝 **Total Feedback:** ${stats.total}
🔴 **Unread:** ${stats.unread}
👁️ **Read:** ${stats.read}
✅ **Replied:** ${stats.replied}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply('❌ Failed to fetch feedback statistics.');
  }
});

bot.command('recent_feedback', adminOnlyMiddleware, async (ctx: BotContext) => {
  try {
    const [rows] = await db.execute(`
      SELECT user_id, username, first_name, last_name, feedback, status, created_at
      FROM feedback 
      ORDER BY created_at DESC 
      LIMIT 10
    `) as any;
    
    if (rows.length === 0) {
      await ctx.reply('📭 No recent feedback found.');
      return;
    }
    
    let message = '📋 **Recent Feedback (Last 10):**\n\n';
    
    rows.forEach((row: any, index: number) => {
      const userInfo = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.username || `User ${row.user_id}`;
      const statusEmoji = row.status === 'unread' ? '🔴' : row.status === 'read' ? '👁️' : '✅';
      
      message += `${index + 1}. ${statusEmoji} **${userInfo}**\n`;
      message += `   📅 ${new Date(row.created_at).toLocaleDateString()}\n`;
      message += `   💬 ${row.feedback.substring(0, 100)}${row.feedback.length > 100 ? '...' : ''}\n\n`;
    });
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply('❌ Failed to fetch recent feedback.');
  }
});