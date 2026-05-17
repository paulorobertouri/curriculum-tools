.PHONY: help install install-dev build build-pages publish dev preview test test-unit test-e2e lint format clean

help:
	@echo "Available commands:"
	@echo "  install      Install production dependencies"
	@echo "  install-dev  Install development dependencies"
	@echo "  build        Build the application"
	@echo "  build-pages  Build the application for GitHub Pages"
	@echo "  publish      Build and copy to ../paulorobertouri.github.io/curriculum-tools"
	@echo "  dev          Start the development server"
	@echo "  preview      Preview the built application"
	@echo "  test         Run all tests"
	@echo "  test-unit    Run unit tests"
	@echo "  test-e2e     Run E2E tests with Playwright"
	@echo "  lint         Lint the code"
	@echo "  format       Format the code"
	@echo "  clean        Clean build artifacts"

install:
	pnpm install --prod

install-dev:
	pnpm install
	pnpm exec playwright install chromium

build:
	pnpm run build

build-pages:
	pnpm run build:pages

publish:
	pnpm run publish

dev:
	pnpm run dev

start:
	bash ./scripts/ubuntu/start.sh

stop:
	bash ./scripts/ubuntu/stop.sh

preview:
	pnpm run preview

test:
	pnpm run test

test-unit:
	pnpm run test

test-e2e:
	pnpm run test:e2e

lint:
	pnpm run lint

format:
	pnpm run format

clean:
	rm -rf dist coverage
