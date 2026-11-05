# Техническая основа

Документ фиксирует решения для MVP. Сценарии MVP описаны в `docs/first-version.md`. Термины — в `DOMAIN.md`. Решения — в `docs/adr/`.

Папка `docs/technical-foundation/` — точка входа в техническую основу. ADR остаются в `docs/adr/` по правилу репозитория.

## Стек

- Backend: ASP.NET Core Web API, EF Core, PostgreSQL.
- Frontend: React, Vite, TypeScript.
- Архитектура: модульный монолит.
- API: контроллеры.
- Окружение: Docker Compose.
- Границы: отдельный проект .NET и отдельная схема PostgreSQL на модуль.
- Проверка границ: NetArchTest в CI.

## Модули

| Модуль | Ответственность | Схема | Зависит от |
| --- | --- | --- | --- |
| SharedKernel | ID, Result, ошибки, часы, базовые события | — | — |
| Companies | компания, slug, настройки | `companies` | SharedKernel |
| Identity | сотрудник, GitHub username, пароль, приглашение, сессия, деактивация | `identity` | SharedKernel, Companies.Contracts |
| Projects | проект, сервис, репозиторий, инструкция, участники | `projects` | SharedKernel, Identity.Contracts |
| Integrations | GitHub App, установка, команды, доступ к репозиториям, статус синхронизации | `integrations` | SharedKernel, Companies.Contracts, Projects.Contracts, Identity.Contracts |
| Agents | токены агентов, вход агента, выдача разрешённых данных только для чтения | `agents` | SharedKernel, Identity.Contracts, Projects.Contracts |

Контракты — публичные интерфейсы, DTO и события. Модули не используют Domain и Infrastructure друг друга. Email и outbox — инфраструктура, не модули.

## Правила продукта и границы

- «Все участники равны» — в Projects нет роли у участника.
- «Добавлять только в своих проектах» — Projects проверяет членство действующего сотрудника.
- «Один сервис — один репозиторий» — уникальное ограничение в Projects.
- «Одна инструкция на проект» — уникальное ограничение в Projects.
- «Проект соответствует команде GitHub» — Projects публикует событие, Integrations синхронизирует команду.
- «Увольнение закрывает доступ» — Identity публикует событие, Projects, Integrations и Agents реагируют.
- «Агент не шире сотрудника» — Agents проверяет токен и членство сотрудника. Служебной учётной записи нет.
- «Агент только читает» — API агента не меняет людей, проекты и токены.
- «GitHub username в профиле» — сотрудник указывает username при принятии приглашения.
- «Один репозиторий — один сервис» — репозиторий уникален в компании.
- «Доступ к репозиторию — push» — команда проекта получает право `write`.
- «Админской роли нет» — нет полей ролей. Панель админа отложена.

## Изменение данных

- Каждый модуль владеет своей схемой и своим `DbContext`.
- Прямых записей в таблицы другого модуля нет.
- Связи между модулями — только по ID, без внешних ключей между схемами.
- Команда внутри модуля выполняется в одной транзакции.
- Побочные действия других модулей идут через транзакционный outbox.
- Outbox пишется в той же транзакции, что и изменение.
- Фоновый сервис читает outbox и вызывает обработчики.
- Обработчики идемпотентны и повторяются при ошибке.
- Запросы между модулями идут через контракты, без SQL-джойнов между схемами.

## Проверка границ

- Каждый модуль — отдельный проект .NET.
- Всё, кроме контрактов, имеет `internal`.
- Компилятор не даёт использовать чужие внутренние типы.
- NetArchTest проверяет запрещённые зависимости.
- Architecture tests запускаются в CI и ломают сборку при нарушении.

## Структура репозитория

```text
/apps
  /web                 React + Vite + TypeScript
  /api                 ASP.NET Core: контроллеры, DI, auth, health
/src
  /modules
    /Companies
    /Identity
    /Projects
    /Integrations
    /Agents
  /shared
    /SharedKernel
    /Infrastructure    outbox, email, clock
/tests
  /ArchitectureTests
  /IntegrationTests
  /UnitTests
  /E2E
/infra
  docker-compose.yml
  /docker
  .env.example
/docs
  /adr
  /technical-foundation
    README.md
    web-api-contract.md
    implementation-plan.md
DOMAIN.md
```

