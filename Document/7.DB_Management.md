
# DB Management — Implementation Guide

Mục tiêu của tài liệu này là cung cấp hướng dẫn chi tiết, các lệnh cụ thể, script mẫu và lưu ý vận hành để đưa phần quản lý database (Postgres) của Jiraboard vào production: backup, restore, migration, validation, audit, retention, monitoring, và recovery.

> Áp dụng cho: Postgres chạy trong Docker Compose (tệp `docker-compose.prod.yml`), Prisma làm ORM, API Node.

## 1) Backup & Restore — Chi tiết thực thi

Mục tiêu: đảm bảo có bản sao dữ liệu an toàn, có thể phục hồi nhanh, và có quy trình đã kiểm thử để khôi phục RTO/RPO đã cam kết.

1.1 Loại backup
- Logical backup (recommended for app-level restores): `pg_dump`/`pg_restore` (format custom `-Fc`).
- Physical backup (cluster-level, point-in-time): `pg_basebackup` + WAL archiving (PITR). Dùng nếu cần RPO rất nhỏ.

1.2 Ví dụ lệnh backup (containerized)
```bash
# Tạo folder backup trên host mounted vào docker volume (example path)
BACKUP_DIR=/var/backups/jiraboard
mkdir -p "$BACKUP_DIR"

# Logical dump (custom format) từ host, connect vào container db
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres -Fc -d task_manager -f /tmp/backup_$(date +%Y%m%d_%H%M%S).dump

# Copy file từ container ra host (nếu cần)
docker compose -f docker-compose.prod.yml exec db bash -lc "cat /tmp/backup_*.dump" > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).dump"
```

1.3 Tự động hoá backup (script mẫu)
Tạo `scripts/pg_backup.sh` trên host:
```bash
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR=/var/backups/jiraboard
RETENTION_DAYS=14
mkdir -p "$BACKUP_DIR"

FNAME="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).dump"
echo "Starting pg_dump -> $FNAME"
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres -Fc -d task_manager > "$FNAME"

# Optional: upload to remote (S3) using rclone or aws cli
# rclone copy "$FNAME" remote:jiraboard-backups/

# rotate local backups
find "$BACKUP_DIR" -type f -name 'backup_*.dump' -mtime +$RETENTION_DAYS -delete
echo "Backup complete"
```

Add to root crontab (run daily at 02:00):
```cron
0 2 * * * /opt/jiraboard/scripts/pg_backup.sh >> /var/log/jiraboard/backup.log 2>&1
```

1.4 Kiểm tra & verify backup
- Sau khi backup, chạy `pg_restore --list` để xác nhận file không bị corrupt:
```bash
pg_restore --list /path/to/backup.dump | head
```
- Thử restore định kỳ (staging) bằng cách khôi phục vào DB tạm:
```bash
# create temp db
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE task_manager_test;"
cat /path/to/backup.dump | docker compose -f docker-compose.prod.yml exec -T db pg_restore -U postgres -d task_manager_test
```

1.5 Restore procedure (đã test)
1) Dừng API để tránh ghi mới:
```bash
docker compose -f docker-compose.prod.yml stop api
```
2) Drop & recreate DB:
```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "DROP DATABASE IF EXISTS task_manager;"
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE task_manager;"
```
3) Restore file (stream input):
```bash
cat /path/to/backup.dump | docker compose -f docker-compose.prod.yml exec -T db pg_restore -U postgres -d task_manager
```
4) Start API and run migrations if needed (migrations should be applied after restore if schema lags):
```bash
docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

1.6 Encryption & access control
- Store backups in a directory with strict permissions: `chmod 700`.
- Consider server-side encryption on S3 or encrypt dump files with GPG before upload:
```bash
gpg --symmetric --cipher-algo AES256 /path/to/backup.dump
```

1.7 WAL archiving & PITR (optional, advanced)
- Configure `postgresql.conf` to archive WAL to a remote store and use `pg_basebackup` for base backups.
- Use PITR to replay WAL to a point-in-time if needed.

## 2) Migrations & Deployment

Mục tiêu: đảm bảo schema migration an toàn, có thể rollback, và chạy tự động trong pipeline.

2.1 CI integration (recommended)
- GitHub Actions job should build & test migrations and produce a migration plan. Example steps:
  - `npx prisma generate`
  - `npx prisma migrate deploy` (only in controlled envs)

2.2 Safe migration process on server
- Avoid running `prisma migrate deploy` during traffic spikes. Strategy:
  1. Deploy new image without running migrations (if compatible).
  2. Run migrations in maintenance window or use blue/green deployment.

2.3 Rollback strategy
- Always keep backups prior to running risky migrations.
- Use feature flags to disable new behavior if migration incomplete.

2.4 Example: run migrations as part of deploy script
```bash
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

## 3) Data Validation & Constraints (Implementation)

