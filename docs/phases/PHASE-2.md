# Phase 2: FastAPI и безопасность (Auth)
- **Дата:** 2026-07-08
- **Ветка:** phase/2-auth
- **Коммит:** (после коммита)

## Созданные/изменённые файлы
- `backend/app/__init__.py`
- `backend/app/config.py`
- `backend/app/database.py`
- `backend/app/main.py`
- `backend/app/dependencies.py`
- `backend/app/models/__init__.py`
- `backend/app/models/user.py`
- `backend/app/models/meeting.py`
- `backend/app/schemas/__init__.py`
- `backend/app/schemas/auth.py`
- `backend/app/routers/__init__.py`
- `backend/app/routers/auth.py`
- `backend/app/services/__init__.py`
- `backend/app/services/auth.py`
- `backend/pyproject.toml`

## Верификация

```bash
# POST /api/v1/auth/login - 200 + cookies
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ivanov\",\"password\":\"User123!\"}" -c cookies.txt
# Response: {"user":{"id":"...","username":"ivanov","full_name":"..."}}

# GET /api/v1/auth/me - profile by cookie
curl http://localhost:8000/api/v1/auth/me -b cookies.txt
# Response: {"id":"...","username":"ivanov","full_name":"..."}

# POST /api/v1/auth/logout - clear cookies
curl -X POST http://localhost:8000/api/v1/auth/logout -b cookies.txt
# Response: {"detail":"ok"}

# Wrong password -> 401
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ivanov\",\"password\":\"wrong\"}"
# Response: {"detail":"Неверный логин или пароль"}

# No token -> 401
curl http://localhost:8000/api/v1/auth/me
# Response: {"detail":"Не авторизован"}
```

## Реализованные эндпоинты
- `POST /api/v1/auth/login` - авторизация, 5 req/min/IP rate limit
- `POST /api/v1/auth/logout` - выход, очистка cookies
- `GET /api/v1/auth/me` - профиль текущего пользователя

## Безопасность
- JWT Access Token: 15 мин, cookie `access_token`
- JWT Refresh Token: 7 дней, cookie `refresh_token`
- Cookie flags: HttpOnly, Secure, SameSite=Strict, Path=/
- bcrypt, cost factor = 12
- Rate limit: 5 req/min/IP на `/auth/login`
- Ошибка логина: всегда "Неверный логин или пароль" (401)
- CORS: `allow_origins=[FRONTEND_URL]`, `allow_credentials=True`

## Известные ограничения
- Rate limit работает через in-memory (не для multi-instance)
- JWT secret по умолчанию "change-me-in-production"
