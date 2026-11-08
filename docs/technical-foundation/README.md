# Техническая основа

Документ фиксирует техническую основу MVP. Сценарии — `docs/first-version.md`. Термины — `DOMAIN.md`. Решения — `docs/adr/`.

## Стек

- Backend: ASP.NET Core на .NET 10 LTS, EF Core, PostgreSQL 17.
- Frontend: React, TypeScript, Vite. SPA.
- API: REST, OpenAPI, Problem Details.
- Архитектура: модульный монолит, вертикальные срезы.
- Репозиторий: монорепозиторий, один `.sln` и `pnpm`.
- Окружение: Docker Compose.
- ID: UUID версии 7.

## Модули

| Модуль | Ответственность | Схема | Зависит от |
| --- | --- | --- | --- |
| Employees | компания, сотрудник, приглашение, пароль, сессия, профиль, GitHub username | `employees` | SharedKernel |
| Projects | проект, сервис, репозиторий, инструкция | `projects` | SharedKernel |
| AgentConnections | токены агента, API bootstrap | `agent_connections` | SharedKernel, Employees.Contracts, Projects.Contracts, Access.Contracts |
| Access | участие в проекте, GitHub App, команды GitHub, синхронизация, отзыв доступа | `access` | SharedKernel, Employees.Contracts, Projects.Contracts |

`SharedKernel` и `Infrastructure` — общие библиотеки, не модули. `SharedKernel` владеет ID, `Result`, ошибками и часами. `Infrastructure` владеет outbox, email и middleware сессий.

Модуль ссылается на другой модуль только через `*.Contracts`. Host ссылается на все модули и собирает их. Зависимости модулей не образуют циклов. Проверку членства выполняет host через `Access.Contracts`.

## Вертикальные срезы

Код внутри модуля организован по сценариям. Один срез содержит endpoint, обработчик, валидацию, проверку доступа и работу с данными. Слоёв `Controllers`, `Services` и `Repositories` нет. Общий код модуля лежит в его папке `Shared`.

## Данные

- Одна БД PostgreSQL. Схема на модуль.
- Каждый модуль владеет своей схемой и своим `DbContext`.
- Модуль не читает и не пишет в таблицы другого модуля.
- Внешних ключей между схемами нет. Связи — только по ID.
- В каждой таблице есть `company_id`. Компания — сущность в модуле Employees.
- Все ID — UUID версии 7.
- Миграции EF Core — отдельные на модуль. Один запуск применяет все миграции. API миграции при старте не выполняет.
- Seed — отдельная идемпотентная команда. Она создаёт компанию и приглашение первого сотрудника.

## Межмодульное взаимодействие

- Запросы — синхронно, через `*.Contracts`. Без SQL-джойнов между схемами.
- Побочные действия — асинхронно, через транзакционный outbox.
- Outbox — таблица в схеме каждого модуля. Диспетчер у каждого модуля свой и читает только свою схему.
- Статусы outbox: `pending`, `processed`, `failed`. Повторы с растущей паузой, затем `failed`.
- Обработчик идемпотентен: он хранит ID обработанных событий в своей схеме.
- Событие несёт ID и минимум данных.
- RabbitMQ в MVP нет. Шина спрятана за `IEventBus`. RabbitMQ добавляем, когда появится второй процесс.

Пример: модуль Employees создаёт сотрудника и фиксирует транзакцию. Событие уходит в outbox. Модуль Access получает событие и выдаёт доступ. Одной транзакции на два модуля нет.

## Структура репозитория

```text
/apps
  /api                  ASP.NET Core host
  /web                  React + Vite + TypeScript
/src
  /modules
    /Employees
      /Employees
      /Employees.Contracts
    /Projects
      /Projects
      /Projects.Contracts
    /AgentConnections
      /AgentConnections
      /AgentConnections.Contracts
    /Access
      /Access
      /Access.Contracts
  /shared
    /SharedKernel
    /Infrastructure
/infra
  docker-compose.yml
  .env.example
/docs
```

## Локальное окружение

