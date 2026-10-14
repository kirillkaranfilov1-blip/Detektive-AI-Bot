---

name: game-engine
description: Разрабатывает и сопровождает Game Engine Telegram AI Detective: game state, investigation state machine, suspects, evidence, events, progression, scoring, accusations, hints, win/loss conditions и игровые правила. Use when implementing or modifying core game logic, state transitions, investigation mechanics, scoring, evidence systems, or case behavior.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Game Engine Skill

## Purpose

Ты отвечаешь за центральную игровую логику проекта Telegram AI Detective.

Game Engine является **единственным Source of Truth** для объективного состояния расследования.

Он определяет:

* что произошло;
* кто виновен;
* какие доказательства существуют;
* какие факты являются истинными;
* что известно каждому персонажу;
* что доступно игроку;
* какое состояние имеет расследование;
* какие действия разрешены;
* когда расследование завершено;
* правильно ли игрок сделал обвинение.

Главный принцип:

> AI не определяет игровую истину. Telegram не определяет игровую истину. Game Engine определяет игровую истину.

---

# Core Architecture

Основная схема:

```text id="w85m7k"
Telegram
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

```text id="3c7vye"
Game Engine
      ↓
Authoritative Facts
      ↓
AI Context
      ↓
LLM
      ↓
Character Response
```

Game Engine не должен зависеть от Telegram-specific API.

---

# Responsibilities

Game Engine отвечает за:

* case lifecycle;
* game state;
* investigation state;
* suspects;
* evidence;
* locations;
* events;
* character knowledge;
* unlock conditions;
* progression;
* player actions;
* hints;
* scoring;
* streaks;
* accusations;
* victory/defeat;
* investigation completion;
* consistency validation.

---

# Source of Truth

Все объективные игровые данные должны исходить из Game Engine или из его authoritative data model.

К таким данным относятся:

```text id="x7y4mk"
Case
├── Killer
├── Victim
├── Timeline
├── Suspects
├── Evidence
├── Locations
├── Events
├── Secrets
└── Conditions
```

AI может получить только разрешённый Game Engine context.

---

# What Game Engine Must NOT Do

Game Engine не должен:

* отправлять Telegram сообщения;
* создавать Telegram keyboards;
* обращаться к Telegram API;
* формировать UI;
* самостоятельно генерировать AI dialogue;
* хранить API keys;
* содержать Telegram-specific presentation logic.

Правильное разделение:

```text id="9hhvsz"
Game Engine
    ↓
Result / DTO
    ↓
Telegram Renderer
```

---

# Game State

Game state должен быть явным и предсказуемым.

Пример:

```text id="4td1t7"
IDLE
↓
CASE_STARTED
↓
INVESTIGATION
↓
QUESTIONING
↓
EVIDENCE_REVIEW
↓
FINAL_PHASE
↓
ACCUSATION
↓
COMPLETED
```

Конкретные состояния могут отличаться в зависимости от реализации проекта.

---

# State Machine

Любой переход должен проходить через:

```text id="w0v0wi"
Current State
      ↓
Requested Action
      ↓
Validation
      ↓
Allowed Transition?
      ↓
State Mutation
      ↓
New State
```

Не допускай прямого изменения состояния из внешнего слоя.

Плохо:

```javascript id="q7t50v"
game.state = "COMPLETED";
```

если mutation должна выполняться через Game Engine API.

Хорошо:

```javascript id="3r9u0e"
gameEngine.completeCase(playerId, caseId);
```

---

# State Transition Rules

Для каждого состояния должны быть определены допустимые действия.

Пример:

```text id="sbe0xh"
CASE_STARTED
 ├── inspect evidence
 ├── talk to suspect
 ├── visit location
 └── open notes
```

Нельзя:

```text id="h5v7v4"
CASE_STARTED
   ↓
FINAL_RESULT
```

если условия завершения не выполнены.

---

# Investigation Lifecycle

Стандартный flow:

```text id="7ezb95"
Create Player
      ↓
Create Investigation
      ↓
Load Case
      ↓
Initialize State
      ↓
Investigation
      ↓
Discover Information
      ↓
Unlock Evidence
      ↓
Question Suspects
      ↓
Form Theory
      ↓
Accusation
      ↓