## Точки входа

- `apps/web` — React SPA.
- `apps/api` — ASP.NET Core host: контроллеры, аутентификация, health checks, outbox hosted service.
- `apps/api --migrate` — применить миграции и выйти.
- `apps/api --seed` — создать компанию и приглашение и выйти.
- Отдельного worker в MVP нет.

## Аутентификация и доступ

- Web: HttpOnly-cookie с серверной сессией в PostgreSQL.
- Один origin: Nginx проксирует `/api` в production, Vite proxy в разработке.
- CSRF: antiforgery-токен.
- Сессия: 7 дней без активности, 30 дней максимум.
- Пароли: встроенный `PasswordHasher<Employee>` на PBKDF2.
- Приглашение: 7 дней, одноразовое, хеш в базе.
- Сброса пароля в MVP нет.
- Компания: slug в пути `/acme/...`. Сессия хранит `company_id`.
- Токены агента: несколько на сотрудника, префикс `agt_`, SHA-256, 90 дней, отзыв.
- API агента только для чтения.
- Агент использует личные учётные данные GitHub сотрудника.

Подробности — `docs/adr/0005-authentication-and-tokens.md`.

## API агента

- Один endpoint: `GET /api/agent/v1/bootstrap`.
- Авторизация: Bearer-токен агента.
- Возвращает компанию, проекты, сервисы, репозитории и инструкции.
- Репозиторий: `fullName`, `sshUrl`, `httpsUrl`.
- API только для чтения.
- Версия стоит в пути.
- Ошибки: `401`, `403`, `404`.
- Пагинации в MVP нет.
- OpenAPI-схема публикуется.
- Отчёта о проверке доступа нет. Агент проверяет GitHub сам.

Подробности — `docs/adr/0007-agent-api-contract.md`.

## Инструкция и CLI агента

- Инструкция — Markdown с разделом `## Установка`.
- Один подраздел `### <service-name>` на сервис.
- Команды в `bash`-блоках, запуск в корне репозитория сервиса.
- CLI `aidp-agent` на .NET 10, self-contained.
- Команды: `connect`, `bootstrap`, `prepare`, `check`.
- Токен в конфиге ОС с доступом только для пользователя, override `AIDP_TOKEN`.
- Рабочая папка `./.aidp/<company>/<project>/<service>`.
- Существующие репозитории CLI не трогает.
- Проверка доступа через `git ls-remote`.

Подробности — `docs/adr/0010-agent-instruction-and-cli.md`.

## Web API

- REST, базовый путь `/api/v1`.
- Cookie-сессия и CSRF.
- Компания берётся из сессии.
- Ошибки в Problem Details.
- Полного справочника сотрудников нет.
- Контракт — `docs/technical-foundation/web-api-contract.md`.

## UI

- React Router, TanStack Query, React Hook Form, Zod, Mantine.
- Типы API генерируются из OpenAPI, CI проверяет расхождение.
- Экраны: вход, приглашение, проекты, создание проекта, карточка проекта, компания, профиль, 404/403.
- Корень `/` ведёт на `/acme/login`.

Подробности — `docs/adr/0011-ui-stack-and-screens.md`.

## GitHub App

- Сотрудник вводит GitHub username при принятии приглашения.
- Username хранится в профиле сотрудника в Identity.
- Платформа создаёт команду `aidp-<project-slug>` на проект.
- Команда получает право `push` на каждый репозиторий проекта.
- Один репозиторий принадлежит одному сервису в компании.
- Установка App может быть на все или выбранные репозитории.
- Если репозиторий вне установки, платформа показывает ошибку.
- Статус синхронизации: `pending`, `synced`, `failed`.
- Outbox повторяет синхронизацию.
- Webhooks в MVP не используем.
- Права App: Organization permissions Members read/write, Repository permissions Administration write, Metadata read. Contents не нужен.
- Installation ID находится через `GET /orgs/{org}/installation` с JWT.
- Синхронизация команд с IdP должна быть выключена.