3.1 At DB level (Prisma schema / Postgres)
- Use NOT NULL, UNIQUE, FOREIGN KEY, CHECK constraints for business rules where possible.
- Example Prisma constraint for hours >= 0 (use database check via raw SQL migration):
```sql
ALTER TABLE "TaskActualLog" ADD CONSTRAINT hours_non_negative CHECK (hours >= 0);
```

3.2 At API level
- Implement validation middleware (e.g., Zod or Joi) to validate request body before hitting DB. Examples:
  - Required fields: `taskId`, `projectId`, `title`.
  - Date format: ISO 8601 validation.
  - Numeric ranges.

3.3 Tests
- Unit tests for validation functions.
- Integration tests that run migrations on a test DB, then run API tests.

## 4) Audit Logging & Retention

4.1 Audit design (schema suggestions)
- Create an `audit_logs` table to capture: `id, actor_id, action, entity_type, entity_id, payload(jsonb), created_at`.
- Add triggers or application-level writes on sensitive tables. Example Prisma migration to add `createdById` and `updatedById` fields to `tasks` table.

4.2 Retention policy
- Define retention for each table type (e.g., task activity logs 12 months, audit logs 24 months).
- Implement a cleanup job (cron) to archive or delete old records. Example SQL:
```sql
DELETE FROM audit_logs WHERE created_at < now() - interval '24 months';
```

4.3 Archival
- Export old logs to compressed CSV/Parquet and store in cold storage (S3 Glacier). Use `COPY` for fast export:
```sql
COPY (SELECT * FROM task_actual_log WHERE created_at < now() - interval '12 months') TO STDOUT WITH CSV HEADER
```

## 5) Monitoring, Healthchecks & Maintenance

5.1 Metrics to monitor
- DB uptime/availability
- Connection count
- Long-running queries
- Replication lag (if any)
- Disk usage of data and WAL
- Failures of backup jobs

5.2 Prometheus + Grafana
- Expose Postgres metrics using `postgres_exporter` and create Grafana dashboards.

5.3 Alerts
- Alert on: high CPU, disk usage > 80%, long-running queries > threshold, failed backups, high error rate from API.

5.4 Routine maintenance
- VACUUM (or autovacuum) configuration and monitoring.
- Reindex periodically if bloat observed.

## 6) Security & Credentials

6.1 Secrets management
- Never commit `.env` to git. Use Docker secrets or environment secrets on host.
- Example: Put `DATABASE_URL` into Docker Compose secrets or use external secret manager.

6.2 Least privilege
- Use a dedicated Postgres role for the application with only needed privileges; use a separate superuser for backup/restore operations.

6.3 Network
- Restrict inbound access to Postgres port (`5432`) to only allowed hosts (use firewall / docker network). Do not expose Postgres to public internet.

## 7) Recovery Plan & Runbook (Step-by-step)

7.1 Simple restore (most common)
1. Notify stakeholders and set maintenance mode on API (if supported).
2. Stop API: `docker compose -f docker-compose.prod.yml stop api`.
3. Verify latest good backup present (check timestamp and checksum).
4. Drop & recreate DB.
5. Restore from backup.
6. Run migrations if necessary.
7. Start API and verify smoke tests.

7.2 Disaster recovery (full cluster loss)
- If using PITR with base backup + WAL: restore base backup, then replay WAL up to desired timestamp.

## 8) Scripts & Examples (to add to repo)

- `scripts/pg_backup.sh` — create logical dump, rotate, optional upload to S3.
- `scripts/pg_restore.sh` — helper to restore a given dump into DB (with safety checks).
- `scripts/backup_verify.sh` — restore to a temp DB to verify integrity.
- `scripts/cleanup_audit.sh` — archive or delete old audit logs according to retention policy.

## 9) Checklist (actionable)
- [ ] Add `scripts/pg_backup.sh` and schedule cron (daily).
- [ ] Add `scripts/pg_restore.sh` and document restore runbook.
- [ ] Implement backup verification job (weekly).
- [ ] Configure secrets (Docker secrets or env injection) for DB credentials.
- [ ] Add `audit_logs` table and instrument application to write audit events.
- [ ] Add monitoring (postgres_exporter + Grafana) and alerts.
- [ ] Add CI step to validate migrations and run tests on staging.

## 10) Appendix — Useful Commands

List databases:
```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "\\l"
```

List connections:
```sql
SELECT pid, usename, application_name, client_addr, state, query_start, query FROM pg_stat_activity;
```

Check disk usage of DB (inside container):
```bash
docker compose -f docker-compose.prod.yml exec db du -sh /var/lib/postgresql/data
```

Find largest tables:
```sql
SELECT relname, pg_total_relation_size(relid) AS size FROM pg_catalog.pg_statio_user_tables ORDER BY size DESC LIMIT 20;
```

---

If bạn muốn, tôi có thể tiếp tục và: tạo những script mẫu (`pg_backup.sh`, `pg_restore.sh`, `backup_verify.sh`) trong `scripts/` và追加 systemd timer / cron entries để tự động hóa. Xin cho biết bạn muốn tôi tạo script nào trước.
