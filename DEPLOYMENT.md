# CommunityMap Deployment Guide

## 🚀 Deployment Options

### 1. Local Development (Windows)

**Prerequisites:**
- Windows 10/11 with PowerShell 5.1+
- Java 17+, Node.js 16+, MongoDB 7.0+, Maven 3.6+

**Quick Start:**
```powershell
# Clone repository
git clone <repository-url>
cd community_map

# Start application
.\start.ps1

# Stop application
.\stop.ps1
```

### 2. Docker Development

**Prerequisites:**
- Docker Desktop
- Docker Compose

**Quick Start:**
```bash
# Start MongoDB and Backend
docker compose -f docker-compose.dev.yml up -d

# Run frontend separately for hot reload
cd frontend && npm install && npm start
```

### 3. Docker Production

**Prerequisites:**
- Docker Desktop
- Docker Compose

**Quick Start:**
```bash
# Start complete production stack
docker compose --profile prod up -d

# Access application
# Frontend: http://localhost
# Backend: http://localhost:8080
```

### 4. Cloud Deployment

#### AWS ECS/Fargate

```bash
# Build and push image
docker build -t communitymap:latest .
docker tag communitymap:latest <aws-account>.dkr.ecr.<region>.amazonaws.com/communitymap:latest
docker push <aws-account>.dkr.ecr.<region>.amazonaws.com/communitymap:latest

# Deploy using ECS task definition
```

#### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/<project-id>/communitymap
gcloud run deploy --image gcr.io/<project-id>/communitymap --platform managed
```

#### Azure Container Instances

```bash
# Build and push to Azure Container Registry
az acr build --registry <registry-name> --image communitymap:latest .
az container create --resource-group <resource-group> --name communitymap --image <registry-name>.azurecr.io/communitymap:latest
```

## 🔧 Configuration

### Environment Variables

**Backend:**
```bash
MONGODB_URI=mongodb://mongodb:27017/community_map
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=production
```

**Frontend:**
```bash
REACT_APP_API_URL=http://localhost:8080
```

### Database Setup

**MongoDB Connection:**
- Default: `mongodb://localhost:27017/community_map`
- Docker: `mongodb://mongodb:27017/community_map`
- Cloud: `mongodb+srv://username:password@cluster.mongodb.net/community_map`

**Sample Data:**
- Automatically loaded on first startup
- Located in `docker/mongo-init.js`

## 📊 Monitoring

### Health Checks

**Backend:**
```bash
curl http://localhost:8080/actuator/health
```

**Frontend:**
```bash
curl http://localhost/health
```

### Logs

**Docker:**
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f mongodb
```

**Local:**
- Backend: Console output
- Frontend: Browser console (F12)

## 🔒 Security

### Production Checklist

- [ ] Change default MongoDB credentials
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up proper firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Regular security updates

### Docker Security

```bash
# Run as non-root user (already configured)
# Use specific image tags instead of 'latest'
# Scan images for vulnerabilities
docker scan communitymap:latest
```

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Check port usage
netstat -an | findstr :8080
netstat -an | findstr :3000

# Kill processes on ports
.\stop.ps1
```

**MongoDB Connection Issues:**
```bash
# Check MongoDB status
net start MongoDB

# Test connection
mongosh mongodb://localhost:27017/community_map
```

**Docker Issues:**
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker compose down -v
docker compose up -d --build
```

### Performance Optimization

**Backend:**
- Enable JVM optimizations
- Configure connection pooling
- Use Redis for caching (future)

**Frontend:**
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading

**Database:**
- Create proper indexes
- Monitor query performance
- Use connection pooling

## 📈 Scaling

### Horizontal Scaling

**Backend:**
- Deploy multiple backend instances
- Use load balancer (Nginx, HAProxy)
- Implement session clustering

**Database:**
- MongoDB replica sets
- Read replicas for queries
- Sharding for large datasets

### Vertical Scaling

**Resource Limits:**
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy CommunityMap

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t communitymap:${{ github.sha }} .
      - name: Deploy to production
        run: |
          docker tag communitymap:${{ github.sha }} communitymap:latest
          docker compose --profile prod up -d
```

## 📞 Support

### Getting Help

1. Check logs for error messages
2. Review this deployment guide
3. Check GitHub issues
4. Create new issue with details

### Emergency Procedures

**Rollback:**
```bash
# Docker
docker compose down
docker compose -f docker-compose.backup.yml up -d

# Local
git checkout previous-stable-tag
.\start.ps1
```

**Data Backup:**
```bash
# MongoDB backup
mongodump --db community_map --out backup/

# Restore
mongorestore --db community_map backup/community_map/
```

---

**Happy Deploying! 🚀**