Evaluate
      ↓
Result
      ↓
Persist
```

---

# Case Model

Case должен быть детерминированным.

Минимально необходимая информация:

```text id="nzv9d6"
Case
├── id
├── title
├── description
├── victim
├── killer
├── suspects
├── evidence
├── locations
├── timeline
├── events
└── rules
```

Не храните критически важную истину только внутри prompt.

---

# Suspect System

Каждый подозреваемый может иметь:

```text id="94qb4p"
Suspect
├── id
├── name
├── role
├── motive
├── alibi
├── relationships
├── knowledge
├── secrets
├── behavior
└── dialogue context
```

Game Engine определяет:

* что подозреваемый реально знает;
* что он имеет право сообщить;
* какие факты можно разблокировать;
* какие события связаны с ним.

AI отвечает только за естественную формулировку диалога.

---

# Character Knowledge

Отделяй:

```text id="1a0u3c"
World Truth
```

от:

```text id="w0h6v5"
Character Knowledge
```

Пример:

```text id="o8shqk"
WORLD TRUTH
Киллер = Suspect A

CHARACTER KNOWLEDGE
Suspect B knows:
- victim was arguing with A
- does not know the murder location
```

AI не должен получать весь `WORLD TRUTH`.

---

# Evidence System

Каждое доказательство должно иметь состояние.

Пример:

```text id="j1qfwd"
LOCKED
↓
DISCOVERABLE
↓
DISCOVERED
↓
INSPECTED
↓
USED
```

Конкретные состояния могут отличаться.

Evidence может содержать:

```text id="56w4ue"
id
type
title
description
location
owner
relatedSuspects
unlockConditions
contradictions
importance
```

---

# Unlock Conditions

Доступность контента должна определяться Game Engine.

Примеры:

```text id="y8ukok"
Evidence unlocked when:
- player visited location
- suspect interviewed
- another evidence discovered
- event triggered
- required time reached
```

Не реализуй такие условия внутри Telegram handlers или AI prompts.

---

# Timeline

Для детективной игры timeline является authoritative data.

Храни:

```text id="i48bop"
timestamp
location
participants
event
visibility
conditions
```

Игрок может видеть только разрешённую часть timeline.

Game Engine определяет, какие события раскрыты.

---

# Event System

События должны быть детерминированными.

Пример:

```text id="24z2km"
PLAYER_DISCOVERED_EVIDENCE
PLAYER_INTERVIEWED_SUSPECT
PLAYER_VISITED_LOCATION
HIDDEN_EVENT_TRIGGERED
NEW_CLUE_UNLOCKED
CASE_PHASE_CHANGED
```

Event должен иметь:

* type;
* payload;
* timestamp;
* source;
* resulting state changes.

---

# Player Actions

Все игровые действия должны проходить через Game Engine.

Пример:

```text id="8y5u3v"
inspectEvidence()
talkToSuspect()
visitLocation()
useHint()
addNote()
accuseSuspect()
```

Каждое действие должно:

1. проверить состояние;
2. проверить доступность;
3. проверить права;
4. выполнить изменение;
5. вернуть результат.

---

# Action Result

Game Engine должен возвращать структурированный результат.

Пример:

```javascript id="5p1f8h"
{
    success: true,
    action: "INSPECT_EVIDENCE",
    stateChanged: true,
    unlocked: [],
    events: [],
    scoreDelta: 25
}
```

Для ошибки:

```javascript id="qf9z1c"
{
    success: false,
    reason: "EVIDENCE_LOCKED",
    stateChanged: false
}
```

Не заставляй Telegram слой самостоятельно вычислять результат.

---

# Validation

Перед каждым критическим action проверяй:

```text id="e7jf8w"
Player exists
↓
Investigation exists
↓
Correct case
↓
Action allowed
↓
Required conditions fulfilled
↓
State valid
↓
Execute
```

---

# Accusation System

Обвинение является критическим действием.

Flow:

```text id="fz8t3k"
Player selects suspect
      ↓
Game Engine validates investigation state
      ↓
Evaluate suspect against authoritative killer
      ↓
Calculate result
      ↓
Calculate score
      ↓
Complete / fail case
      ↓
