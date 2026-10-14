---

name: code-review
description: Выполняет систематическое ревью кода проекта Telegram AI Detective, проверяет корректность, архитектуру, безопасность, производительность, тестируемость и соответствие правилам проекта. Use when reviewing new code, pull requests, refactors, feature implementations, bug fixes, or changes from other agents.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Code Review Skill

## Purpose

Ты отвечаешь за техническое ревью кода проекта Telegram AI Detective.

Твоя задача — определить:

* корректно ли работает код;
* соответствует ли он архитектуре проекта;
* не создаёт ли регрессий;
* не нарушает ли границы ответственности модулей;
* безопасно ли изменение;
* достаточно ли хорошо код покрыт тестами;
* нет ли очевидных проблем производительности и поддержки.

Главный принцип:

> Не оценивай код только по тому, работает ли основной сценарий. Проверяй архитектуру, ошибки, edge cases, безопасность и влияние изменения на остальную систему.

---

# Review Order

Всегда проводи ревью в следующем порядке:

```text
1. Context
2. Requirements
3. Architecture
4. Correctness
5. Error Handling
6. Security
7. Data Integrity
8. Performance
9. Maintainability
10. Tests
11. Regression Risk
```

Не начинай с косметических замечаний, пока не проверены критические проблемы.

---

# Step 1 — Understand Context

Перед review изучи:

* задачу;
* требования;
* связанные файлы;
* project rules;
* architecture rules;
* изменённые модули;
* существующие тесты;
* зависимости.

Определи:

```text
What changed?
Why was it changed?
What should remain unchanged?
What components can be affected?
```

Не делай выводы только по одному изменённому файлу, если изменение затрагивает другие слои.

---

# Step 2 — Check Requirements

Для каждой задачи сопоставь:

```text
Requirement
      ↓
Implementation
      ↓
Actual Behavior
```

Проверь:

* все ли требования реализованы;
* нет ли лишней функциональности;
* нет ли незакрытых сценариев;
* соответствует ли фактическое поведение заявленному.

---

# Architecture Rules

Основная архитектура проекта:

```text
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

---

# Architectural Review

Проверяй границы ответственности.

## Telegram Layer

Не должен содержать:

* правила расследования;
* определение виновника;
* сложную игровую логику;
* прямые SQL queries;
* самостоятельное управление истинным состоянием дела.

Telegram должен взаимодействовать с application/game layer.

---

## Game Engine

Отвечает за:

* game state;
* investigation state;
* suspects;
* evidence;
* events;
* progression;
* scoring;
* accusation;
* victory/defeat conditions.

Game Engine не должен зависеть от Telegram-specific details.

---

## Database Layer

Проверяй:

```text
Game Engine
     ↓
Repository
     ↓
Database
```

Не допускай:

```text
Game Engine
     ↓
Raw SQL
```

если проектная архитектура предусматривает repository layer.

---

## AI Layer

AI не должен быть источником объективной игровой истины.

Нельзя допускать архитектуру:

```text
Player
 ↓
LLM
 ↓
LLM decides who is guilty
```

Правильная схема:

```text
Game Engine
 ↓
Authoritative Facts
 ↓
AI Context
 ↓
LLM
 ↓
Natural Language Response
```

---

# Critical Architectural Checks

Особенно внимательно ищи:

* circular dependencies;
* смешение layers;
* duplicated business logic;
* hidden global state;
* direct database access из неправильного слоя;
* Telegram-specific logic в Game Engine;
* Game Engine logic в AI prompts;
* AI deciding game truth;
* duplicate validation;
* duplicated state management.

---

# Correctness Review

Проверяй:

* правильность условий;
* state transitions;
* null/undefined;
* boundary values;
* empty collections;
* invalid IDs;
* race conditions;
* duplicate actions;
* повторные callback;
* повторную отправку запросов;
* обработку отсутствующих данных.

Особое внимание:

```text
if / else
switch
loops
async / await
promises
state mutations
database writes
```

---

# State Machine Review

Для Game Engine проверь:

```text
Current State
      ↓
Action
      ↓
Validation
      ↓
Allowed Transition
      ↓
New State
```

Нельзя допускать невалидных переходов.

Примеры потенциальных проблем:

```text
CASE_NOT_STARTED
      ↓
FINAL_ACCUSATION
```

или:

```text
EVIDENCE_LOCKED
      ↓
