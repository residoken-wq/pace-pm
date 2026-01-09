#!/bin/bash

# Deployment Script
echo "Starting Deployment..."

# 1. Pull latest code
git pull origin main

# 2. Run Security Checks
./scripts/security-check.sh

# 3. Build and Restart Containers
echo "Rebuilding containers..."
docker compose build

echo "Restarting services..."
docker compose up -d

echo "Pruning unused images..."
docker image prune -f

echo "Deployment Complete!"
