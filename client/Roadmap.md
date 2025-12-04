Roadmap for migrating from localStorage to a multi-user, dockerized deployment

1) Data + API redesign
- Pick DB (Postgres preferred), define schema (users, projects, tasks, comments, attachments, audit).
- Design API (REST/GraphQL) with auth (JWT/session) and basic authorization per user/project.

2) Build backend
- Create API service (Node/Express/Fastify/Nest) with migrations/seeds (Prisma/Knex).
- Implement CRUD for tasks/resources + auth (register/login/logout).
- Add tests (unit for services, integration for API with test DB).

3) Frontend integration
- Replace localStorage with API calls; state scoped per user.
- Add auth flows (login/register/logout) and route guards; handle loading/error states.
- Use env for API base URL (e.g., VITE_API_URL for dev/prod).

4) Dockerization (dev + prod)
- Dockerfile frontend (build Vite, serve via Nginx) and Dockerfile API (Node runtime).
- Docker Compose for dev: frontend + api + db, with code volumes and db volume.
- Compose/stack for prod: build/pull images, persistent volumes, reverse proxy if needed.

Chạy migrate
# nếu dùng compose prod:
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# hoặc dev:
docker compose -f docker-compose.dev.yml run --rm api npx prisma migrate dev --name add_daily_headcount
*************************Vận hành*************************
Tóm tắt vận hành Docker:

# 1. Build images
docker compose -f docker-compose.prod.yml build

# 2. Start all services (db, api, client)
docker compose -f docker-compose.prod.yml up -d

# 3. Wait for DB to be ready (5-10 seconds)
sleep 10

# 4. Run migrations (creates tables)
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# 5. Check status
docker compose -f docker-compose.prod.yml ps

# 6. View logs
docker compose -f docker-compose.prod.yml logs -f

# ---NOTE Phải migrate nếu có sửa table/database
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Expected output:
NAME                          COMMAND              SERVICE   STATUS           PORTS
jira-prod-db-1                postgres             db        Up (healthy)     5432/tcp
jira-prod-api-1               node dist/src/...    api       Up               4000/tcp
jira-prod-client-1            nginx -g daemon      client    Up               0.0.0.0:80->80/tcp

Environment:

Dev có thể dùng dev-secret; Prod nên đặt JWT_SECRET mạnh, DATABASE_URL/CORS_ORIGIN/VITE_API_URL đúng, qua .env hoặc build arg cho client.
Push image lên private registry:

docker build -f Dockerfile.api -t <registry>/jira-api:tag .
docker push <registry>/jira-api:tag
docker build -f Dockerfile.client -t <registry>/jira-client:tag .
docker push <registry>/jira-client:tag
Trên máy đích: chỉnh compose dùng image:, pull, rồi up -d.

5) CI/CD
- GitHub Actions: lint/test/build; build/push images (API + frontend) to registry (GHCR/Docker Hub).
- Tag images by commit/branch; optional deploy job or webhook to server.
* Dev từ máy này sang máy khác

bạn chỉ cần mang code + file env sang máy mới, rồi chạy compose dev.

Các bước ngắn gọn:

Clone repo sang máy mới.
Tạo file env (dựa trên .env.example): đặt DATABASE_URL=postgres://postgres:postgres@db:5432/task_manager, VITE_API_URL=http://localhost (line 4000), CORS_ORIGIN=http://localhost (line 5173), JWT_SECRET=dev-secret (hoặc giá trị bạn muốn).
Chạy: docker compose -f docker-compose.dev.yml up --build.
Nếu cần schema: trong container api chạy migrate (lần đầu): docker compose -f docker-compose.dev.yml run --rm api npx prisma migrate dev. Hoặc migrate deploy nếu dùng migration sẵn có.
Dữ liệu DB cũ (volume) không đi cùng repo. Nếu muốn giữ data, dump từ máy cũ (pg_dump) và restore vào db container mới.
Lưu ý: images sẽ build lại trên máy mới; nếu muốn kéo từ registry thì push/pull trước, còn không thì để compose build.


**************************************************
6) Server setup
- Prepare target machine (LAN/VPS): install Docker/Compose, open ports 80/443 (and 5432 if needed internally).
- Clone repo or only pull images; run compose with env/secret files; set volumes for DB and backups.
- If public: domain + TLS (Let's Encrypt via nginx/traefik).

7) Operations
- Manage secrets via env files/secret store; never commit .env.
- Backups: scheduled pg_dump for DB; restore procedure documented.
- Monitoring basics: docker logs, healthchecks, restart policies; consider resource limits (cpu/mem).

Appendix: Sample schema (Postgres) for backlog/resources
- users: id (uuid, pk), email (unique), password_hash, name, role (enum), created_at, updated_at.
- projects: id (uuid, pk), name, description, owner_id (fk users), created_at, updated_at.
- project_members: project_id fk, user_id fk, role (enum admin/member/viewer), added_at; pk (project_id, user_id).
- tasks: id (uuid, pk), project_id fk, reporter_id fk users, assignee_id fk users null, title, description, status (enum todo/doing/done/blocked), priority (enum), type (bug/feature/task), due_date null, created_at, updated_at.
- comments: id (uuid, pk), task_id fk, user_id fk, body, created_at, updated_at.
- attachments: id (uuid, pk), task_id fk, user_id fk, filename, url/storage_key, mime_type, size, created_at.
- audit_logs: id (bigserial pk), actor_id fk users, project_id fk, task_id fk null, action (enum create/update/delete/comment/attach/status_change/login), metadata (jsonb), created_at.
- Optional labels: labels (id uuid, project_id fk, name, color), task_labels (task_id, label_id).
- Optional sprints: sprints (id uuid, project_id fk, name, start_date, end_date), tasks.sprint_id fk.
