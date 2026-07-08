# Phase 1: Инициализация БД и схемы (SQLite)
- **Дата:** 2026-07-08
- **Ветка:** phase/1-database
- **Коммит:** TBD

## Созданные/изменённые файлы
- `backend/scripts/init_db.py` — скрипт инициализации БД с DDL из SPEC §4.3
- `backend/scripts/seed.py` — скрипт заполнения БД 4 тестовыми пользователями
- `backend/data/.gitkeep` — каталог для SQLite-файла

## Верификация
```bash
cd backend
python scripts/init_db.py
# Database initialized at F:\vibe\MeetManager\backend\data\meetmanager.db

python scripts/seed.py
# Seed complete. Users in database: 4

python scripts/seed.py
# Seed complete. Users in database: 4 (идемпотентность подтверждена)

python -c "import sqlite3; c=sqlite3.connect('data/meetmanager.db'); print('Users:', c.execute('SELECT count(*) FROM users').fetchone())"
# Users: (4,)
```

## Известные ограничения
- passlib[bcrypt] имеет проблемы совместимости с bcrypt 5.x на Python 3.13. В seed.py используется прямой вызов bcrypt вместо passlib.