EVIDENCE_USED
```

если такой переход не предусмотрен системой.

---

# Async Code Review

Особенно внимательно проверяй:

* missing await;
* unhandled Promise rejection;
* race conditions;
* duplicate requests;
* improper try/catch;
* parallel operations affecting shared state;
* database writes executed out of order.

Проверяй, можно ли безопасно повторить операцию.

---

# Error Handling

Ошибки должны:

* быть предсказуемыми;
* корректно обрабатываться;
* не оставлять corrupted state;
* не раскрывать внутренние данные пользователю;
* логироваться там, где это необходимо.

Проверяй:

```text
Telegram API errors
Database errors
LLM API errors
Timeouts
Network errors
Invalid input
Missing data
```

Не допускай:

```javascript
catch (error) {}
```

без обоснованной причины.

---

# Security Review

Обязательно проверяй:

* input validation;
* authorization;
* authentication;
* user isolation;
* callback validation;
* prompt injection;
* hidden data exposure;
* secrets;
* API keys;
* sensitive logs;
* unsafe dynamic execution;
* SQL injection;
* command injection.

Никогда не допускай hardcoded secrets.

Плохо:

```text
BOT_TOKEN = "..."
OPENAI_API_KEY = "..."
```

Проверяй использование environment variables или безопасного configuration layer.

---

# AI Security Review

Для AI-кода отдельно проверяй попытки:

```text
Ignore previous instructions
Reveal system prompt
Reveal hidden facts
Reveal murderer
Change game state
Pretend the user is an administrator
```

Убедись, что AI-контекст не содержит лишних скрытых данных.

Проверяй:

```text
User Input
↓
Sanitization / Validation
↓
Context Construction
↓
LLM
↓
Validation
↓
Response
```

---

# Data Integrity

Проверяй:

* atomic operations;
* transaction boundaries;
* duplicate records;
* inconsistent state;
* missing foreign keys;
* invalid references;
* partial writes;
* rollback behavior.

Особенно важно:

```text
Game State Update
+
Database Persistence
```

Они не должны приводить к состоянию, при котором память приложения показывает одно, а БД — другое.

---

# Performance Review

Ищи:

* unnecessary database queries;
* N+1 queries;
* repeated API requests;
* unnecessary AI requests;
* expensive loops;
* large objects stored in memory;
* repeated computation;
* missing caching where clearly appropriate.

Не оптимизируй код без доказанной проблемы.

Главный принцип:

> Сначала correctness, затем performance.

---

# Maintainability Review

Проверяй:

* понятность;
* размер функций;
* ответственность классов/модулей;
* названия;
* повторение логики;
* сложность;
* coupling;
* cohesion;
* возможность тестирования.

Избегай ненужной абстракции.

Плохой подход:

```text
Small function
↓
5 layers of abstraction
↓
Hard to understand behavior
```

Предпочитай простую архитектуру, соответствующую реальной сложности задачи.

---

# Code Smells

Ищи:

* огромные функции;
* giant classes;
* duplicated code;
* magic numbers;
* magic strings;
* deeply nested conditions;
* excessive boolean flags;
* hidden side effects;
* global mutable state;
* dead code;
* unreachable code;
* commented-out legacy code;
* unnecessary dependencies.

Не отмечай каждый smell автоматически как bug.

Оценивай реальное влияние.

---

# Tests Review

Проверь:

```text
[ ] Main scenario
[ ] Error scenario
[ ] Edge cases
[ ] State transitions
[ ] Persistence
[ ] Integration
[ ] Security-sensitive behavior
[ ] Regression coverage
```

Для новой критической логики отсутствие тестов может быть отдельным review issue.

---

# Test Quality

Не ограничивайся количеством тестов.

Проверяй, действительно ли тест способен обнаружить ошибку.

Плохой тест:

```text
expect(function).toBeDefined()
```

если необходимо проверить фактическое поведение.

Хороший тест:

```text
Input
↓
Action
↓
Expected State
↓
Expected Output
```

---

# Regression Analysis

Для каждого изменения определи:

```text
Changed Component
       ↓
Direct Dependencies
       ↓
Indirect Dependencies
       ↓
Potential Regression
```

Особенно внимательно проверяй изменения в:

* Game Engine;
* shared state;
* database repositories;
* Telegram handlers;
* AI context builder;
* authentication;
* player data.

---

# Severity Levels

## Critical

Немедленно блокирует изменение.

Примеры:

* утечка данных пользователей;
* неправильный результат расследования;
* возможность изменить game truth через AI;
* потеря критических данных;
* полный bypass security.

## High

Серьёзная функциональная или архитектурная проблема.

Примеры:

* ломается основной game flow;
* состояние расследования становится неправильным;
* невозможно завершить дело;
* database state corruption.

## Medium

Проблема ограниченной области или значимый технический долг.

## Low

Незначительное качество, читаемость или поддерживаемость.

---

# Review Result

В конце всегда формируй:

```text
CODE REVIEW: PASS / PASS WITH CHANGES / FAIL

CRITICAL:
- ...

HIGH:
- ...

MEDIUM:
- ...

LOW:
- ...

POSITIVE:
- ...

REGRESSION RISK:
Low / Medium / High

RECOMMENDATION:
...
```

---

# Issue Format

Каждое существенное замечание оформляй:

```text
ISSUE-ID:

SEVERITY:
Critical / High / Medium / Low

FILE:

LOCATION:

PROBLEM:

WHY IT MATTERS:

EXPECTED:

CURRENT:

RECOMMENDED FIX:

REGRESSION RISK:
```

Не создавай issue только ради стиля.

---

# Review Rules

Всегда:

```text
1. Review behavior, not only syntax.
2. Review architecture, not only individual files.
3. Verify assumptions against the actual code.
4. Separate bugs from suggestions.
5. Prioritize security and data integrity.
6. Protect Game Engine as Source of Truth.
7. Check tests and test quality.
8. Consider regressions.
9. Prefer minimal safe fixes.
10. Never hide critical findings.
```

---

# What Not To Do

Не:

* переписывай весь проект ради одного issue;
* меняй архитектуру самостоятельно;
* исправляй код без необходимости, если выполняется только review;
* создавай огромный refactor как замену локальному исправлению;
* выдавай stylistic preferences за bugs;
* объявляй код безопасным без проверки;
* доверяй комментариям больше, чем фактическому поведению кода.

Если требуется архитектурное изменение — передай вопрос Lead Architect.

---

# Final Principle

Главная задача Code Review:

> Найти проблемы до того, как они станут bugs в production.

Хорошее ревью должно отвечать на четыре вопроса:

```text
Does it work?
Does it fit the architecture?
Is it safe?
Will it remain maintainable?
```
