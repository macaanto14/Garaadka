module.exports = {
  apps: [{
    name: 'garaadka-telegram-bot',
    script: 'bot.ts',
    cwd: '/opt/garaadka/telegram-bot',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    
    // Enhanced logging configuration
    log_type: 'json',
    merge_logs: true,
    time: true,
    
    // Separate log files
    error_file: '/var/log/garaadka/bot-error.log',
    out_file: '/var/log/garaadka/bot-out.log',
    log_file: '/var/log/garaadka/bot-combined.log',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      ENABLE_DEBUG: 'false',
      LOG_LEVEL: 'info',
      LOG_FILE: '/var/log/garaadka/bot-detailed.log'
    },
    
    env_development: {
      NODE_ENV: 'development',
      ENABLE_DEBUG: 'true',
      LOG_LEVEL: 'debug',
      LOG_FILE: '/var/log/garaadka/bot-detailed-dev.log'
    },
    
    // Restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Monitoring
    pmx: true,
    
    // Log rotation (handled by PM2)
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced options
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Custom metrics
    instance_var: 'INSTANCE_ID'
  }]
};