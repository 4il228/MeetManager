# AGENTS.md — Инструкции для AI-агентов

> **Версия:** 1.1  
> **Удалённый репозиторий:** https://github.com/4il228/MeetManager  
> **Иерархия документов:** `SPEC.md` (что) → `PLAN.md` (когда) → `AGENTS.md` (как)

Каждый агент отвечает **строго за одну фазу**. Нарушение границ фазы запрещено (не трогать код других фаз, кроме явно указанных shared-файлов).

---

## Глобальный протокол (все агенты)

### 1. Старт работы

Перед любой реализацией выполнить:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b phase/N-имя    # имя ветки из PLAN.md
```

Убедиться, что зависимости предыдущей фазы в `main` (см. PLAN.md).

### 2. Чтение контекста

| Шаг | Действие |
|-----|----------|
| 1 | Прочитать свой раздел в `AGENTS.md` |
| 2 | Прочитать соответствующую фазу в `PLAN.md` |
| 3 | Прочитать указанные разделы `SPEC.md` |
| 4 | Просмотреть `docs/phases/PHASE-(N-1).md` (отчёт предыдущей фазы) |

### 3. Реализация

- Создавать файлы **только** по путям из `SPEC.md` §3.2 и Deliverables в `PLAN.md`.
- Не добавлять зависимости вне списка SPEC §3.1 без обновления SPEC.
- Не коммитить: `.env`, `*.db`, `node_modules/`, секреты.

### 4. Завершение фазы

```bash
# 1. Самопроверка — команды из PLAN.md, раздел «Верификация»
# 2. Отчёт
#    docs/phases/PHASE-N.md

git add -A
git status    # убедиться: нет .env / .db
git commit -m "feat(phase-N): <краткое описание>"

git push -u origin phase/N-имя

git checkout main
git pull origin main
git merge phase/N-имя --no-ff -m "merge: phase N — <имя>"
git push origin main
```

### 5. Формат отчёта `docs/phases/PHASE-N.md`

```markdown
# Phase N: <название>
- **Дата:** YYYY-MM-DD
- **Ветка:** phase/N-имя
- **Коммит:** <hash>

## Созданные/изменённые файлы
- path/to/file

## Верификация
<команды и результат>

## Известные ограничения
- ...

## Stitch sessions (фазы 5–6)
- <id или ссылка на MCP session>
```

### 6. Запреты

- Не переходить к фазе N+1 без push фазы N в `main`.
- Не менять DDL БД без обновления SPEC §4.
- Не менять контракт API без обновления SPEC §5.
- Фазы 5–6: **запрещён** самодельный UI-дизайн — только MCP `user-stitch`.

---

## Фаза 0: DevOps Agent — Git Init

| | |
|---|---|
| **Роль** | DevOps Agent |
| **PLAN** | Фаза 0 |
| **SPEC** | §3.2, §3.3, §8 |

### Задачи

1. `git init` (если не инициализирован).
2. `git remote add origin https://github.com/4il228/MeetManager.git` (или `set-url` если есть).
3. Создать `.gitignore` (SPEC §8.3).
4. Создать `README.md`, `docs/phases/`, `.env.example` файлы.
5. Первый коммит: `feat(phase-0): initialize repository structure`.
6. `git branch -M main && git push -u origin main`.

### Критерий готовности

`git ls-remote origin main` возвращает hash коммита.

---

## Фаза 1: Backend / DB Agent — SQLite

| | |
|---|---|
| **Роль** | Backend / DB Agent |
| **PLAN** | Фаза 1 |
| **SPEC** | §4 |
| **Ограничения** | SQLite: UUID и datetime — только `TEXT`; ISO 8601 UTC с `Z` |

### Задачи

1. `backend/scripts/init_db.py`:
   - PRAGMA: WAL, busy_timeout=5000, foreign_keys=ON
   - DDL из SPEC §4.3 (копировать дословно)
2. `backend/scripts/seed.py`:
   - 4 пользователя из SPEC §4.4
   - bcrypt hash (можно вызвать passlib в скрипте)
   - идемпотентность: `INSERT OR IGNORE` / проверка `username`
3. `backend/data/.gitkeep` (сама БД в .gitignore)

### Запрещено

- ORM-модели (это фаза 2+)
- FastAPI

---

## Фаза 2: Backend / Auth Agent — FastAPI + Security

| | |
|---|---|
| **Роль** | Backend / Auth Agent |
| **PLAN** | Фаза 2 |
| **SPEC** | §5.1, §6, §8.1 |
| **Ограничения** | Только параметризованные запросы SQLAlchemy |

### Задачи

