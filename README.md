# MeetManager

Внутренний корпоративный веб-сервис для планирования и бронирования встреч между сотрудниками.

## Стек

| Слой | Технология |
|------|------------|
| Frontend | React 19 + Vite + Tailwind CSS 4.x |
| Backend | FastAPI + SQLAlchemy 2.x (async) |
| Database | SQLite (WAL) |
| Auth | JWT (HttpOnly Cookie) + bcrypt |

## Запуск

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
cp .env.example .env
python scripts/init_db.py
python scripts/seed.py
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Структура проекта

См. `SPEC.md` §3.2 — полная структура репозитория.

## Документация

- `SPEC.md` — техническая спецификация
- `PLAN.md` — план фаз
- `AGENTS.md` — инструкции для AI-агентов
