# Phase 5: Calendar UI

- **Дата:** 2026-07-08
- **Ветка:** phase/5-calendar-ui
- **Stitch Project:** `projects/1664218387115460877`
- **Stitch Session IDs:**
  - Страница входа: `9c2da9ba7d8d471897ab2691b22aba21`
  - Календарь День: `7a3884de90914cfa9c52b6c5892ae2b9`

## Созданные/изменённые файлы

- `frontend/src/utils/timezone.ts` — утилиты UTC ↔ МСК через `@date-fns/tz`
- `frontend/src/pages/LoginPage.tsx` — форма входа по дизайну Stitch
- `frontend/src/pages/CalendarPage.tsx` — главная страница календаря (День/Неделя)
- `frontend/src/components/DayView.tsx` — вертикальный таймлайн 8:00–20:00 МСК
- `frontend/src/components/WeekView.tsx` — горизонтальная сетка 7 дней
- `frontend/src/components/ColleagueSearch.tsx` — поиск коллег debounce 300мс
- `frontend/src/components/BottomNav.tsx` — нижняя навигация День/Неделя
- `frontend/src/components/SkeletonCalendar.tsx` — skeleton при загрузке
- `frontend/src/App.tsx` — маршрутизация /login, /, protected routes

## Верификация

```bash
cd frontend && npm run build
# ✓ built in 387ms, 0 errors
cd frontend && npm run lint
# 1 warning (fast refresh), 0 errors
```

## Известные ограничения

- Stitch MCP `generate_screen_from_text` таймаутится — экранные макеты Week/Поиск не сгенерированы через Stitch
- Свайп-навигация реализована через `react-swipeable` (±день/неделя)
- FAB кнопка добавлена, но обработчик клика (MeetingFormModal) — фаза 6
- All time display uses `Europe/Moscow` timezone via `@date-fns/tz` (SPEC §7.2)
