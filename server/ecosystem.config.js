module.exports = {
  apps: [{
    name: 'garaadka-backend',
    script: 'index.ts',
    cwd: '/var/www/garaadka/server',
    interpreter: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/garaadka/error.log',
    out_file: '/var/log/garaadka/out.log',
    log_file: '/var/log/garaadka/combined.log',
    time: true
  }]
};