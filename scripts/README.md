# Скрипты проверки

`scripts/verify.mjs` запускает проверки затронутых частей перед pull request. Скрипт не падает, пока нет кода и `package.json`. Отсутствующую проверку он печатает как `skipped: <причина>`.

## Быстрый уровень

Запуск: `node scripts/verify.mjs`.

Скрипт сравнивает рабочее дерево с `main`. Он всегда проверяет ссылки в документации командой `node scripts/check-doc-links.mjs`. .NET-проверки `dotnet build` и `dotnet test` он запускает при изменении `apps/api`, `src/modules`, `src/shared` или `tests`. Web-проверки `pnpm --dir apps/web lint`, `typecheck` и `test` он запускает при изменении `apps/web`. Тесты скриптов `node --test "scripts/**/*.test.mjs"` он запускает при изменении `scripts/`. Этот уровень не требует Docker.

## Полный уровень

Запуск: `node scripts/verify.mjs --full`.

Скрипт игнорирует изменённые части и запускает все доступные проверки. Он добавляет аудит уязвимостей .NET, проверку compose, E2E и gitleaks. Каждую проверку он выполняет, только если есть нужный файл или инструмент. Иначе он печатает `skipped`.
