# Phase 6: Booking Form

- **Дата:** 2026-07-08
- **Ветка:** phase/6-booking-form
- **Stitch Project:** `projects/1664218387115460877`
- **Stitch Session IDs:**
  - ConflictModal: `11277274335566618694`
  - MeetingFormModal / Toast / FabButton: таймаут (реализованы по дизайну ConflictModal и существующему стилю)

## Созданные/изменённые файлы

- `frontend/src/hooks/useDebounce.ts` — хук debounce 300мс для поиска и check-availability
- `frontend/src/components/FabButton.tsx` — FAB кнопка «+», min 44×44px
- `frontend/src/components/MeetingFormModal.tsx` — форма бронирования:
  - title input
  - datetime-local inputs (МСК → UTC конвертация через `@date-fns/tz`)
  - поиск участников с debounce 300мс
  - мультивыбор участников с чекбоксами
  - busy-участники подсвечены красным фоном
  - `POST /meetings/check-availability` при изменении участников/времени
  - optimistic UI: 201 → Toast + обновление календаря
  - 409 → ConflictModal, форма сохранена
- `frontend/src/components/ConflictModal.tsx` — модалка конфликта с массивом conflicts
- `frontend/src/components/Toast.tsx` — уведомление «Встреча создана», auto-dismiss 3с
- `frontend/src/pages/CalendarPage.tsx` — интеграция: FAB → модалка, слот → модалка с предзаполненным временем, Toast

## Верификация

```bash
cd frontend && npm run build
# ✓ built in 402ms, 0 errors
cd frontend && npm run lint
# 1 warning (fast refresh, AuthContext — не наш файл), 0 errors
```

## Известные ограничения

- Stitch MCP `generate_screen_from_text` таймаутится для MeetingFormModal, FabButton, Toast — компоненты реализованы по дизайну ConflictModal и существующему стилю проекта
- Native `datetime-local` input используется для ввода времени (мобильные ОС показывают нативный пикер)
- Конвертация UTC ↔ МСК: введённое время трактуется как МСК, конвертируется в `...Z` перед отправкой
