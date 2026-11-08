# Скрипты проверки

`scripts/verify.mjs` запускает доступные проверки перед pull request. Скрипт не падает, пока нет кода и `package.json`. Отсутствующую проверку он печатает как `skipped: <причина>`.

## Быстрый уровень

Запуск: `node scripts/verify.mjs`.

Скрипт всегда проверяет ссылки в документации командой `node scripts/check-doc-links.mjs`. При наличии `*.sln` в корне он запускает `dotnet build` и `dotnet test`. При наличии `apps/web/package.json` он запускает `pnpm --dir apps/web lint`, `pnpm --dir apps/web typecheck` и `pnpm --dir apps/web test`. Этот уровень не требует Docker.

## Полный уровень

Запуск: `node scripts/verify.mjs --full`.

Скрипт дополнительно запускает аудит уязвимостей .NET, проверку compose, E2E и gitleaks. Каждую проверку он выполняет, только если есть нужный файл или инструмент. Иначе он печатает `skipped`.
