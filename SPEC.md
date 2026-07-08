# SPEC.md — Техническая спецификация MeetManager

> **Версия:** 1.1  
> **Удалённый репозиторий:** https://github.com/4il228/MeetManager  
> **Связанные документы:** `PLAN.md` (порядок фаз), `AGENTS.md` (инструкции агентов)

---

## 1. Обзор проекта

### 1.1 Назначение

Внутренний корпоративный веб-сервис для планирования и бронирования встреч между сотрудниками. Главная цель — **бесконфликтное** распределение временных слотов (zero overbooking). Продукт — Mobile-First MVP с PWA.

### 1.2 Ключевые требования

| ID | Требование | Критерий проверки |
|----|------------|-------------------|
| R-01 | Управление встречами | `POST /api/v1/meetings` создаёт запись с темой, участниками, интервалом |
| R-02 | Прозрачность расписания | `GET /api/v1/meetings?user_id=` возвращает чужой календарь |
| R-03 | Бесконфликтность | При пересечении интервалов — `409 Conflict`, запись не создаётся |
| R-04 | Mobile-First UI | Touch-зоны ≥ 44×44 px, PWA manifest + Service Worker |
| R-05 | Безопасность | JWT в HttpOnly Cookie, bcrypt, rate limit на login |
| R-06 | Единый часовой пояс | Всё время в UI фиксируется и отображается в МСК (`Europe/Moscow`) для всех пользователей; хранение — UTC |

### 1.3 Вне скоупа MVP

- Регистрация новых пользователей через UI (только seed-скрипт)
- Push-уведомления, email-напоминания
- Редактирование встречи (только создание и удаление)
- Мультитенантность / несколько организаций

---

## 2. Пользовательские сценарии

### 2.1 Авторизация

1. Пользователь открывает `/login` — форма «Логин / Пароль».
2. `POST /api/v1/auth/login` — при ошибке ответ **всегда** `{ "detail": "Неверный логин или пароль" }` (статус `401`).
3. При успехе — JWT в Cookie, редирект на `/` (календарь).

### 2.2 Просмотр расписания

1. По умолчанию: режим **День**, текущая дата, встречи текущего пользователя. Всё время на таймлайне и в карточках встреч отображается **в московском часовом поясе (МСК)** для всех пользователей (см. §7.2).
2. Переключатели: **День** (вертикальный таймлайн) / **Неделя** (горизонтальная сетка).
3. Поиск коллег в шапке → выбор → `GET /api/v1/meetings?user_id={id}`.
4. Свайп влево/вправо — смена дня или недели.

### 2.3 Создание встречи

1. FAB «+» или клик по пустому слоту → модальное окно.
2. Поля: название, дата/время начала и окончания (вводятся и отображаются **в МСК**), мультивыбор участников.
3. При изменении участников/времени — debounce-запрос `POST /api/v1/meetings/check-availability`.
4. **Успех (`201`)** — Toast, оптимистичное добавление в UI, закрытие модалки.
5. **Конфликт (`409`)** — модалка с деталями, **форма не сбрасывается**.

---

## 3. Архитектура и стек

### 3.1 Стек (зафиксирован, не менять без обновления SPEC)

| Слой | Технология | Версия |
|------|------------|--------|
| Frontend | React + Vite + Tailwind CSS | React 19, Vite 6.x, Tailwind 4.x |
| HTTP-клиент | Axios | 1.x |
| Даты (клиент) | date-fns + @date-fns/tz | 4.x |
| Свайпы | @use-gesture/react или react-swipeable | последняя стабильная |
| Backend | FastAPI + Pydantic v2 | Python ≥ 3.11 |
| ORM | SQLAlchemy 2.x (async) + aiosqlite | — |
| Auth | python-jose / PyJWT + passlib[bcrypt] | — |
| Rate limit | slowapi | — |
| Database | SQLite (WAL) | файл `backend/data/meetmanager.db` |

### 3.2 Структура репозитория (обязательная)

```
MeetManager/
├── .gitignore
├── README.md
├── SPEC.md
├── PLAN.md
├── AGENTS.md
├── backend/
│   ├── pyproject.toml          # или requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   └── meetings.py
│   │   ├── services/
│   │   └── dependencies.py
│   ├── scripts/
│   │   ├── init_db.py
│   │   └── seed.py
│   └── data/                   # SQLite-файл (в .gitignore)
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       ├── context/
│       ├── components/
│       ├── pages/
│       └── hooks/
└── docs/
    └── phases/                 # Отчёты агентов (PHASE-N.md)
```

### 3.3 Git и удалённый репозиторий

