---

name: project-planning
description: Планирует сложные задачи проекта, разбивает их на проверяемые этапы, определяет зависимости, ответственных агентов, критерии готовности и порядок реализации. Use when starting a feature, subsystem, architectural change, refactor, or any task that requires multiple implementation steps.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Project Planning Skill

## Purpose

Ты отвечаешь за планирование разработки проекта Telegram AI Detective.

Твоя задача — не писать код сразу, а сначала превратить задачу в чёткий, последовательный и проверяемый план реализации.

Главный принцип:

> Сначала понять задачу → определить архитектурные изменения → разбить работу на этапы → определить зависимости → установить критерии готовности → только после этого переходить к реализации.

---

# Core Rules

## 1. Не реализуй задачу до создания плана

Если задача состоит из нескольких действий, сначала создай план.

Нельзя сразу начинать массово изменять файлы без понимания:

* цели;
* существующей архитектуры;
* зависимостей;
* затрагиваемых компонентов;
* рисков;
* критериев готовности.

Для маленьких локальных изменений допускается короткий план.

---

## 2. Учитывай существующую архитектуру

Перед планированием изучи:

* структуру проекта;
* существующие модули;
* правила проекта;
* агентов;
* связанные skills;
* текущие API-контракты;
* database schema;
* Game Engine;
* Telegram layer;
* AI integration.

Не предлагай архитектуру, которая конфликтует с уже установленными правилами без явного указания на конфликт.

---

# Project Architecture

Основная архитектура:

```text
Telegram
   ↓
Telegram Developer
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

```text
Game Engine
   ↓
AI Context
   ↓
LLM
   ↓
Character Response
```

Game Engine является Source of Truth.

Следи за тем, чтобы план не переносил игровую истину в AI или Telegram layer.

---

# Planning Workflow

## Step 1 — Understand the task

Определи:

* что необходимо создать или изменить;
* зачем это необходимо;
* какую проблему решает задача;
* какой результат считается успешным.

Сформулируй конечный результат одной понятной фразой.

---

## Step 2 — Inspect the project

Перед созданием плана проверь:

```text
- project structure
- related files
- existing modules
- existing APIs
- database
- tests
- configuration
- project rules
```

Не делай предположений о существующем коде, если его можно проверить.

---

## Step 3 — Identify affected components

Для каждой задачи определи затронутые компоненты:

```text
[ ] Telegram
[ ] Application Layer
[ ] Game Engine
[ ] Database
[ ] Repository
[ ] AI / LLM
[ ] Security
[ ] QA / Tests
[ ] Documentation
```

---

## Step 4 — Determine dependencies

Определи, какие части должны быть готовы раньше других.

Пример:

```text
Database Schema
      ↓
Repository
      ↓
Game Engine
      ↓
Application Logic
      ↓
Telegram Handler
      ↓
QA
```

Нельзя планировать зависимый этап раньше его prerequisite.

---

# Agent Assignment

Используй специализированных агентов вместо одного универсального исполнителя.

## Lead Architect

Используется для:

* архитектурных решений;
* изменения структуры проекта;
* API contracts;
* конфликтующих требований;
* межсистемных изменений.

## Telegram Developer

Используется для:

* Telegram handlers;
* commands;
* callback queries;
* keyboards;
* message flow.

## Game Engine

Используется для:

* investigation logic;
* state machine;
* suspects;
* evidence;
* events;
* scoring;
* accusations.

## Database Engineer

Используется для:

* schema;
* migrations;
* repositories;
* persistence;
* queries.

## QA Engineer

Используется для:

* test plan;
* regression;
* edge cases;
* integration tests;
* bug verification.

## AI / LLM Engineer

Используется для:

* prompts;
* context management;
* character behavior;
* hallucination mitigation;
* AI safety boundaries.

---

# Task Decomposition

Большую задачу обязательно разбивай на небольшие этапы.

Хороший этап должен:

* иметь одну понятную цель;
* иметь конкретный результат;
* иметь ограниченную область изменений;
* иметь критерий готовности;
* по возможности быть проверяемым независимо.

Плохой этап:

```text
Создать всю систему расследования.
```

Хорошее разбиение:

```text
1. Создать Investigation model
2. Добавить persistence
3. Реализовать state transitions
4. Добавить evidence system
5. Подключить Telegram interaction
6. Добавить AI context
7. Написать integration tests
8. Провести regression testing
```

---

# Dependency Graph

Для сложных задач создавай зависимостями:

```text
A
↓
B
↓
C
```

или:

```text
       ┌→ B
A ─────┤
       └→ C
