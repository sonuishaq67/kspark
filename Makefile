.PHONY: help setup migrate seed test clean

help:
	@echo "Interview Coach - Makefile Commands"
	@echo ""
	@echo "  make setup      - Initial setup (Docker, migrations, seed data)"
	@echo "  make migrate    - Run database migrations"
	@echo "  make seed       - Seed question banks"
	@echo "  make test       - Run all tests"
	@echo "  make clean      - Clean up containers and data"

setup:
	@echo "Starting infrastructure..."
	docker-compose up -d
	@echo "Waiting for Postgres..."
	sleep 5
	@echo "Running migrations..."
	$(MAKE) migrate
	@echo "Seeding data..."
	$(MAKE) seed
	@echo "Setup complete!"

migrate:
	@echo "Running database migrations..."
	python infra/migrations/run_migrations.py

seed:
	@echo "Seeding question bank..."
	python infra/seed/question_bank/import.py
	@echo "Downloading LeetCode dataset..."
	python infra/seed/leetcode/import.py

test:
	@echo "Running tests..."
	cd services/p1_platform && pytest
	cd services/p2_interview && pytest
	cd services/p3_learning && pytest
	cd web && npm test

clean:
	@echo "Stopping containers..."
	docker-compose down -v
	@echo "Cleaning data..."
	rm -f data/leetcode.sqlite
	@echo "Clean complete!"
