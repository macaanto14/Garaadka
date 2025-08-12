# Garaadka Telegram Bot

Telegram bot for quick access to the Garaadka Laundry Management System.

## Setup Instructions

### 1. Create Telegram Bot
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token

### 2. Install Dependencies
```bash
cd telegram-bot
npm install
```

### 3. Configure Environment
1. Copy `.env.example` to `.env`
2. Add your bot token
3. Configure database connection
4. Add whitelisted phone numbers

### 4. Run the Bot
```bash
# Development
npm run dev

# Production
npm start
```

## Features

- 🔍 **Smart Search**: Search customers by phone number
- 📱 **Phone Whitelisting**: Secure access control
- 📊 **Quick Stats**: Business statistics and reports
- 💰 **Payment Tracking**: View unpaid orders
- 🛍️ **Order Management**: View and track orders
- 📋 **Legacy Data**: Access to historical register data

## Commands

- `/start` - Welcome message and help
- `/search [phone]` - Search customer by phone
- `/customer [phone]` - Get customer details
- `/latest [phone]` - Get latest order for customer
- `/orders` - View recent orders
- `/unpaid` - List unpaid orders
- `/stats` - Business statistics
- `/ping` - System status
- `/help` - Show help message

## Security

- Phone number whitelisting
- Session-based authentication
- Admin-only commands
- Input validation and sanitization

## Usage Examples

1. **Search by phone**: Send `0911123456` or use `/search 0911123456`
2. **Get order details**: Send `#12345` for order ID 12345
3. **Quick customer lookup**: `/latest 0911123456`
4. **Check unpaid orders**: `/unpaid`