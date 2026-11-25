# Leadership Lab - developer commands. Run `make help`.
ENV ?= dev
.DEFAULT_GOAL := help
.PHONY: help setup dev up down status logs reset build test test-unit test-api test-e2e docs deploy cloudflare-bootstrap clean

help: ## Show this help
	@awk 'BEGIN{FS=":.*## "} /^[a-zA-Z0-9_-]+:.*## /{printf "  \033[1m%-22s\033[0m %s\n",$$1,$$2}' $(MAKEFILE_LIST)
	@echo "\n  ENV=dev|test|prod (default: dev). Environments live in config/environments.json."

setup: ## Install dependencies (Node >= 20 and Python 3 required)
	@command -v node >/dev/null || { echo "Node.js >= 20 is required (see .nvmrc)"; exit 1; }
	@command -v python3 >/dev/null || { echo "Python 3 is required"; exit 1; }
	@[ -f .env ] || { cp .env.example .env; echo "Created .env from .env.example"; }
	npm install --no-audit --no-fund

node_modules/wrangler/package.json:
	@$(MAKE) --no-print-directory setup

dev: node_modules/wrangler/package.json ## Start the development environment -> http://localhost:8090/
	@scripts/local.sh up dev

up: node_modules/wrangler/package.json ## Start a local environment: make up ENV=dev|test
	@scripts/local.sh up $(ENV)

down: ## Stop a local environment: make down ENV=dev|test
	@scripts/local.sh down $(ENV)

status: ## Is a local environment answering?
	@scripts/local.sh status $(ENV)

logs: ## Follow a local environment's server log
	@scripts/local.sh logs $(ENV)

reset: ## Delete the local data of an environment (it is recreated on the next `up`)
	@scripts/local.sh reset $(ENV)

build: ## Assemble build/<ENV>/
	@python3 -I scripts/build.py --env $(ENV)

test: node_modules/wrangler/package.json ## Whole suite against the test environment (starts and stops it)
	@scripts/test.sh all

test-unit: ## Layout, environments, schema and shell tests (no server)
	@scripts/test.sh unit

test-api: node_modules/wrangler/package.json ## API tests of every app
	@scripts/test.sh api

test-e2e: node_modules/wrangler/package.json ## Browser tests (needs Google Chrome installed)
	@scripts/test.sh e2e

docs: node_modules/wrangler/package.json ## Regenerate the HTML documentation (docs/html/) from the markdown
	@node scripts/build-docs.mjs

cloudflare-bootstrap: ## Create Pages + D1 + KV for ENV in Cloudflare (creates resources!)
	@scripts/cloudflare-bootstrap.sh $(ENV)

deploy: ## Deploy ENV (must target Cloudflare) - publishes!
	@scripts/deploy.sh $(ENV)

clean: ## Remove build output and local data of every environment
	rm -rf build .local test-results