1. Структура `backend/app/` по SPEC §3.2.
2. `slowapi`: `/api/v1/auth/login` — 5 req/min/IP → 429.
3. bcrypt через passlib, cost ≥ 12.
4. Эндпоинты:
   - `POST /api/v1/auth/login`
   - `POST /api/v1/auth/logout`
   - `GET /api/v1/auth/me`
5. JWT: Access 15 мин, Refresh 7 дней.
6. Cookies: `access_token`, `refresh_token` — HttpOnly, Secure, SameSite=Strict.
7. Ошибка логина: **всегда** `"Неверный логин или пароль"` (401).
8. Dependency `get_current_user` для защищённых роутов (пригодится в фазе 3).

### Файлы (минимум)

```
backend/app/main.py
backend/app/config.py
backend/app/database.py
backend/app/models/user.py
backend/app/schemas/auth.py
backend/app/routers/auth.py
backend/app/services/auth.py
backend/app/dependencies.py
backend/pyproject.toml
```

---

## Фаза 3: Backend Core Agent — Meetings

| | |
|---|---|
| **Роль** | Backend Core Agent |
| **PLAN** | Фаза 3 |
| **SPEC** | §5.2–5.3, §7 |
| **Ограничения** | API datetime — только `...Z`; драйвер `aiosqlite` |

### Задачи

1. Pydantic v2 схемы с валидаторами:
   - strip HTML/script из строк
   - `title`: 1–200 символов
   - `start_time`: не в прошлом (±60 сек)
   - `end_time > start_time`
   - длительность: 15 мин – 24 ч
2. Эндпоинты:
   - `GET /api/v1/users?search=`
   - `GET /api/v1/meetings?start_date=&end_date=&user_id=`
   - `POST /api/v1/meetings`
   - `DELETE /api/v1/meetings/{id}`
   - `POST /api/v1/meetings/check-availability`
3. `POST /meetings` — транзакция:
   ```python
   async with db_session.begin():
       await db_session.execute(text("BEGIN IMMEDIATE"))
       # overlap check: start_A < end_B AND end_A > start_B
       # conflict → 409 + conflicts[]
       # else → INSERT
   ```
4. DELETE — только `creator_id == current_user.id` (иначе 403).
5. Создатель автоматически в `participant_ids`.

### Формат 409 (строго)

```json
{
  "detail": "Конфликт расписания",
  "conflicts": [
    {
      "user_id": "...",
      "full_name": "...",
      "meeting_title": "...",
      "start_time": "...Z",
      "end_time": "...Z"
    }
  ]
}
```

---

## Фаза 4: Frontend / DevOps Agent — React Init

| | |
|---|---|
| **Роль** | Frontend / DevOps Agent |
| **PLAN** | Фаза 4 |
| **SPEC** | §3.1, §3.2, §8.2 |
| **Ограничения** | React 19, Vite, Tailwind; PWA обязателен |

### Задачи

1. `npm create vite@latest frontend -- --template react-ts`
2. Tailwind CSS 4.x.
3. `frontend/public/manifest.json`:
   - `name`: MeetManager
   - `display`: standalone
   - `start_url`: /
   - иконки (минимум 192, 512)
4. `frontend/public/sw.js` — cache-first для статики; регистрация в `main.tsx`.
5. `frontend/src/api/client.ts`:
   ```typescript
   axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, withCredentials: true })
   ```
6. `frontend/src/context/AuthContext.tsx` — user, login, logout, loading.
7. `vite.config.ts` — proxy `/api` → `localhost:8000` (dev).

### Запрещено

- Верстка календаря (фаза 5)
- Форма бронирования (фаза 6)

---

## Фаза 5: Frontend UI Agent — Calendar UI

| | |
|---|---|
| **Роль** | Frontend UI Agent |
| **PLAN** | Фаза 5 |
| **SPEC** | §2.1–2.2, §7.2, §7.4 |
| **MCP** | **`user-stitch` — ОБЯЗАТЕЛЕН** |
| **Часовой пояс** | Всё время в UI — **только МСК** (`Europe/Moscow`), TZ устройства игнорируется |

### КРИТИЧЕСКОЕ ТРЕБОВАНИЕ (Stitch)

Перед написанием **любого** UI-кода:

1. Вызвать `GetMcpTools` → server `user-stitch`.
2. Сгенерировать макет через Stitch для каждого экрана:
   - Login
   - Calendar (Day view)
   - Calendar (Week view)
   - Colleague search header
3. **Дождаться ответа** Stitch.
4. Реализовать код, воспроизводя макет Stitch.
5. Зафиксировать stitch session ID в `docs/phases/PHASE-5.md`.

**Самодельный дизайн запрещён.**

### Задачи

