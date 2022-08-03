
#!/bin/bash
cd ~/99x-backend
pm2 startOrReload ecosystem.config.json
docker-compose up -d

