# FreelanceHub

Інформаційна система для фрілансерів — курсовий проект з дисципліни «Проектування інформаційних систем» (3 курс, 6 семестр, спеціальність 126).

## Стек технологій

- **Backend/Frontend**: Next.js 16 (JavaScript, App Router)
- **БД**: PostgreSQL 15+
- **CSS**: Tailwind CSS v4
- **Авторизація**: NextAuth.js (Credentials, JWT) — автентифікація через PostgreSQL-ролі
- **DB access**: pg (node-postgres), параметризовані SQL-запити

## Вимоги до системи

| Програма | Мінімальна версія | Рекомендована |
|----------|-------------------|---------------|
| Git | 2.x | остання |
| Node.js | 18.18 | 20 LTS або 22 LTS |
| PostgreSQL | 15 | 15, 16, 17 |
| npm | 9.x | входить у Node.js |

> **Увага:** дамп БД (`freelance_db_dump.sql`) сумісний з PostgreSQL 15+.

---

## Покрокова інструкція встановлення (Windows)

### Крок 1 — Встановити Git

1. Перейти на [git-scm.com/download/win](https://git-scm.com/download/win)
2. Завантажити і запустити інсталятор (64-bit)
3. Усі налаштування залишити за замовчуванням → натискати **Next** → **Install**
4. Після встановлення **закрити і відкрити PowerShell заново**
5. Перевірити:
   ```powershell
   git --version
   # Очікуваний результат: git version 2.x.x
   ```

### Крок 2 — Встановити Node.js

1. Перейти на [nodejs.org](https://nodejs.org) → завантажити версію **LTS** (20 або 22)
2. Запустити інсталятор, усі налаштування за замовчуванням
3. Після встановлення **закрити і відкрити PowerShell заново**
4. Перевірити:
   ```powershell
   node --version
   # Очікуваний результат: v20.x.x або v22.x.x
   npm --version
   # Очікуваний результат: 10.x.x
   ```

### Крок 3 — Встановити PostgreSQL

1. Перейти на [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) → **Download the installer**
2. Завантажити версію **15, 16 або 17** (рекомендовано 17)
3. Запустити інсталятор:
   - **Password**: придумати пароль для користувача `postgres` — **запам'ятати, він знадобиться далі!**
   - **Port**: `5432` (за замовчуванням, не змінювати)
   - **Locale**: залишити за замовчуванням
4. **Stack Builder** в кінці — натиснути **Skip** або **Cancel**
5. Після встановлення **закрити і відкрити PowerShell заново**
6. Перевірити:
   ```powershell
   psql --version
   # Очікуваний результат: psql (PostgreSQL) 17.x
   ```

> Якщо `psql` не знаходиться — додайте PostgreSQL до PATH вручну:
> **Параметри Windows** → **Система** → **Про систему** → **Додаткові параметри системи** → **Змінні середовища** → у розділі **Системні змінні** знайти `Path` → **Змінити** → додати рядок `C:\Program Files\PostgreSQL\17\bin` (замінити `17` на вашу версію).

### Крок 4 — Клонувати репозиторій

```powershell
git clone https://github.com/KendiAndrew/freelance-hub.git
cd freelance-hub
```

### Крок 5 — Встановити залежності Node.js

```powershell
npm install
```

> Очікуваний результат: `added X packages` без критичних помилок.

> **Помилка на Windows** `npm : UnauthorizedAccess` — PowerShell блокує скрипти. Виконати один раз:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Після цього знову запустити `npm install`.

### Крок 6 — Налаштувати змінні середовища

Скопіювати файл `.env.example` у `.env.local`:

```powershell
copy .env.example .env.local
```

Відкрити `.env.local` у будь-якому текстовому редакторі та замінити `YOUR_PASSWORD` на пароль PostgreSQL з Кроку 3:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/freelance_db
NEXTAUTH_SECRET=supersecretkey123
NEXTAUTH_URL=http://localhost:3000
```

> **Приклад** (якщо пароль `mypassword123`):
> `DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/freelance_db`

### Крок 7 — Створити та наповнити базу даних

Відкрити PowerShell у папці проекту і виконати команди по черзі.

**7.1 — Перевірити що PostgreSQL запущений:**

```powershell
psql -h localhost -U postgres -c "SELECT version();"
```

> Введіть пароль з Кроку 3. Якщо з'явилась помилка `connection refused` — PostgreSQL не запущений. Відкрийте **Services** (Win+R → `services.msc`) і запустіть службу `postgresql-x64-XX`.

> **Windows / кирилиця**: якщо psql виводить кракозябри — виконати перед psql:
> ```powershell
> chcp 65001
> ```

**7.2 — Створити базу даних та завантажити схему:**

```powershell
psql -h localhost -U postgres -c "CREATE DATABASE freelance_db;"
psql -h localhost -U postgres -d freelance_db -f sql/init_db.sql
```

`init_db.sql` автоматично створює таблиці, ролі та наповнює базу тестовими даними.

**7.3 — Перевірити що дані завантажились:**

```powershell
psql -h localhost -U postgres -d freelance_db -c "SELECT login, role FROM users;"
```

> Має вивести список з 11 користувачів.

### Крок 8 — Запустити додаток

```powershell
npm run dev
```

Відкрити у браузері: [http://localhost:3000](http://localhost:3000)

> Якщо порт 3000 зайнятий — Next.js автоматично використає 3001. У такому разі оновіть `NEXTAUTH_URL=http://localhost:3001` у `.env.local` і перезапустіть `npm run dev`.

---

## Тестові акаунти

Пароль для всіх: **`password123`**

| Логін | Роль | Повне ім'я |
|-------|------|------------|
| `admin` | Адміністратор | — |
| `ivan_koval` | Замовник | Іван Коваль |
| `olena_shevch` | Замовник | Олена Шевченко |
| `dev_andriy` | Виконавець | Андрій Мельник |
| `designer_max` | Виконавець | Максим Коваленко |

---

## Архітектура безпеки

Автентифікація реалізована на рівні СУБД:

- При логіні backend підключається до PostgreSQL **від імені користувача** з наданим паролем
- PostgreSQL сам перевіряє пароль — при невірному підключення відхиляється
- При успіху створюється JWT-сесія (NextAuth)
- Для запитів до БД використовується `SET ROLE` — кожен запит виконується з привілеями відповідної ролі

| Роль PostgreSQL | Привілеї |
|----------------|----------|
| `freelance_admin` | Повний доступ |
| `freelance_client` | CRUD проекти, угоди, відгуки |
| `freelance_contractor` | Перегляд проектів, завдання, угоди |
| `freelance_guest` | SELECT публічний каталог |

---

## Структура проекту

```
├── app/                  # Сторінки (Next.js App Router)
│   ├── api/              # API Routes (серверна частина)
│   │   └── notifications/# Сповіщення (polling по Deal)
│   ├── admin/            # Адмін-панель
│   ├── projects/         # Каталог проектів
│   ├── contractors/      # Каталог фрілансерів
│   ├── deals/            # Угоди
│   ├── complaints/       # Скарги
│   ├── escrow/           # Ескроу-рахунки
│   ├── profile/          # Профіль користувача
│   ├── login/            # Авторизація
│   └── register/         # Реєстрація
├── components/           # React-компоненти (Navbar)
├── lib/                  # Утиліти (db.js, auth.js)
├── sql/
│   ├── init_db.sql            # Схема БД + ролі + тестові дані (з нуля)
│   └── freelance_db_dump.sql  # Повний дамп БД з поточними даними
├── docs/                 # Документація (ER-діаграма)
└── tests/                # E2E тести (Playwright)
```

## База даних

- 10 таблиць, 5 ENUM типів, 1 домен
- 3 представлення (VIEW)
- 5 функцій, 3 тригери
- 4 ролі з RLS (Row Level Security)

ER-діаграма: `docs/er-diagram.png`

---

## Типові помилки

**`psql: command not found`** — PostgreSQL не додано до PATH. Виконайте Крок 3 або вказуйте повний шлях: `& "C:\Program Files\PostgreSQL\17\bin\psql.exe"`.

**`password authentication failed`** — невірний пароль. Переконайтесь що використовуєте пароль з Кроку 3.

**`database "freelance_db" already exists`** — база вже існує. Можна продовжити або видалити:
```powershell
psql -h localhost -U postgres -c "DROP DATABASE freelance_db;"
```

**Кирилиця відображається некоректно у psql** — це особливість відображення у PowerShell, дані в БД зберігаються коректно. Перевірте через браузер на [http://localhost:3000](http://localhost:3000).

**`Port 3000 is in use`** — змініть `NEXTAUTH_URL=http://localhost:3001` у `.env.local` та перезапустіть сервер.
