#!/bin/bash

# Garaadka Telegram Bot Log Manager

BOT_NAME="garaadka-telegram-bot"
LOG_DIR="/var/log/garaadka"

case "$1" in
    "live")
        echo "📊 Showing live logs for $BOT_NAME..."
        pm2 logs $BOT_NAME --lines 50
        ;;
    "errors")
        echo "❌ Showing error logs for $BOT_NAME..."
        pm2 logs $BOT_NAME --err --lines 100
        ;;
    "tail")
        echo "📄 Tailing combined logs..."
        tail -f $LOG_DIR/bot-combined.log
        ;;
    "search")
        if [ -z "$2" ]; then
            echo "Usage: $0 search <pattern>"
            exit 1
        fi
        echo "🔍 Searching logs for: $2"
        grep -n "$2" $LOG_DIR/bot-*.log
        ;;
    "errors-today")
        echo "❌ Today's errors:"
        grep "$(date +%Y-%m-%d)" $LOG_DIR/bot-error.log | grep "ERROR"
        ;;
    "stats")
        echo "📊 Log Statistics:"
        echo "Total log files: $(ls -1 $LOG_DIR/bot-*.log | wc -l)"
        echo "Combined log size: $(du -h $LOG_DIR/bot-combined.log | cut -f1)"
        echo "Error log size: $(du -h $LOG_DIR/bot-error.log | cut -f1)"
        echo "Last 24h errors: $(grep "$(date +%Y-%m-%d)" $LOG_DIR/bot-error.log | wc -l)"
        ;;
    "clean")
        echo "🧹 Cleaning old logs..."
        pm2 flush $BOT_NAME
        find $LOG_DIR -name "bot-*.log.*" -mtime +7 -delete
        echo "Old logs cleaned"
        ;;
    "monitor")
        echo "📊 Starting real-time monitoring..."
        pm2 monit
        ;;
    "json")
        echo "📋 Showing structured logs (last 20):"
        tail -n 20 $LOG_DIR/bot-detailed.log | jq .
        ;;
    *)
        echo "Garaadka Bot Log Manager"
        echo "Usage: $0 {live|errors|tail|search|errors-today|stats|clean|monitor|json}"
        echo ""
        echo "Commands:"
        echo "  live         - Show live PM2 logs"
        echo "  errors       - Show error logs only"
        echo "  tail         - Tail combined log file"
        echo "  search <term> - Search logs for specific term"
        echo "  errors-today - Show today's errors"
        echo "  stats        - Show log statistics"
        echo "  clean        - Clean old log files"
        echo "  monitor      - Start PM2 monitoring dashboard"
        echo "  json         - Show structured JSON logs"
        exit 1
        ;;
esac