| Параметр | Значение |
|----------|----------|
| Remote `origin` | `https://github.com/4il228/MeetManager.git` |
| Основная ветка | `main` |
| Ветка фазы | `phase/N-краткое-имя` (см. `PLAN.md`) |
| Коммиты | Conventional Commits: `feat(phase-N): описание` |
| Push | **Обязателен** после завершения каждой фазы |
| Секреты | `.env`, `*.db`, `node_modules/`, `__pycache__/` — **никогда** в git |

Подробный протокол — в `AGENTS.md`, раздел «Глобальный протокол».

---

## 4. База данных (SQLite)

### 4.1 Прагмы (выполнять при каждом подключении)

```sql
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
```

### 4.2 Формат даты/времени

**Единый канонический формат хранения и передачи:**

```
YYYY-MM-DDTHH:MM:SSZ
```

Пример: `2026-07-08T14:30:00Z`

- В БД — тип `TEXT`, значение в UTC с суффиксом `Z`.
- В API — тот же формат (JSON-строки).
- `created_at` генерируется на стороне БД: `datetime('now')` → при чтении нормализуется к `...Z` на бэкенде.
- **Отображение в UI — всегда в московском часовом поясе** (`Europe/Moscow`, UTC+3), независимо от настроек устройства пользователя. См. §7.2.

### 4.3 DDL

#### Таблица `users`

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))),2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
```

#### Таблица `meetings`

```sql
CREATE TABLE meetings (
    id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))),2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    title TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT,
    CHECK (datetime(replace(replace(end_time, 'T', ' '), 'Z', '')) >
           datetime(replace(replace(start_time, 'T', ' '), 'Z', '')))
);
```

#### Таблица `meeting_participants`

```sql
CREATE TABLE meeting_participants (
    meeting_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.4 Seed-данные (минимум)

| username | password (plain, только для seed) | full_name |
|----------|-----------------------------------|-----------|
| `admin` | `Admin123!` | Администратор Системы |
| `ivanov` | `User123!` | Иванов Иван Иванович |
| `petrova` | `User123!` | Петрова Анна Сергеевна |
| `sidorov` | `User123!` | Сидоров Пётр Александрович |

Пароли в БД — только bcrypt-хэш. Seed-скрипт идемпотентен: повторный запуск не дублирует записи.

---

## 5. API

**Базовый префикс:** `/api/v1`  
**Content-Type:** `application/json`  
**Авторизация:** Cookie `access_token` (JWT). Эндпоинты `/auth/login` — без токена.

### 5.1 Auth

#### `POST /auth/login`

**Request:**
```json
{ "username": "ivanov", "password": "User123!" }
```

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "username": "ivanov",
    "full_name": "Иванов Иван Иванович"
  }
}
```
+ Set-Cookie: `access_token`, `refresh_token` (HttpOnly, Secure, SameSite=Strict)

**Response `401`:** `{ "detail": "Неверный логин или пароль" }`  
**Response `429`:** `{ "detail": "Слишком много попыток. Повторите через минуту." }`

#### `POST /auth/logout`

**Response `200`:** `{ "detail": "ok" }` + удаление Cookie

#### `GET /auth/me`

**Response `200`:**
```json
{ "id": "uuid", "username": "ivanov", "full_name": "Иванов Иван Иванович" }
```

**Response `401`:** `{ "detail": "Не авторизован" }`

### 5.2 Users

#### `GET /users?search={строка}`

**Response `200`:**
```json
[
  { "id": "uuid", "username": "ivanov", "full_name": "Иванов Иван Иванович" }
]
```
Поиск: case-insensitive по `username` и `full_name`. Без `search` — все пользователи (кроме текущего опционально).

### 5.3 Meetings

#### `GET /meetings?start_date={ISO}&end_date={ISO}&user_id={uuid}`

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "title": "Синк команды",
    "creator_id": "uuid",
    "creator_name": "Иванов Иван Иванович",
    "start_time": "2026-07-08T10:00:00Z",
    "end_time": "2026-07-08T11:00:00Z",
    "participants": [
      { "id": "uuid", "full_name": "Петрова Анна Сергеевна" }
    ]
  }
]
```

#### `POST /meetings`

**Request:**
```json
{
  "title": "Синк команды",
  "start_time": "2026-07-08T10:00:00Z",
  "end_time": "2026-07-08T11:00:00Z",
  "participant_ids": ["uuid1", "uuid2"]
}
```

**Правила:** создатель автоматически добавляется в участники, если не указан.

**Response `201`:** объект встречи (как в GET).  
**Response `409`:**
```json
{
  "detail": "Конфликт расписания",
  "conflicts": [
    {
      "user_id": "uuid",
      "full_name": "Петрова Анна Сергеевна",
      "meeting_title": "Стендап",
      "start_time": "2026-07-08T10:30:00Z",
      "end_time": "2026-07-08T11:00:00Z"
    }
  ]
}
```

#### `DELETE /meetings/{id}`