```

Обязательно указывай, какие этапы можно выполнить параллельно.

---

# Risk Analysis

Для каждого крупного изменения оцени:

```text
Risk:
Low / Medium / High / Critical
```

Проверь:

* риск поломки Game Engine;
* риск изменения database schema;
* риск потери данных;
* риск регрессии Telegram flow;
* риск AI hallucination;
* security risk;
* backward compatibility.

Если риск высокий, добавь отдельный этап проверки.

---

# Implementation Order

Стандартный порядок:

```text
1. Analysis
2. Architecture
3. Data Model
4. Backend / Core Logic
5. Integrations
6. Telegram Interface
7. AI Integration
8. Tests
9. Security Review
10. Regression
11. Documentation
```

Порядок можно изменить только если зависимости требуют другого порядка.

---

# Definition of Done

Каждый этап должен иметь критерии готовности.

Пример:

```text
Definition of Done:

[ ] Код реализован
[ ] Existing architecture preserved
[ ] Unit tests added
[ ] Integration tests passed
[ ] Error cases tested
[ ] No critical regression
[ ] Related documentation updated
```

Для архитектурных изменений добавляй:

```text
[ ] Lead Architect reviewed
[ ] Interfaces/contracts defined
[ ] Dependencies documented
```

---

# Plan Format

Для обычной задачи используй:

```text
## Goal

<что нужно получить>

## Current State

<что уже существует>

## Affected Components

- ...
- ...

## Implementation Plan

### Step 1 — ...
Owner: ...
Dependencies: ...
Result: ...

### Step 2 — ...
Owner: ...
Dependencies: ...
Result: ...

### Step 3 — ...
Owner: ...
Dependencies: ...
Result: ...

## Risks

- ...

## Testing

- ...

## Definition of Done

- ...
```

---

# Complex Task Format

Для большой задачи используй:

```text
# Feature Plan

## 1. Objective

...

## 2. Current Architecture

...

## 3. Required Changes

...

## 4. Components

...

## 5. Dependency Graph

...

## 6. Implementation Phases

### Phase 1
...

### Phase 2
...

### Phase 3
...

## 7. Agent Assignment

...

## 8. Testing Strategy

...

## 9. Security Considerations

...

## 10. Risks

...

## 11. Definition of Done

...
```

---

# Phase Rules

Каждая фаза должна завершаться проверяемым состоянием.

Пример:

```text
Phase 1
Database model exists
       ↓
Validation
       ↓
Phase 2
Repository works
       ↓
Tests
       ↓
Phase 3
Game Engine integration
```

Не переходи к следующей фазе, если предыдущая имеет незакрытые Critical или High проблемы.

---

# Parallel Work

Используй параллельную работу только когда задачи независимы.

Можно:

```text
Database schema ─────→ Repository
                         ↓
UI planning ───────────→ Telegram Handler
```

Нельзя параллельно менять один и тот же критический модуль несколькими агентами без согласованного контракта.

---

# Change Management

Если задача требует изменения существующей системы:

1. Определи текущий behavior.
2. Определи новый behavior.
3. Найди affected modules.
4. Найди возможные regressions.
5. Определи migration strategy.
6. Спланируй tests.
7. Только после этого переходи к implementation.

---

# Bug Planning

Если задача связана с bug:

```text
1. Reproduce
2. Identify root cause
3. Define minimal fix
4. Check affected components
5. Implement fix
6. Add regression test
7. Run regression suite
```

Не планируй переписывание большого компонента, если проблема решается локальным изменением.

---

# Refactoring

Для refactoring:

```text
1. Identify current behavior
2. Add/verify tests
3. Define target architecture
4. Split migration into safe steps
5. Refactor
6. Run regression
7. Remove legacy code only after verification
```

Не совмещай большой refactor с несколькими несвязанными feature changes без необходимости.

---

# AI-Specific Planning

Для AI-функций обязательно определяй:

```text
Input
↓
Context
↓
Prompt
↓
LLM
↓
Validation
↓
Output
```

Отдельно проверяй:

* какие данные доступны AI;
* какие данные запрещены;
* где находится Source of Truth;
* как проверяется результат;
* что происходит при hallucination;
* что происходит при API failure.

AI не должен становиться источником объективной игровой истины.

---

# Database-Specific Planning

При изменениях БД обязательно указывай:

```text
Schema
↓
Migration
↓
Repository
↓
Application/Game Engine
↓
Tests
```

План должен учитывать существующие данные и backward compatibility.

---

# QA Integration

QA должен подключаться не только после завершения разработки.

Для каждой крупной feature заранее определяй:

* unit tests;
* integration tests;
* edge cases;
* regression tests;
* security checks;
* expected failure modes.

---

# Final Planning Rules

Всегда:

```text
Analyze before implementing.
Inspect before assuming.
Plan before changing.
Define dependencies.
Assign the correct agent.
Define tests before coding.
Protect Game Engine as Source of Truth.
Minimize unnecessary changes.
Prefer incremental implementation.
Verify each phase before continuing.
```

Главный принцип:

> Хороший план должен позволять другому агенту реализовать задачу без необходимости заново придумывать архитектуру.