1. `LoginPage.tsx` — форма, touch ≥ 44px (`min-h-11 min-w-11`).
2. `CalendarPage.tsx` — переключатель День/Неделя.
3. `DayView.tsx` — вертикальный таймлайн, `-webkit-overflow-scrolling: touch`. Часовые метки и время встреч — в МСК (конвертация UTC → `Europe/Moscow` через `@date-fns/tz`), подпись «МСК» у шкалы.
4. `WeekView.tsx` — горизонтальная сетка 7 дней (время — тоже в МСК).
5. `ColleagueSearch.tsx` — debounce поиск → `GET /users?search=`.
6. `SkeletonCalendar.tsx` — при смене даты.
7. Свайпы: `@use-gesture/react` или `react-swipeable` — день/неделя ±1.

### Ограничения вёрстки

- Без фиксированных ширин в px; `w-full`, flex, grid.
- Touch targets ≥ 44×44 px.
- Запрещено отображать время в TZ устройства (`new Date(...).toLocaleString()` без явной зоны и т.п.) — только `Europe/Moscow` (SPEC §7.2).

---

## Фаза 6: Frontend Feature Agent — Booking Form

| | |
|---|---|
| **Роль** | Frontend Feature Agent |
| **PLAN** | Фаза 6 |
| **SPEC** | §2.3, §7.2 |
| **MCP** | **`user-stitch` — ОБЯЗАТЕЛЕН** |
| **Часовой пояс** | Ввод и отображение — **только МСК**; в API — UTC `...Z` |

### КРИТИЧЕСКОЕ ТРЕБОВАНИЕ (Stitch)

Stitch **обязателен** для: FAB, MeetingFormModal, ConflictModal, Toast.

Порядок тот же, что в фазе 5. Session IDs — в `docs/phases/PHASE-6.md`.

### Задачи

1. `FabButton.tsx` — правый нижний угол, min 44×44.
2. Клик по пустому слоту в `DayView` → открыть модалку с предзаполненным временем.
3. `MeetingFormModal.tsx`:
   - title, datetime inputs (native picker)
   - мультивыбор участников + поиск
   - debounce 300ms → `POST /meetings/check-availability`
   - busy participants — мягкий красный фон
4. `date-fns` + `@date-fns/tz` (зона строго `Europe/Moscow`):
   - render: UTC → **МСК** (не TZ устройства)
   - submit: введённое в форме время трактуется как **МСК** → `YYYY-MM-DDTHH:MM:SSZ` (UTC)
   - в модалке конфликта время из `conflicts[]` тоже конвертируется UTC → МСК
5. Optimistic UI: при 201 — добавить встречу в локальный стейт до закрытия модалки.
6. `Toast.tsx` — успех.
7. `ConflictModal.tsx` — 409, показать `conflicts[]`, **не сбрасывать** форму.

### API paths (frontend)

Все запросы через `frontend/src/api/client.ts`:
- `/meetings/check-availability` (не забыть baseURL `/api/v1`)

---

## Матрица зависимостей файлов

| Файл | Фаза | Может менять |
|------|------|--------------|
| `.gitignore`, `README.md` | 0 | 0, 6 (финал) |
| `backend/scripts/*` | 1 | 1 |
| `backend/app/routers/auth.py` | 2 | 2 |
| `backend/app/routers/meetings.py` | 3 | 3 |
| `frontend/src/context/AuthContext.tsx` | 4 | 4, 5 |
| `frontend/src/pages/CalendarPage.tsx` | 5 | 5, 6 |
| `frontend/src/components/MeetingFormModal.tsx` | 6 | 6 |

При конфликте — агент **текущей** фазы имеет приоритет на свои файлы.

---

## Быстрый FAQ агента

**Q: Можно ли пропустить push?**  
A: Нет. Push в `origin` обязателен после каждой фазы.

**Q: Что если GitHub пустой?**  
A: Фаза 0 делает первый push в `main`. Последующие фазы — merge в `main` + push.

**Q: Какой MCP для дизайна?**  
A: `user-stitch` (не `google-stitch`).

**Q: Формат времени?**  
A: Только `2026-07-08T14:30:00Z` — в API, БД и тестах.

**Q: В каком часовом поясе показывать время пользователю?**  
A: Всегда в **московском** (`Europe/Moscow`, UTC+3) — для всех пользователей, независимо от TZ устройства. Хранение и API — UTC. Конвертация только на фронтенде через `@date-fns/tz` (SPEC §7.2).

**Q: Можно ли делать фазы 5 и 6 параллельно?**  
A: Нет. Строго последовательно: 0 → 1 → 2 → 3 → 4 → 5 → 6.
