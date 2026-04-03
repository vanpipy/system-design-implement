# General RAG System - Deployment Guide

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd general-rag
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# Access API docs
# Open http://localhost:8000/docs
```

## Deployment Options

### 1. Development (Docker Compose)
- PostgreSQL: localhost:5432
- Qdrant: localhost:6333
- Redis: localhost:6379
- App: localhost:8000
- App (Dev): localhost:8001 (hot reload)

### 2. Production (Docker)
```bash
docker build -t general-rag:latest .
docker run -d -p 8000:8000 --env-file .env general-rag:latest
```

### 3. Kubernetes
See `k8s/` directory for sample manifests.

## Configuration

### Required Environment Variables
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `DEEPSEEK_API_KEY`
- `SECRET_KEY`

### Configuration Files
- `config/settings.yaml` - Main config
- `.env` - Environment variables

## Database Setup

```bash
# Run migrations
docker-compose run migrations

# Backup
docker-compose exec postgres pg_dump -U postgres general_rag > backup.sql
```

## Monitoring

- Health: `/api/v1/health`
- Metrics: `/api/v1/health/metrics`
- Logs: `logs/general_rag.log`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env`
2. **Database connection**: Check PostgreSQL is running
3. **API key missing**: Set `DEEPSEEK_API_KEY` in `.env`

### Logs
```bash
# View logs
docker-compose logs -f app
docker-compose logs -f postgres
```

## Maintenance

### Updates
```bash
git pull
docker-compose build
docker-compose up -d
```

### Backup
```bash
# Database
docker-compose exec postgres pg_dump -U postgres general_rag > backup_$(date +%Y%m%d).sql

# Uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## Security

1. Change default passwords in `.env`
2. Use HTTPS in production
3. Set up firewall rules
4. Regular updates