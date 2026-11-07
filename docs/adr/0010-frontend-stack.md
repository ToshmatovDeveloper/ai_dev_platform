# Стек фронтенда

SPA на React, TypeScript и Vite. Маршруты — React Router. Данные — TanStack Query. Формы — React Hook Form и Zod. Компоненты — Mantine. Типы API генерируются из OpenAPI.

Причины: зрелая экосистема. Vite быстрый. Mantine ускоряет MVP. Next.js не нужен: SSR и SEO для закрытого приложения не требуются.

## Рассмотренные варианты

- Next.js: лишний серверный рендеринг.
- shadcn/ui и Tailwind: больше ручной работы для MVP.

## Последствия

- Один origin через прокси.
- Типы API синхронизированы с OpenAPI.
- Экраны определяются при проектировании модулей.