**Response `204`:** пустое тело.  
**Response `403`:** не автор.  
**Response `404`:** не найдено.

#### `POST /meetings/check-availability`

**Request:**
```json
{
  "start_time": "2026-07-08T10:00:00Z",
  "end_time": "2026-07-08T11:00:00Z",
  "participant_ids": ["uuid1", "uuid2"]
}
```

**Response `200`:**
```json
{
  "available": ["uuid1"],
  "busy": [
    {
      "user_id": "uuid2",
      "full_name": "Петрова Анна Сергеевна",
      "meeting_title": "Стендап",
      "start_time": "2026-07-08T10:30:00Z",
      "end_time": "2026-07-08T11:00:00Z"
    }
  ]
}
```

### 5.4 Коды ошибок валидации

**Response `422`:**
```json
{
  "detail": [
    { "loc": ["body", "title"], "msg": "...", "type": "..." }
  ]
}
```

---

## 6. Безопасность

| # | Мера | Реализация |
|---|------|------------|
| S-01 | JWT Access | 15 мин, cookie `access_token` |
| S-02 | JWT Refresh | 7 дней, cookie `refresh_token` |
| S-03 | Cookie flags | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` |
| S-04 | Пароли | bcrypt, cost factor ≥ 12 |
| S-05 | Rate limit | `/auth/login`: 5 req/min/IP → `429` |
| S-06 | SQL | Только параметризованные запросы SQLAlchemy |
| S-07 | XSS | Pydantic: strip HTML/script из строковых полей |
| S-08 | CORS | `allow_origins=[FRONTEND_URL]`, `allow_credentials=True` |

---

## 7. Бизнес-правила и краевые случаи

### 7.1 Race condition (SQLite)

При `POST /meetings`:

```python
async with db_session.begin():
    await db_session.execute(text("BEGIN IMMEDIATE"))
    # 1. Проверка пересечений для всех participant_ids + creator_id
    # 2. При конфликте → HTTPException(409) → ROLLBACK
    # 3. INSERT meetings + meeting_participants
# COMMIT
```

Формула пересечения: `start_A < end_B AND end_A > start_B`

### 7.2 Часовые пояса

**Каноническое правило: единый часовой пояс отображения — Москва (`Europe/Moscow`, UTC+3, без переходов на летнее время).**

| Слой | Часовой пояс |
|------|--------------|
| БД (хранение) | UTC (`...Z`) |
| API (запросы/ответы) | UTC (`...Z`) |
| UI (отображение, календарь, таймлайн) | **MSK — всегда, для всех пользователей** |
| UI (ввод в форме, time picker) | **MSK — всегда** |

Правила реализации:

- Локальный часовой пояс устройства пользователя **игнорируется**: сотрудник в любом регионе видит одинаковое расписание в московском времени.
- Frontend конвертирует через `@date-fns/tz` (`TZDate`) с явной зоной `Europe/Moscow`:
  - **render:** UTC-строка `...Z` → MSK (UTC + 3 часа);
  - **submit:** введённое в форме время трактуется как MSK → конвертируется в UTC `...Z` перед отправкой.
- Запрещено использовать `new Date(...)` / `Intl` с неявной зоной устройства для отображения времени встреч.
- Рядом с временем в UI допускается (рекомендуется) подпись «МСК».
- Backend не выполняет конвертаций в MSK — он принимает и отдаёт только UTC. Валидация «не в прошлом» (§7.3) выполняется в UTC.

### 7.3 Валидация интервалов

| Правило | Значение |
|---------|----------|
| `start_time` в прошлом | Запрещено (допуск ±60 сек) |
| `end_time > start_time` | Обязательно |
| Мин. длительность | 15 минут |
| Макс. длительность | 24 часа |
| `title` | 1–200 символов, без HTML |

### 7.4 Mobile UI/UX

- Без фиксированных ширин в px; layout — flex/grid + `w-full`.
- Touch targets: min **44×44 px** (`min-h-11 min-w-11` в Tailwind).
- Skeleton screens при загрузке календаря.
- `-webkit-overflow-scrolling: touch` на таймлайне.
- UI-дизайн фаз 5–6 — **только через MCP `user-stitch`** (см. `AGENTS.md`).

---

## 8. Конфигурация окружения

### 8.1 Backend (`backend/.env.example`)

```env
DATABASE_URL=sqlite+aiosqlite:///./data/meetmanager.db
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
```

`COOKIE_SECURE=false` — только для локальной разработки по HTTP.

### 8.2 Frontend (`frontend/.env.example`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 8.3 `.gitignore` (минимум)

```gitignore
# Python
__pycache__/
*.py[cod]
.venv/
venv/

# Node
node_modules/
dist/

# Secrets & data
.env
backend/data/*.db
backend/data/*.db-*

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db
```
