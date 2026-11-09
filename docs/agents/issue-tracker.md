# Трекер задач: GitHub

Задачи и спецификации этого репозитория живут как GitHub issues. Для всех операций используй CLI `gh`.

## Соглашения

- **Создать задачу**: `gh issue create --title "..." --body "..."`. Для многострочных тел используй heredoc.
- **Прочитать задачу**: `gh issue view <number> --json number,title,body,labels,comments`.
- **Список задач**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` с подходящими фильтрами `--label` и `--state`.
- **Сделать задачу подзадачей родительской**: `gh issue create --parent <parent> ...`, или позже `gh issue edit <parent> --add-sub-issue <child>` (`gh` 2.94+). Старый `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (id базы данных, как в разделе **Блокировка** ниже). Без подзадач помести `Part of #<parent>` в начало тела дочерней задачи.
- **Блокировка**: **нативные зависимости задач** GitHub, каноничное и видимое в UI представление. Добавь ребро через `gh issue create --blocked-by <n>,<n> ...` или `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Старый `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, где `<blocker-db-id>` — числовой **id базы данных** блокера (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, а _не_ `#number` или `node_id`). Где зависимости недоступны, используй строку `Blocked by: #<n>, #<n>` в начале тела дочерней задачи. Задача разблокирована, когда все блокеры закрыты.
- **Подсчитать открытые блокеры**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (только открытые блокеры; 0 — можно начинать). `gh issue view <n> --json blockedBy` также перечисляет закрытые блокеры, поэтому фильтруй: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Прокомментировать задачу**: `gh issue comment <number> --body "..."`
- **Навесить / снять метки**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Закрыть**: опубликуй объяснение через `gh issue comment <number> --body "..."`, затем `gh issue close <number>`. На уже закрытой задаче `gh issue close --comment` отбрасывает комментарий и всё равно завершается с кодом 0.

Репозиторий выводится из `git remote -v`; `gh` делает это автоматически при запуске внутри клона.

Заводи задачи только в собственный репозиторий пользователя. В форке `gh` может по умолчанию указывать на upstream-родителя, поэтому перед первым `gh issue create` за сессию проверь цель через `gh repo view --json nameWithOwner` и подтверди её с пользователем, если это не его репозиторий.

## Pull request'ы как поверхность триажа

**PR как поверхность запросов: нет.** _(Поставь `да`, если этот репозиторий трактует внешние PR как запросы на фичи; `/triage` читает этот флаг.)_

GitHub использует одно пространство номеров для задач и PR, поэтому голый `#42` может быть любым из них: разрешай через `gh pr view 42` и при неудаче через `gh issue view 42`.

## Когда скилл говорит «опубликуй в трекере задач»

Создай GitHub issue.

## Когда скилл говорит «получи соответствующую задачу»

Прочитай, как в разделе **Прочитать задачу** выше.

## Операции wayfinding

Используются скиллом `/wayfinder`. **Карта** — это одна задача с **дочерними** задачами-решениями.

- **Карта**: одна задача с меткой `wayfinder:map`, содержащая тело с Notes / Decisions-so-far / Fog. `gh issue create --label wayfinder:map`.
- **Дочерняя задача**: задача, привязанная к карте как GitHub-подзадача (см. **Сделать задачу подзадачей родительской**). Там, где подзадачи не включены, добавь дочернюю задачу в список задач в теле карты и помести `Part of #<map>` в начало тела дочерней задачи. Метки: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). После взятия задача назначается ведущему разработчику.
- **Блокировка**: см. **Блокировка** в разделе «Соглашения».
- **Запрос фронтира**: перечисли открытых детей карты (`gh issue list --state open`, ограничившись подзадачами / списком задач карты), отбрось любые с открытым блокером (см. **Подсчитать открытые блокеры**, или открытую задачу в строке `Blocked by`) или с исполнителем; побеждает первый в порядке карты.
- **Взятие**: `gh issue edit <n> --add-assignee @me`, первая запись за сессию.
- **Решение**: `gh issue comment <n> --body "<answer>"`, затем `gh issue close <n>`, затем добавь в Decisions-so-far карты указатель контекста (gist + ссылка).
