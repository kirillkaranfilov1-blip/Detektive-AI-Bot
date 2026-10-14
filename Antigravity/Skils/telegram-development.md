---

name: telegram-development
description: Разрабатывает и сопровождает Telegram-слой проекта AI Detective на Node.js и Telegraf: commands, handlers, inline keyboards, callback queries, message flow, user sessions, error handling и интеграцию с Application/Game Engine. Use when implementing or modifying Telegram bot functionality.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Telegram Development Skill

## Purpose

Ты отвечаешь за Telegram-слой проекта Telegram AI Detective.

Твоя задача — реализовывать надёжное взаимодействие пользователя с игрой через Telegram, не перенося бизнес-логику в Telegram handlers.

Главный принцип:

> Telegram отвечает за взаимодействие с пользователем. Game Engine отвечает за игровую истину.

---

# Core Architecture

Основная схема:

```text id="wtr2fn"
Telegram User
      ↓
Telegram Handler
      ↓
Application Layer
      ↓
Game Engine
      ↓
Repository
      ↓
Database
```

AI:

```text id="m8izq4"
Game Engine
      ↓
AI Context
      ↓
LLM
      ↓
Character Response
      ↓
Telegram
```

Telegram layer не является источником игровой истины.

---

# Technology

Основной стек:

```text id="x8r4ff"
Node.js
Telegraf
JavaScript / TypeScript
Telegram Bot API
```

Используй существующий стек проекта.

Не добавляй новую библиотеку без необходимости.

---

# Responsibilities

Telegram Development отвечает за:

* commands;
* message handlers;
* callback queries;
* inline keyboards;
* reply keyboards;
* Telegram navigation;
* Telegram-specific formatting;
* user interaction;
* Telegram error handling;
* basic input validation;
* connection с Application Layer;
* отображение результатов Game Engine.

---

# What Telegram Layer Must NOT Do

Не помещай в Telegram handlers:

* определение виновника;
* правила расследования;
* scoring logic;
* evidence rules;
* state machine;
* сложные database queries;
* AI decision-making;
* определение победы/поражения;
* изменение authoritative game state напрямую.

Плохо:

```javascript id="xkgppw"
bot.action("accuse", async (ctx) => {
    if (suspect === "john") {
        // ...
    }
});
```

Правильно:

```javascript id="ql2y5u"
bot.action("accuse", async (ctx) => {
    const result = await investigationService.accuse(
        ctx.from.id,
        suspectId
    );

    await renderAccusationResult(ctx, result);
});
```

---

# Telegram Commands

Все команды должны быть:

* понятными;
* короткими;
* предсказуемыми;
* безопасными;
* idempotent там, где это возможно.

Типичные команды:

```text id="g7zklx"
/start
/help
/case
/profile
/stats
/settings
/cancel
```

Не добавляй команды автоматически без необходимости.

Каждая команда должна иметь:

```text id="d1u7h5"
Command
↓
Handler
↓
Application Service
↓
Result
↓
Telegram Response
```

---

# /start

`/start` должен быть безопасным при повторном использовании.

Проверяй:

```text id="z2i5wf"
New User
Existing User
Active Investigation
Completed Investigation
Invalid state
```

Повторный `/start` не должен случайно:

* удалить прогресс;
* создать дублирующего пользователя;
* сбросить расследование;
* начать новое дело без предусмотренного действия.

---

# Callback Queries

Для inline buttons:

```text id="j9oy2w"
Button
↓
callback_data
↓
Handler
↓
Validation
↓
Application/Game Engine
↓
Answer callback
↓
UI update
```

Всегда вызывай корректное завершение callback query.

Проверяй:

* callback ID;
* user ID;
* action;
* entity ID;
* current game state.

---

# Callback Data

`callback_data` должна быть:

* короткой;
* однозначной;
* валидируемой;
* безопасной.

Пример:

```text id="j7ajyn"
case:suspect:42
evidence:18
accuse:7
location:3
```

Не помещай туда большие JSON-объекты.

Не доверяй `callback_data`, полученной от клиента.

---

# Input Validation

Telegram input нельзя считать доверенным.

Проверяй:

* user ID;
* callback data;
* message content;
* command arguments;
* numeric IDs;
* enum values;
* expected state.

Например:

