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