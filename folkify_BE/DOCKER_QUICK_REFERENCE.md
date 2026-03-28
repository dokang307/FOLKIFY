# Docker Quick Reference - FOLKIFY Backend API

Quick reference for common Docker commands and operations.

## Quick Start

```bash
# 1. Create .env file
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker-compose exec api npx prisma migrate deploy

# 4. Seed database (optional)
docker-compose exec api npx prisma db seed

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f
```

## Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build

# Stop and remove volumes (deletes data!)
docker-compose down -v
```

## Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 api

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 api
```

## Database Operations

```bash
# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database
docker-compose exec api npx prisma db seed

# Generate Prisma Client
docker-compose exec api npx prisma generate

# Open Prisma Studio
docker-compose exec api npx prisma studio

# Connect to PostgreSQL
docker-compose exec postgres psql -U folkify -d folkify_db

# Backup database
docker-compose exec postgres pg_dump -U folkify folkify_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U folkify folkify_db < backup.sql
```

## Redis Operations

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Ping Redis
docker-compose exec redis redis-cli ping

# List all keys
docker-compose exec redis redis-cli KEYS '*'

# Get queue length
docker-compose exec redis redis-cli LLEN bull:aiGrading:wait

# Flush all data (WARNING: deletes everything!)
docker-compose exec redis redis-cli FLUSHALL
```

## Container Access

```bash
# Shell into API container
docker-compose exec api sh

# Shell into worker container
docker-compose exec worker sh

# Shell into postgres container
docker-compose exec postgres sh

# Run command in container
docker-compose exec api npm run test
docker-compose exec api node -v
```

## Health Checks

```bash
# API health endpoint
curl http://localhost:3000/api/health

# API metrics endpoint
curl http://localhost:3000/api/health/metrics

# Check container health status
docker-compose ps

# Inspect container health
docker inspect folkify-api --format='{{.State.Health.Status}}'
```

## Troubleshooting

```bash
# View container status
docker-compose ps

# View resource usage
docker stats

# Inspect container
docker inspect folkify-api

# View container processes
docker-compose top

# Remove stopped containers
docker-compose rm

# Prune unused resources
docker system prune

# View disk usage
docker system df
```

## Development Workflow

```bash
# Start only database services for local development
docker-compose up -d postgres redis

# Stop API and worker, keep databases running
docker-compose stop api worker

# View environment variables
docker-compose exec api env

# Copy files from container
docker cp folkify-api:/app/logs/error.log ./local-error.log

# Copy files to container
docker cp ./local-file.txt folkify-api:/app/uploads/
```

## Production Commands

```bash
# Build production image
docker build -t folkify-api:latest .

# Tag image
docker tag folkify-api:latest registry.example.com/folkify-api:latest

# Push to registry
docker push registry.example.com/folkify-api:latest

# Pull from registry
docker pull registry.example.com/folkify-api:latest

# Run production container
docker run -d \
  --name folkify-api \
  -p 3000:3000 \
  --env-file .env \
  folkify-api:latest
```

## Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect folkify_be_postgres_data

# Backup volume
docker run --rm \
  -v folkify_be_uploads_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore volume
docker run --rm \
  -v folkify_be_uploads_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/uploads-backup.tar.gz -C /data

# Remove unused volumes
docker volume prune
```

## Network Management

```bash
# List networks
docker network ls

# Inspect network
docker network inspect folkify_be_folkify-network

# Connect container to network
docker network connect folkify_be_folkify-network container_name

# Disconnect container from network
docker network disconnect folkify_be_folkify-network container_name
```

## Monitoring

```bash
# Real-time resource usage
docker stats

# Container events
docker events

# System info
docker info

# Disk usage
docker system df

# Detailed disk usage
docker system df -v
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Complete cleanup (WARNING: removes everything!)
docker system prune -a --volumes
```

## Environment Variables

```bash
# View all environment variables in container
docker-compose exec api env

# View specific environment variable
docker-compose exec api printenv DATABASE_URL

# Set environment variable for single command
docker-compose exec -e DEBUG=true api npm run test
```

## Performance

```bash
# View resource limits
docker-compose exec api cat /sys/fs/cgroup/memory/memory.limit_in_bytes

# View CPU usage
docker stats --no-stream

# View memory usage
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# View network usage
docker stats --no-stream --format "table {{.Container}}\t{{.NetIO}}"
```

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
