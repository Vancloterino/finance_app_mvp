# Finance App Backend

FastAPI backend for the Shared Finance App.

## Setup

1. Install Poetry: `pip install poetry`
2. Install dependencies: `poetry install`
3. Copy `.env.example` to `.env` and configure
4. Run: `poetry run uvicorn app.main:app --reload`

## Development

- Format code: `poetry run black .`
- Lint code: `poetry run ruff .`
- Type check: `poetry run mypy .`
- Run tests: `poetry run pytest`