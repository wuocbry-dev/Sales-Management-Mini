# Full-Stack AI Agent Template

CLI generator for production-ready FastAPI + Next.js projects with AI agents, RAG, auth, background tasks, observability, and deployment options.

This repository contains the generator source code and the cookiecutter template used to create new projects.

## What This Repo Contains

| Path | Purpose |
|------|---------|
| `fastapi_gen/` | Python package for the CLI, prompts, config models, and generator |
| `template/` | Cookiecutter project template copied into generated apps |
| `template/VARIABLES.md` | Documentation for template variables |
| `tests/` | Test suite for CLI, config, generator, template docs, and integrations |
| `docs/` | MkDocs documentation for the generator |
| `AI_agent_run/` | Active generated demo project for local manual testing |
| `AGENTS.md` | Rules for AI coding agents working in this repo |

## Setup

Install dependencies:

```bash
uv sync
```

Run tests:

```bash
uv run pytest
```

Useful checks:

```bash
uv run ruff check . --fix
uv run ruff format .
uv run mypy fastapi_gen
```

## CLI Usage

Run the interactive wizard:

```bash
uv run fastapi-fullstack
```

Create a project with options:

```bash
uv run fastapi-fullstack create my_app --database postgresql --frontend nextjs
uv run fastapi-fullstack create my_app --rag --task-queue celery
uv run fastapi-fullstack create my_app --minimal
```

List available template options:

```bash
uv run fastapi-fullstack templates
```

## Generated Project Features

- FastAPI backend with layered routes, services, repositories, and schemas
- Optional Next.js frontend
- AI frameworks: PydanticAI, PydanticDeep, LangChain, LangGraph, CrewAI, DeepAgents
- LLM providers: OpenAI, Anthropic, Google Gemini, OpenRouter
- RAG with Milvus, Qdrant, ChromaDB, or pgvector
- Document ingestion from local files, API uploads, Google Drive, and S3/MinIO
- Background tasks with Celery, Taskiq, or ARQ
- Auth, OAuth, admin panel, webhooks, WebSockets, Docker, Kubernetes, CI options

## Active Demo

The active local demo is recorded in:

```text
.last_demo_project_name.txt
```

Current manual run instructions are in:

```text
AI_agent_run/RUN_MANUAL.md
```

Typical backend run command from the demo backend directory:

```powershell
$env:DEBUG="true"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Architecture

The generator has four main modules:

| Module | Purpose |
|--------|---------|
| `fastapi_gen/cli.py` | Click CLI entry points: `new`, `create`, `templates` |
| `fastapi_gen/config.py` | Pydantic config models, enums, validation, cookiecutter context |
| `fastapi_gen/prompts.py` | Interactive Questionary prompts |
| `fastapi_gen/generator.py` | Cookiecutter invocation and post-generation output |

Generated projects follow a backend structure like:

```text
backend/
|-- app/
|   |-- api/
|   |-- agents/
|   |-- core/
|   |-- db/
|   |-- repositories/
|   |-- schemas/
|   |-- services/
|   `-- rag/
|-- alembic/
|-- cli/
`-- tests/
```

## Common Development Tasks

### Add a CLI option

1. Add the field or enum in `fastapi_gen/config.py`.
2. Add prompt behavior in `fastapi_gen/prompts.py`.
3. Add the variable to `template/cookiecutter.json`.
4. Use Jinja conditionals in `template/`.
5. Update `template/hooks/post_gen_project.py` cleanup behavior.
6. Document it in `template/VARIABLES.md`.

### Add a vector store

1. Add a value to `VectorStoreType` in `fastapi_gen/config.py`.
2. Add `use_<name>` flags to `to_cookiecutter_context()`.
3. Implement the vector store in the template RAG module.
4. Wire conditionals in dependencies, commands, and RAG tools.
5. Add Docker services and dependencies if required.

### Add a sync connector

1. Create a connector under `template/{{cookiecutter.project_slug}}/backend/app/rag/connectors/`.
2. Register it in the connector package.
3. Add CLI commands and schemas for the source.
4. Wire background sync tasks if needed.

## Notes For AI Agents

Read `AGENTS.md` before editing. In particular:

- Do not delete source, template, tests, active demo data, `.env`, `.venv`, or `data/` without explicit confirmation.
- Before cleanup tasks, classify files as source, docs, active demo, inactive demo, local environment, cache, logs, or build output.
- Keep `AI_agent_run/RUN_MANUAL.md` because it is the current manual run reference.