Persist result
```

Game Engine самостоятельно определяет правильность обвинения.

Не AI.

Не Telegram.

---

# Scoring

Scoring должен быть детерминированным.

Пример:

```text id="6k9e9z"
Base Score
+ Evidence Bonus
+ Correct Accusation Bonus
+ Streak Bonus
- Incorrect Accusation Penalty
- Hint Penalty
```

Конкретные формулы должны находиться в Game Engine.

Не дублируй score calculations в Telegram или AI.

---

# Hints

Подсказки должны контролироваться Game Engine.

Например:

```text id="z2p8e2"
50/50
Computer Hint
Evidence Hint
Location Hint
```

Game Engine должен контролировать:

* доступность;
* стоимость;
* одноразовость;
* эффект;
* изменение score.

---

# Anti-Cheat

Не доверяй данным клиента.

Проверяй:

* evidence ID;
* suspect ID;
* location ID;
* action;
* current phase;
* hint availability;
* score;
* player state.

Плохо:

```text id="x7z8aa"
client sends score = 999999
```

Game Engine должен вычислять score самостоятельно.

---

# Persistence

Game Engine взаимодействует с Repository:

```text id="1kf7wq"
Game Engine
      ↓
Repository
      ↓
Database
```

Не используй прямой SQL внутри Game Engine, если проектом предусмотрен Repository Layer.

После критических state changes состояние должно быть сохранено.

---

# Transaction Safety

Для операций, которые изменяют несколько связанных частей state, учитывай atomicity.

Например:

```text id="7ixm0e"
Accusation
├── update investigation
├── calculate score
├── mark case completed
└── save result
```

Не допускай состояния:

```text id="p9oqhw"
Case = COMPLETED
Score = old
Result = missing
```

если архитектура предполагает atomic operation.

---

# AI Integration

Game Engine должен создавать AI context.

Пример:

```text id="g9gk46"
Authoritative Case Data
        ↓
Relevant Facts
        ↓
Character Knowledge
        ↓
Current Investigation State
        ↓
Conversation Context
        ↓
AI Context
```

AI context должен быть минимально необходимым.

---

# AI Boundaries

Никогда не передавай AI без необходимости:

* истинного виновника;
* скрытых evidence;
* внутренних IDs;
* secret conditions;
* других игроков;
* internal scoring rules.

Исключение возможно только если конкретная AI-модель/роль действительно должна знать эти данные.

---

# AI Output

AI output не должен напрямую изменять Game Engine.

Неправильно:

```text id="7bq0v5"
LLM
 ↓
"Player discovered evidence X"
 ↓
Game Engine trusts text
```

Правильно:

```text id="p4k1pa"
Game Engine
 ↓
Determines available information
 ↓
LLM generates response
 ↓
Game Engine/Application validates action
```

---

# Determinism

Критические игровые решения должны быть deterministic.

Особенно:

* culprit;
* evidence;
* unlock conditions;
* scoring;
* accusation result;
* win/loss;
* state transitions.

LLM randomness не должна влиять на объективную истину игры.

---

# Persistence Recovery

Game Engine должен поддерживать:

```text id="9t5p4x"
Start
↓
Play
↓
Save
↓
Process restart
↓
Load
↓
Continue
```

После загрузки state должен оставаться логически эквивалентным предыдущему состоянию.

---

# Concurrency

Учитывай одновременные действия:

```text id="w2hfz6"
Action A
Action B
```

Особенно для:

* accusation;
* hints;
* evidence;
* score;
* state transitions.

Не допускай двойного выполнения критического action.

---

# Error Handling

Ошибки Game Engine должны быть структурированными.

Пример:

```text id="j0cnqc"
CASE_NOT_FOUND
INVESTIGATION_NOT_FOUND
INVALID_STATE
ACTION_NOT_ALLOWED
EVIDENCE_LOCKED
SUSPECT_NOT_AVAILABLE
HINT_ALREADY_USED
CASE_COMPLETED
INVALID_ACCUSATION
```

Не возвращай необработанные database/LLM errors пользователю.

---

# Testing Strategy

Game Engine должен иметь максимальное тестовое покрытие среди компонентов проекта.

Минимум:

```text id="bfj05r"
[ ] Case creation
[ ] Investigation creation
[ ] State transitions
[ ] Evidence unlock
[ ] Suspect access
[ ] Character knowledge
[ ] Events
[ ] Scoring
[ ] Hints
[ ] Accusation
[ ] Completion
[ ] Persistence
[ ] Invalid actions
[ ] Duplicate actions
[ ] Concurrent actions
```

---

# State Transition Tests

Для каждой transition проверяй:

```text id="51zh4b"
Current State
Action
Expected State
Expected Result
```

И отдельный negative test:

```text id="hwy1kh"
Current State
Invalid Action
Expected Rejection
State Must Remain Unchanged
```

---

# Invariant Testing

Определи invariants проекта.

Примеры:

```text id="h9ktm9"
[ ] Completed case cannot return to active state
[ ] Score cannot become negative unless explicitly allowed
[ ] Hidden evidence cannot be used
[ ] Locked suspect cannot be questioned
[ ] AI cannot modify authoritative state
[ ] Player cannot access another player's investigation
```

После изменений проверяй эти invariants.

---

# Performance

Избегай:

* лишних database reads;
* повторного загрузки всего case;
* повторных AI requests;
* unnecessary recalculation;
* expensive operations внутри частых actions.

Но:

> Не жертвуй deterministic behavior и correctness ради преждевременной оптимизации.

---

# Maintainability

Game Engine должен быть:

* модульным;
* тестируемым;
* предсказуемым;
* независимым от Telegram;
* независимым от конкретного LLM provider.

Предпочитай:

```text id="9v6t7h"
Pure Game Logic
        +
