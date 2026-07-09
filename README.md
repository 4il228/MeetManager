# MeetManager

> С описанием процесса разработки можно ознакомиться в файле [`FLOW (NOT AI).txt`](FLOW%20(NOT%20AI).txt) (рукописная версия) и [`FLOW.md`](FLOW.md) (оформление, сделанное ИИ).

MeetManager - внутренний веб-сервис для планирования встреч между сотрудниками с календарём, проверкой конфликтов и администрированием пользователей.

## Что есть в проекте

- авторизация через `JWT` в `HttpOnly` cookies
- роли пользователя и администратора
- просмотр календаря в режимах день/неделя
- отображение времени строго в `Europe/Moscow`
- создание встреч с проверкой занятости участников
- просмотр деталей встречи и удаление встречи создателем
- поиск коллег и фильтрация календаря по пользователю
- админ-модалка для создания и удаления пользователей
- удаление пользователя из всех встреч в реальном времени
- `PWA`-манифест и service worker для статики

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, Axios |
| Backend | FastAPI, SQLAlchemy 2 async, Pydantic 2 |
| Database | SQLite + WAL |
| Auth | JWT, HttpOnly cookies, bcrypt |
| UI | Material Symbols, swipe navigation |

## Структура

```text
backend/   FastAPI API, модели, роуты, скрипты БД
frontend/  React/Vite клиент
docs/      отчёты по фазам
SPEC.md    техническая спецификация
PLAN.md    план фаз
AGENTS.md  правила для AI-агентов
```

## Быстрый запуск

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
copy .env.example .env
python scripts\init_db.py
python scripts\seed.py
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

### 3. Запуск проекта

На Windows рекомендуется использовать готовые скрипты из корня репозитория:

```bat
start.bat
```

Скрипт:

- останавливает старые процессы backend
- поднимает backend на `127.0.0.1:8011`
- проверяет, что нужные API-маршруты действительно доступны
- запускает frontend на `http://localhost:5173`

Остановка backend:

```bat
stop.bat
```

## Ручной запуск

### Backend

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8011
```

### Frontend

```bash
cd frontend
npm run dev -- --port 5173 --strictPort
```

## Конфигурация

### Backend env

См. `backend/.env.example`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `FRONTEND_URL`
- `COOKIE_SECURE`
- `PORT`

### Frontend env

См. `frontend/.env.example`:

- `VITE_API_BASE_URL`
- `VITE_BACKEND_PORT`
- `VITE_DEV_PORT`

В dev-режиме клиент по умолчанию ходит напрямую в backend на `127.0.0.1`, чтобы не зависеть от нестабильного Vite proxy на Windows.

## Демо-учётки

После `python scripts\seed.py` создаются тестовые пользователи:

| Логин | Пароль | Роль |
|------|--------|------|
| `admin` | `Admin123!` | администратор |
| `ivanov` | `User123!` | пользователь |
| `petrova` | `User123!` | пользователь |
| `sidorov` | `User123!` | пользователь |

## Основные API-маршруты

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Users

- `GET /api/v1/users`
- `POST /api/v1/users`
- `DELETE /api/v1/users/{user_id}`

### Meetings

- `GET /api/v1/meetings`
- `POST /api/v1/meetings`
- `DELETE /api/v1/meetings/{meeting_id}`
- `POST /api/v1/meetings/check-availability`

Swagger:

- `http://127.0.0.1:8011/api/docs`

## Особенности реализации

- все даты в API и БД хранятся в UTC в формате `...Z`
- весь UI показывает время только в московском часовом поясе
- при конфликте встреч backend возвращает `409` с массивом `conflicts`
- удалять встречу может только её создатель
- удалять пользователей может только администратор
- при удалении пользователя он снимается со всех встреч, а встречи, созданные им, тоже удаляются

## Проверка сборки

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
.venv\Scripts\python.exe -m py_compile app\routers\users.py
```

## Известный нюанс Windows

На некоторых машинах после падения `uvicorn` могут оставаться "зомби"-слушатели на старых портах. Из-за этого проект использует backend-порт `8011` и скрипты `start.bat` / `stop.bat` для принудительной очистки старых процессов.

Если backend ведёт себя странно:

1. запусти `stop.bat`
2. затем `start.bat`
3. если порт всё ещё занят старым процессом, перезагрузи Windows

## Документация

- `SPEC.md` - техническая спецификация
- `PLAN.md` - план фаз
- `AGENTS.md` - инструкции для AI-агентов
- `docs/phases/` - отчёты по этапам реализации
