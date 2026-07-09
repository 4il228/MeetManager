# Как был реализован проект MeetManager

---

## Стадия 1 — Проектирование

На этом этапе формулировалась документация, по которой дальше работали AI-агенты.

| Шаг | Что делалось | Инструмент |
|-----|--------------|------------|
| 1 | ТЗ скармливалось в модель для поиска «подводных камней» и генерации промпта | Gemini 3.1 Pro |
| 2 | Промпт (с правками) → файл спецификации | Gemini 3.5 Flash → [`SPEC.md`](SPEC.md) |
| 3 | `SPEC.md` → промпт для декомпозиции на атомарные фазы | Gemini 3.1 Pro |
| 4 | Промпт + `SPEC.md` → план разработки | Gemini 3.5 Flash → [`PLAN.md`](PLAN.md) |
| 5 | `SPEC.md` + `PLAN.md` → указания для агентов | Gemini 3.1 Pro |
| 6 | `AGENTS.md` → усиление детерминизма | Gemini 3.5 Flash → [`AGENTS.md`](AGENTS.md) |

**Итог стадии 1** — три ключевых документа:

- [`SPEC.md`](SPEC.md) — спецификация продукта
- [`PLAN.md`](PLAN.md) — декомпозиция на фазы выполнения
- [`AGENTS.md`](AGENTS.md) — строгие правила для AI-агентов

---

## Стадия 2 — Кодинг

Каждая фаза запускалась **отдельным агентом**, чтобы избежать галлюцинаций.

| Фаза | Описание | Результат |
|------|----------|-----------|
| Phase 0 | Инициализация репозитория и DevOps | [`start.bat`](start.bat), [`stop.bat`](stop.bat), [`ports.env.example`](ports.env.example) |
| Phase 1 | Бэкенд: SQLite, DDL, сидинг | [`backend/scripts/`](backend/scripts/), [`backend/data/`](backend/data/) |
| Phase 2 | Авторизация: FastAPI + JWT | [`backend/app/routers/auth.py`](backend/app/routers/auth.py), [`backend/app/services/`](backend/app/services/) |
| Phase 3 | Бизнес-логика: встречи, проверка доступности | [`backend/app/routers/meetings.py`](backend/app/routers/meetings.py), [`backend/app/routers/users.py`](backend/app/routers/users.py) |
| Phase 4 | Фронтенд: React + Vite + Tailwind | [`frontend/`](frontend/), [`frontend/src/main.tsx`](frontend/src/main.tsx) |
| Phase 5 | UI календаря (день/неделя) | [`frontend/src/pages/CalendarPage.tsx`](frontend/src/pages/CalendarPage.tsx), [`frontend/src/components/DayView.tsx`](frontend/src/components/DayView.tsx), [`frontend/src/components/WeekView.tsx`](frontend/src/components/WeekView.tsx) |
| Phase 6 | Форма бронирования и конфликты | [`frontend/src/components/MeetingFormModal.tsx`](frontend/src/components/MeetingFormModal.tsx), [`frontend/src/components/ConflictModal.tsx`](frontend/src/components/ConflictModal.tsx) |

**Исполнитель:** MiMo V2.5 Free — каждая фаза запускалась в новом агенте.

---

## Стадия 3 — Мануальное тестирование и фиксы

Ручной прогон всех юзерфлоу, фиксы по дизайну и логике.

**Инструменты:** Cursor + Fable5

---

## Стадия 4 — Нововведения

Доделано поверх MVP по результатам тестирования:

- Администратор может **регистрировать и удалять** пользователей ([`AdminUsersModal.tsx`](frontend/src/components/AdminUsersModal.tsx))
- Открытие карточки встречи и **удаление** (только для создателя) ([`MeetingDetailModal.tsx`](frontend/src/components/MeetingDetailModal.tsx))

**Инструменты:** Cursor + Fable5

---

## Структура проекта

```
MeetManager/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Конфигурация
│   │   ├── database.py      # SQLAlchemy engine/session
│   │   ├── dependencies.py  # Depends (get_current_user и т.д.)
│   │   ├── models/          # SQLAlchemy модели
│   │   ├── routers/         # API роутеры (auth, meetings, users)
│   │   ├── schemas/         # Pydantic схемы
│   │   └── services/        # Бизнес-логика
│   ├── scripts/             # init_db.py, seed.py
│   └── pyproject.toml       # Python зависимости
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client
│   │   ├── components/      # UI компоненты
│   │   ├── context/         # React Context (Auth)
│   │   ├── pages/           # LoginPage, CalendarPage
│   │   ├── types/           # TypeScript типы
│   │   └── utils/           # Утилиты (даты, таймзона МСК)
│   ├── public/              # PWA манифест, иконки
│   └── vite.config.ts       # Vite конфигурация
├── docs/phases/             # Отчёты по фазам
├── SPEC.md                  # Спецификация
├── PLAN.md                  # План разработки
├── AGENTS.md                # Правила для AI-агентов
└── FLOW.md                  # Этот файл
```
