PROJECT_NAME := ve-server
PORT         := 3000

.PHONY: up down rebuild logs db-up db-down run-local run-neon compose-prod up-prod migrate-local migrate-prod

# ─── Local (hot reload + Docker DB) ──────────────────────────
up:
	ENV_FILE=.env.local docker-compose up -d

down:
	docker-compose down

rebuild:
	ENV_FILE=.env.local docker-compose up -d --build

logs:
	docker-compose logs -f app

# ─── DB Only (for Local Host running) ──────────────────────────
db-up:
	docker-compose up -d db

db-down:
	docker-compose stop db

# ─── Host Machine Running ────────────────────────────────────
run-local:
	pnpm run start:local

run-neon:
	pnpm run start:neon

# ─── Production (Neon DB) ─────────────────────────────────────
compose-prod:
	docker-compose -f docker-compose.prod.yaml up -d --build

up-prod:
	docker build --target production -t $(PROJECT_NAME):prod .
	docker rm -f $(PROJECT_NAME) 2>/dev/null || true
	docker run -d \
		--name $(PROJECT_NAME) \
		--env-file .env.production \
		-p $(PORT):$(PORT) \
		$(PROJECT_NAME):prod

# ─── Migrations ───────────────────────────────────────────────
migrate-local:
	pnpm dotenv -e .env.local -- pnpm prisma migrate dev

migrate-prod:
	pnpm dotenv -e .env.production -- pnpm prisma migrate deploy

# ─── Database Backup Production ───────────────────────────────
backup-prod:
	@mkdir -p backups
	@export $$(grep -v '^#' .env.production | grep -v '^$$' | xargs) && \
	pg_dump $$DATABASE_URL \
		--no-owner \
		--no-acl \
		-F p \
		-f backups/backup_$$(date +%F).sql
	@echo "✅ Backup saved to backups/backup_$$(date +%F).sql"

# ─── Database Restore Production ───────────────────────────────
restore-prod:
	@if [ -f "$1" ]; then \
		export $$(grep -v '^#' .env.production | grep -v '^$$' | xargs) && \
		pg_restore \
			--clean \
			--if-exists \
			-d $$DATABASE_URL \
			"$1"; \
		echo "✅ Database restored from $1"; \
	else \
		echo "❌ Backup file $1 not found"; \
	fi