Clear Interfaces
        +
Repository
        +
AI Adapter
```

вместо монолитного класса.

---

# Recommended Module Separation

Пример:

```text id="7r8wnb"
game/
├── engine/
│   ├── GameEngine
│   ├── InvestigationEngine
│   └── StateMachine
│
├── cases/
│   ├── CaseLoader
│   └── CaseValidator
│
├── suspects/
│   └── SuspectService
│
├── evidence/
│   └── EvidenceService
│
├── events/
│   └── EventEngine
│
├── scoring/
│   └── ScoreService
│
├── accusations/
│   └── AccusationService
│
└── hints/
    └── HintService
```

Это рекомендация, а не обязательная структура. Сохраняй существующую архитектуру проекта, если она уже определена.

---

# Interaction With Other Agents

## Lead Architect

Подключай при:

* изменении Game Engine architecture;
* изменении public interfaces;
* изменении state model;
* спорных архитектурных решениях.

## Telegram Developer

Передавай ему:

* actions;
* result DTOs;
* available commands;
* state-independent rendering data.

Не передавай игровые правила в Telegram.

## Database Engineer

Используй его для:

* schema;
* migrations;
* repositories;
* persistence changes.

## AI Engineer

Передавай ему:

* authoritative context;
* character knowledge;
* allowed information;
* AI interfaces.

AI Engineer не должен менять Game Engine truth.

## QA Engineer

Каждая значимая игровая механика должна проходить QA.

---

# Development Workflow

При создании новой игровой механики:

```text id="3fj2b8"
1. Define game rule
2. Define authoritative data
3. Define state changes
4. Define allowed actions
5. Define edge cases
6. Define persistence requirements
7. Implement engine logic
8. Add unit tests
9. Add integration tests
10. Connect Application Layer
11. Connect Telegram
12. QA regression
```

---

# Definition of Done

Game Engine feature готова, когда:

```text id="7m9zbn"
[ ] Game rule defined
[ ] State transitions defined
[ ] Authoritative data defined
[ ] Invalid actions rejected
[ ] Persistence supported
[ ] Tests added
[ ] Edge cases tested
[ ] Concurrency considered
[ ] AI boundaries preserved
[ ] Telegram independence preserved
[ ] No Critical/High regression
[ ] QA approved
```

---

# Final Principles

Всегда соблюдай:

```text id="l9e5y8"
Game Engine owns truth.
State transitions must be explicit.
Actions must be validated.
Critical decisions must be deterministic.
AI does not decide game truth.
Telegram does not contain game logic.
Database access goes through Repository.
Every important rule must be testable.
```

Главный принцип:

> Game Engine должен быть единственным местом, где система решает, что в игровом мире является правдой.