- Docker: `db` (PostgreSQL 17) и `mailhog`.
- API и Vite запускаются локально.
- Vite проксирует `/api` в API. Один origin.
- Полный Compose: `db`, `api`, `web`, `mailhog`. Для smoke-проверки.

## Аутентификация

- SPA: HttpOnly-cookie, серверная сессия в схеме `employees`, CSRF-токен.
- Сессия: 7 дней без активности, 30 дней максимум.
- Пароль хранится хешем. Сброса пароля в MVP нет.
- Токен агента — Bearer-токен в схеме `agent_connections`.
- JWT для SPA не используем.
- Компания определяется по slug в пути. Сессия хранит `company_id`.

## API

- Web API: `/api/v1`.
- API агента: `/api/agent/v1`.
- Ошибки — Problem Details.
- OpenAPI публикуется. Типы фронтенда генерируются из схемы.
- Контракт — `docs/technical-foundation/web-api-contract.md`.

## Агент

- REST API и CLI.
- Один endpoint: `GET /api/agent/v1/bootstrap`.
- Bearer-токен. Только чтение.
- Возвращает компанию, проекты, сервисы, репозитории (`fullName`, `sshUrl`, `httpsUrl`), инструкции и GitHub username.
- Ошибки: `401`, `403`, `404`.
- Пагинации нет.
- MCP-адаптер — позже.

## GitHub App

- Модуль Access владеет установкой.
- Команда `aidp-<project-slug>` на проект. Право `write` на репозитории проекта.
- Сотрудник указывает GitHub username в профиле.
- Webhooks в MVP нет. Синхронизацию повторяет outbox.
- Права App: Members read/write, Administration write, Metadata read. `Contents` не нужен.

## Конфигурация и секреты

- `appsettings.json` и переменные окружения.
- Секреты не в Git. `.env.example` в Git, `.env` нет.
- Ключ GitHub App монтируется файлом.
- В разработке — user-secrets.

## Логирование и эксплуатация

- Структурные JSON-логи с ID запроса.
- Метрик, трейсинга и алертов в MVP нет.
- `/health/live` и `/health/ready`. `/api/v1/status` проверяет БД.
- Деплой — один хост с Docker Compose. Nginx отдаёт SPA и проксирует `/api`.
- Kubernetes и авто-деплой не берём.

## Срез 0

Первый срез доказывает цепочку фронтенд → бэкенд → БД.

- `GET /api/v1/status` проверяет соединение с PostgreSQL.
- Страница `/status` показывает результат.
- Скелет репозитория по структуре выше.
- Docker Compose, миграции, seed, OpenAPI.

## ADR

- [0001 — Модульный монолит и вертикальные срезы](../adr/0001-modular-monolith-vertical-slices.md)
- [0002 — Общая БД и company_id](../adr/0002-shared-multi-tenant-company-id.md)
- [0003 — Четыре модуля и контракты в процессе](../adr/0003-four-modules-and-in-process-contracts.md)
- [0004 — Транзакционный outbox](../adr/0004-transactional-outbox.md)
- [0005 — Схема на модуль, EF Core и UUIDv7](../adr/0005-schema-per-module-and-ef-migrations.md)
- [0006 — Аутентификация, сессии и токены агента](../adr/0006-authentication-sessions-and-agent-tokens.md)
- [0007 — API агента и CLI](../adr/0007-agent-api-and-cli.md)
- [0008 — Интеграция с GitHub App](../adr/0008-github-app-integration.md)
- [0009 — Структура репозитория и версии рантаймов](../adr/0009-repository-structure-and-runtime.md)
- [0010 — Стек фронтенда](../adr/0010-frontend-stack.md)
- [0011 — Локальное окружение, конфигурация и эксплуатация](../adr/0011-local-environment-config-and-operations.md)
- [0012 — Тесты на публичных швах и реальной инфраструктуре](../adr/0012-tests-at-public-seams-on-real-infrastructure.md)

## Следующие шаги

- Реализовать срез 0 по `docs/technical-foundation/implementation-plan.md`.
- Детали модулей проектировать по ходу работы: сущности, инварианты, сценарии и события.