```text id="4m2bhy"
callback_data
      ↓
Parse
      ↓
Validate
      ↓
Authorize
      ↓
Execute
```

---

# Authorization

Перед игровым действием убедись, что пользователь имеет право его выполнить.

Например:

```text id="p4yk4d"
User A
   ↓
Evidence 123
   ↓
belongs to User A?
```

Нельзя позволять пользователю взаимодействовать с состоянием другого игрока только потому, что он передал другой ID.

---

# User Identification

Используй Telegram user ID как основной внешний идентификатор пользователя.

Не полагайся на:

* username;
* first_name;
* display_name.

Username может измениться или отсутствовать.

---

# Message Handling

Обрабатывай:

```text id="6xk02q"
Text messages
Commands
Callback queries
Photos
Documents
Unknown messages
Unsupported input
```

Не создавай отдельную игровую логику для каждого Telegram update.

Используй единый application/game flow.

---

# Conversation Flow

Для диалогов используй понятное состояние:

```text id="4rx2of"
IDLE
  ↓
INVESTIGATION
  ↓
QUESTIONING
  ↓
EVIDENCE_REVIEW
  ↓
ACCUSATION
  ↓
RESULT
```

Состояние должно храниться в соответствующем application/game layer, а не только в памяти Telegram handler.

---

# Multi-Step Interactions

Для сценариев:

```text
Нажал "Поговорить"
        ↓
Выбор подозреваемого
        ↓
Выбор действия
        ↓
Вопрос
        ↓
AI response
```

каждый этап должен иметь:

* корректное состояние;
* возможность отмены;
* обработку invalid input;
* восстановление после ошибки.

---

# Message Rendering

Telegram presentation не должна содержать бизнес-логику.

Используй отдельные функции:

```text id="cr7f1l"
renderMainMenu()
renderCase()
renderSuspects()
renderEvidence()
renderInvestigationResult()
renderAccusationResult()
```

Рендеринг получает уже рассчитанные данные.

Пример:

```text id="7evv31"
Game Engine
      ↓
Result DTO
      ↓
Telegram Renderer
      ↓
Message
```

---

# Telegram UI

Используй Telegram UX:

* короткие сообщения;
* понятные кнопки;
* логичная навигация;
* минимальное количество лишних действий;
* понятная обратная связь;
* возможность вернуться назад;
* подтверждение критических действий.

Особенно важные действия:

```text id="b3a9l0"
Accusation
Restart Case
Abandon Case
Reset Progress
```

должны иметь подтверждение, если архитектура проекта предусматривает такие действия.

---

# Editing Messages

Предпочитай:

```text id="1c5f7e"
editMessageText
editMessageReplyMarkup
```

вместо создания большого количества новых сообщений, когда это улучшает UX.

Не редактируй сообщения, которые могут быть недоступны для редактирования или уже устарели.

Обрабатывай Telegram API errors.

---

# Telegram Limits

Учитывай ограничения Telegram Bot API:

* максимальная длина сообщений;
* ограничения callback data;
* rate limits;
* ограничения медиа;
* ошибки при редактировании сообщений;
* ограничения inline keyboards.

При больших сообщениях:

```text id="1h1f2e"
Generate
↓
Split / Format
↓
Send safely
```

Не теряй смысл текста при разделении.

---

# AI Responses

Когда AI возвращает текст:

```text id="2rjll6"
Game Engine
      ↓
AI Context
      ↓
LLM
      ↓
Validated Response
      ↓
Telegram Renderer
```

Telegram layer не должен решать, правдив ли AI-ответ.

Но он должен корректно обработать:

* пустой ответ;
* слишком длинный ответ;
* API error;
* timeout;
* invalid output.

При AI failure показывай пользователю понятное сообщение и сохраняй состояние игры консистентным.

---

# Error Handling

Каждый handler должен учитывать ошибки.

Структура:

```text id="fn7pn7"
try
  ↓
validate
  ↓
call application layer
  ↓
render result
catch
  ↓
log
  ↓
safe user message
```

Не отправляй пользователю:

* stack trace;
* database errors;
* API keys;
* internal paths;
* system prompts;
* служебные данные.

---

# Logging

Логируй события, необходимые для диагностики:

```text id="f0x3p2"
user action
handler
game action
result
error
latency
```

Не логируй чувствительные данные без необходимости.

Не записывай:

* токены;
* API keys;
* секреты;
* приватные данные пользователей;
* полный system prompt.

---

# Idempotency

Особое внимание уделяй повторным действиям.

Telegram update может привести к повторной обработке.

Проверяй:

```text id="nlj8z8"
Double click
Double callback
Retry
Duplicate update
Network retry
```

Критические действия не должны случайно выполняться дважды.

Например:

```text id="w5jr7r"
Accuse
↓
Already processed?
↓
Yes → return previous result
```

если это соответствует Game Engine API.

---

# Concurrency

Учитывай ситуации:

```text id="q5v75a"
User
 ↓
Action A
 ↓
Action B
```

когда A и B приходят почти одновременно.

Особенно опасно для:

* accusation;
* evidence actions;
* state transitions;
* score;
* inventory;
* limited actions;
* hints.

Конкурентные изменения должны контролироваться Game Engine/Application Layer.

---

# Security

Проверяй:

* callback authorization;
* user isolation;
* input validation;
* rate limiting;
* command abuse;
* prompt injection;
* malicious input;
* oversized input;
* unexpected callback data.

Никогда не доверяй Telegram input только потому, что он пришёл из Telegram.

---

# Navigation

Стандартная навигация:

```text id="6n88zq"
Main Menu
├── New Investigation
├── Continue Investigation
├── Evidence
├── Suspects
├── Notes
├── Statistics
└── Settings
```

Конкретный набор зависит от текущей архитектуры проекта.

Не создавай новый navigation system, если уже существует.

---

# Separation of Concerns

Рекомендуемая структура:

```text id="m0o5ja"
src/
├── telegram/
│   ├── bot.js
│   ├── handlers/
│   ├── keyboards/
│   ├── renderers/
│   └── middleware/
│
├── application/
│
├── game/
│
├── ai/
│
├── database/
│
└── utils/
```

Не обязательно использовать именно эту структуру, если проект уже имеет другую согласованную архитектуру.

---

# Middleware

Используй middleware для cross-cutting concerns:

* user loading;
* logging;
* rate limiting;
* error handling;
* authorization;
* metrics.

Не дублируй одну и ту же проверку в каждом handler.

---

# Telegram Testing

Каждое важное Telegram изменение должно проверяться на:

```text id="m8sjfl"
[ ] /start
[ ] Commands
[ ] Callback queries
[ ] Invalid callback
[ ] Invalid input
[ ] Repeated action
[ ] Error handling
[ ] User isolation
[ ] Active game
[ ] Completed game
```

Для критических flow добавляй integration tests.

---

# Definition of Done

Telegram feature считается готовой, когда:

```text id="l7e1rj"
[ ] Handler implemented
[ ] Input validated
[ ] Authorization checked
[ ] Application/Game Engine used
[ ] No business logic leaked into Telegram layer
[ ] Error handling implemented
[ ] Duplicate actions handled
[ ] Telegram limits considered
[ ] User feedback is clear
[ ] Tests added or updated
[ ] Regression checked
```

---

# Interaction With Other Agents

## Lead Architect

Обращайся к Lead Architect при:

* изменении architecture;
* изменении boundaries;
* новых shared interfaces;
* спорных architectural decisions.

## Game Engine

Передавай игровые правила Game Engine.

## Database Engineer

Не обращайся к database напрямую, если это противоречит архитектуре. Используй Repository/Application Layer.

## AI Engineer

AI-specific logic должна находиться в AI layer.

## QA Engineer

Передавай завершённые Telegram features для проверки:

```text
Implementation
↓
QA
↓
Bug fixes
↓
Regression
```

---

# Development Workflow

При реализации Telegram feature:

```text id="72kybd"
1. Understand requirement
2. Inspect existing Telegram architecture
3. Identify Application/Game Engine API
4. Design interaction flow
5. Define callback/message structure
6. Implement handler
7. Implement rendering
8. Add validation
9. Add error handling
10. Add tests
11. Run QA/regression
```

---

# Final Principles

Всегда соблюдай:

```text id="ojq7zz"
Telegram is the interface.
Application Layer coordinates actions.
Game Engine owns game truth.
Database owns persistence.
AI generates dialogue, not game truth.
```

Главный принцип:

> Telegram handler должен быть максимально тонким: получить действие пользователя → передать его правильному слою → получить результат → корректно показать результат пользователю.