Подробности — `docs/adr/0008-github-app-integration.md`.

## Миграции и стартовые данные

- Миграции: one-shot сервис `migrate` в Compose. API ждёт успешного завершения.
- `migrate` использует образ API с командой `--migrate`.
- Seed: команда `--seed` создаёт компанию и приглашение для первого сотрудника.
- Первый сотрудник задаёт пароль по ссылке. Пароль не хранится в конфигурации.
- Seed идемпотентен.

Подробности — `docs/adr/0006-migrations-seed-config-email.md`.

## Локальное окружение

Docker Compose: `db`, `migrate`, `api`, `web`, `mailhog`.

- `db`: PostgreSQL, volume, healthcheck `pg_isready`.
- `migrate`: one-shot, применяет миграции и завершается.
- `api`: зависит от `db` и успешного `migrate`, проверки `/health/live` и `/health/ready`.
- `web`: Nginx, отдаёт React и проксирует `/api` в `api`, проверка `/healthz`.
- В разработке Vite проксирует `/api` в API. Это сохраняет один origin.
- `mailhog`: SMTP и UI для приглашений.
- Приглашения отправляются через outbox. Сбой почты не блокирует приглашение.
- `.env.example` хранится в Git, `.env` не хранится.
- Ключ GitHub App монтируется файлом, не лежит в переменных.
- Секреты не попадают в Git и логи.

## CI и проверки

- CI: GitHub Actions.
- Обязательные проверки PR: backend build, тесты, architecture tests, проверка миграций; frontend lint, typecheck, тесты, build, проверка OpenAPI-типов; `docker compose config`.
- Интеграционные тесты используют Testcontainers с PostgreSQL.
- GitHub в тестах заменяется фейковым адаптером.
- Кеш NuGet и npm.
- Полный Compose smoke запускается на `main` или вручную.
- Branch protection на `main`: только PR, обязательные проверки, без прямого push.
- Деплоя в MVP нет.

Подробности — `docs/adr/0009-ci-and-checks.md`.

## Безопасность и эксплуатация

- Журнал деактивации в Identity.
- Rate limit: 5 попыток в минуту на вход и приглашения.
- Очистка сессий раз в день.
- Пароль минимум 12 символов.
- Outbox: 10 попыток, затем `failed`.
- Seed: `GitHub:Organization`, автоматический поиск installation.
- Без деплоя, метрик, трейсинга и алертов в MVP.

Подробности — `docs/adr/0012-mvp-security-and-operations.md`.

## ADR

- [0001 — Модульный монолит](../adr/0001-stack-modular-monolith.md)
- [0002 — Общий сервис с company_id](../adr/0002-shared-multi-tenant-company-id.md)
- [0003 — Границы модулей и outbox](../adr/0003-module-boundaries-and-outbox.md)
- [0004 — Без панели админа в MVP](../adr/0004-no-admin-panel-in-mvp.md)
- [0005 — Аутентификация, сессии и токены агента](../adr/0005-authentication-and-tokens.md)
- [0006 — Миграции, стартовые данные, конфигурация и email](../adr/0006-migrations-seed-config-email.md)
- [0007 — Контракт API агента](../adr/0007-agent-api-contract.md)
- [0008 — Интеграция с GitHub App](../adr/0008-github-app-integration.md)
- [0009 — CI и обязательные проверки](../adr/0009-ci-and-checks.md)
- [0010 — Инструкция и CLI агента](../adr/0010-agent-instruction-and-cli.md)
- [0011 — UI-стек и экраны](../adr/0011-ui-stack-and-screens.md)
- [0012 — Безопасность и эксплуатация MVP](../adr/0012-mvp-security-and-operations.md)

## Следующие шаги

- Настроить branch protection в GitHub.
- Реализовать срез 0 по `docs/technical-foundation/implementation-plan.md`.
- Затем срезы S1–S6.
