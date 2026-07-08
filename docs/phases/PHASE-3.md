# Phase 3: Логика встреч и блокировок
- **Дата:** 2026-07-08
- **Ветка:** phase/3-meetings
- **Коммит:** (после коммита)

## Созданные/изменённые файлы
- `backend/app/schemas/user.py` — схемы ответов для пользователей
- `backend/app/schemas/meeting.py` — схемы для встреч, валидаторы
- `backend/app/services/meetings.py` — логика проверки конфликтов и создания встреч
- `backend/app/routers/users.py` — эндпоинт поиска пользователей
- `backend/app/routers/meetings.py` — CRUD эндпоинты для встреч
- `backend/app/main.py` — добавлены роутеры users и meetings

## Верификация

```bash
# POST /meetings - 201 Created
curl -X POST http://localhost:8001/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","start_time":"2026-12-01T10:00:00Z","end_time":"2026-12-01T11:00:00Z","participant_ids":[]}' \
  -b cookies.txt
# Response: {"id":"...","title":"Test",...}

# POST /meetings (conflict) - 409
curl -X POST http://localhost:8001/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Conflict","start_time":"2026-12-01T10:30:00Z","end_time":"2026-12-01T11:30:00Z","participant_ids":[]}' \
  -b cookies.txt
# Response: {"detail":{"detail":"Конфликт расписания","conflicts":[...]}}

# DELETE /meetings/{id} - 204 (только создатель)
curl -X DELETE http://localhost:8001/api/v1/meetings/{id} -b cookies.txt

# DELETE by non-creator - 403
curl -X DELETE http://localhost:8001/api/v1/meetings/{id} -b cookies_petrova.txt

# GET /meetings - 200
curl "http://localhost:8001/api/v1/meetings?start_date=2026-12-01T00:00:00Z&end_date=2026-12-31T23:59:59Z" -b cookies.txt

# GET /users?search= - 200
curl "http://localhost:8001/api/v1/users?search=ivan" -b cookies.txt

# POST /meetings/check-availability - 200
curl -X POST http://localhost:8001/api/v1/meetings/check-availability \
  -H "Content-Type: application/json" \
  -d '{"start_time":"2026-12-01T10:00:00Z","end_time":"2026-12-01T11:00:00Z","participant_ids":["..."]}' \
  -b cookies.txt

# Validation - 422 (past time)
curl -X POST http://localhost:8001/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Past","start_time":"2020-01-01T10:00:00Z","end_time":"2020-01-01T11:00:00Z","participant_ids":[]}' \
  -b cookies.txt
```

## Реализованные эндпоинты
- `GET /api/v1/users?search=` — поиск пользователей по username/full_name
- `GET /api/v1/meetings` — получение встреч за период с фильтрацией по user_id
- `POST /api/v1/meetings` — создание встречи с проверкой конфликтов
- `DELETE /api/v1/meetings/{id}` — удаление встречи (только создатель)
- `POST /api/v1/meetings/check-availability` — проверка доступности участников

## Валидация
- `title`: 1-200 символов, без HTML
- `start_time`: не в прошлом (допуск ±60 сек)
- `end_time > start_time`: обязательно
- Длительность: 15 мин - 24 часа
- Формат времени: ISO 8601 с суффиксом Z

## Известные ограничения
- Проверка конфликтов не использует `BEGIN IMMEDIATE` (依赖 SQLAlchemy транзакции)
- Rate limit работает через in-memory (не для multi-instance)
