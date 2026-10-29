# UFK Tools — Single-VPS Production Deployment Guide
**Zero Paid Subscriptions | $4–$5/mo Total Hosting Cost | Client-Side First Architecture**

This guide provides step-by-step instructions for deploying UFK Tools to a standard Linux VPS (Ubuntu 22.04 or 24.04 LTS) using Docker, Nginx, and free SSL via Let's Encrypt Certbot.

---

## 1. Recommended VPS Provider & Specifications

Because 95% of heavy PDF processing and conversions occur directly in the user's browser via WebAssembly, your server workload is minimal:

| Provider | Plan | Specs | Approx. Cost |
| :--- | :--- | :--- | :--- |
| **Hetzner Cloud** *(Recommended)* | CX22 | 2 vCPU, 4 GB RAM, 40 GB NVMe | ~€3.79 / month |
| **DigitalOcean** | Basic Droplet | 1 vCPU, 2 GB RAM, 50 GB SSD | ~$12.00 / month |
| **Linode / Akamai** | Shared Plan | 1 vCPU, 2 GB RAM, 50 GB SSD | ~$12.00 / month |
| **Contabo** | Cloud VPS 1 | 4 vCPU, 8 GB RAM, 50 GB NVMe | ~€4.50 / month |

---

## 2. Server Initial Setup & Firewall

Connect to your VPS via SSH as `root`:

```bash
ssh root@YOUR_SERVER_IP
```

Update system packages and configure UFW firewall:

```bash
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Configure Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

---

## 3. Install Docker & Docker Compose

Run the official Docker automated installation:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker installation
docker --version
docker compose version
```

---

## 4. Clone Repository & Setup Environment

Create a dedicated directory for the application:

```bash
mkdir -p /var/www/ukftools
cd /var/www/ukftools

# Clone repository
git clone https://github.com/YOUR_USERNAME/ukftools.git .

# Create production environment file
cp .env.example .env.production
nano .env.production
```

Set secure production values in `.env.production`:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Secure Admin Credentials
ADMIN_EMAIL=admin@ufktools.com
ADMIN_PASSWORD=SetAStrongRandomPasswordHere987#
ADMIN_SESSION_SECRET=create_a_64_character_random_hex_key_here
```

*(Tip: Generate a 64-char random hex key using: `openssl rand -hex 32`)*

---

## 5. Build & Launch Docker Container

Start the production container with automatic restart:

```bash
docker compose --env-file .env.production up -d --build

# Verify container is running and healthy
docker compose ps
docker compose logs -f
```

---

## 6. Configure Nginx & Let's Encrypt SSL

1. Copy the included Nginx configuration:
   ```bash
   cp nginx/nginx.conf /etc/nginx/sites-available/ufktools.conf
   ln -s /etc/nginx/sites-available/ufktools.conf /etc/nginx/sites-enabled/
   rm -f /etc/nginx/sites-enabled/default
   ```

2. Test Nginx syntax and reload:
   ```bash
   nginx -t
   systemctl reload nginx
   ```

3. Generate free SSL Certificate via Certbot:
   ```bash
   certbot --nginx -d ufktools.com -d www.ufktools.com --non-interactive --agree-tos -m your-email@domain.com
   ```

4. Certbot automatically configures auto-renewal. Test renewal:
   ```bash
   certbot renew --dry-run
   ```

---

## 7. Automated Maintenance & Cleanup Sweeper

Setup a daily cron job to prune temporary upload files older than 24 hours:

```bash
crontab -e
```

Add the following line to run every day at 3:00 AM:
```bash
0 3 * * * cd /var/www/ukftools && docker compose exec -T ufktools node scripts/cleanup_temp.mjs >> /var/log/ufktools_cleanup.log 2>&1
```

---

## 8. Automated Database Backup Routine

To backup the SQLite database and featured images daily:

Create backup script:
```bash
nano /var/www/ukftools/backup.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ufktools"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup SQLite database and uploaded images
tar -czf "$BACKUP_DIR/ufktools_backup_$DATE.tar.gz" /var/lib/docker/volumes/ukftools_ufktools_db /var/lib/docker/volumes/ukftools_ufktools_uploads

# Prune backups older than 14 days
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +14 -delete
echo "[$(date)] Backup completed: ufktools_backup_$DATE.tar.gz"
```

Make executable and add to crontab:
```bash
chmod +x /var/www/ukftools/backup.sh
crontab -e
# Add: 0 4 * * * /var/www/ukftools/backup.sh >> /var/log/ufktools_backup.log 2>&1
```

---

## 9. Zero-Downtime Update Procedure

When pushing new code updates from GitHub, run:

```bash
cd /var/www/ukftools
git pull origin main
docker compose --env-file .env.production up -d --build
```

---

## 10. Summary Checklist

- [x] Next.js 16 standalone build in non-root Docker container.
- [x] Persistent volumes for SQLite database (`.db`) and uploaded images (`uploads/`).
- [x] In-memory rate limiting for admin login, rate queries, and uploads.
- [x] Nginx reverse proxy with gzip compression and 1-year static caching.
- [x] Real-time SSE live updates enabled (`proxy_buffering off;`).
- [x] Let's Encrypt SSL auto-renewing certificates.
- [x] Daily automated cleanup of temporary files.
- [x] Daily automated backup of application database and assets.
- [x] **Total Monthly Running Cost: $4–$5 USD.**
