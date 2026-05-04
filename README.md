# FreelanceHub

Інформаційна система для фрілансерів — курсовий проект з дисципліни «Проектування інформаційних систем» (3 курс, 6 семестр, спеціальність 126).

## Стек технологій

- **Backend/Frontend**: Next.js 16 (JavaScript, App Router)
- **БД**: PostgreSQL 15+
- **CSS**: Tailwind CSS v4
- **Авторизація**: NextAuth.js (Credentials, JWT) — автентифікація через PostgreSQL-ролі
- **DB access**: pg (node-postgres), параметризовані SQL-запити

## Вимоги

- **Git**
- **Node.js** 18.18 або новіше
- **PostgreSQL** 15 або новіше

## Покрокова інструкція встановлення з нуля

### Крок 1 — Встановити Git

1. Перейти на [git-scm.com/download/win](https://git-scm.com/download/win)
2. Завантажити і запустити інсталятор
3. Всі налаштування залишити за замовчуванням → натискати "Next" → "Install"
4. Після встановлення **закрити і відкрити PowerShell заново**
5. Перевірити: `git --version` — має вивести версію

### Крок 2 — Встановити Node.js

1. Перейти на [nodejs.org](https://nodejs.org) → завантажити версію **LTS**
2. Запустити інсталятор, всі налаштування за замовчуванням
3. Після встановлення **закрити і відкрити PowerShell заново**
4. Перевірити: `node --version` — має вивести 18.x або вище

### Крок 3 — Встановити PostgreSQL

1. Перейти на [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) → "Download the installer"
2. Завантажити версію **17** або новіше
3. Запустити інсталятор:
   - Password: придумати пароль для користувача `postgres` (запам'ятати!)
   - Port: `5432` (за замовчуванням)
   - Locale: залишити за замовчуванням
4. **Stack Builder** в кінці — можна скасувати
5. Додати PostgreSQL до PATH: під час встановлення поставити галочку або вручну додати `C:\Program Files\PostgreSQL\17\bin` до змінної PATH
6. Перевірити: `psql --version`

### Крок 4 — Клонувати репозиторій

```bash
git clone https://github.com/KendiAndrew/freelance-hub.git
cd freelance-hub
```

### Крок 5 — Встановити залежності

```bash
npm install
```

### Крок 6 — Налаштувати змінні оточення

Скопіювати файл `.env.example` у `.env.local`:

```bash
copy .env.example .env.local
```

Відкрити `.env.local` у блокноті і замінити `YOUR_PASSWORD` на пароль PostgreSQL з Кроку 3:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/freelance_db
NEXTAUTH_SECRET=supersecretkey123
NEXTAUTH_URL=http://localhost:3000
```

### Крок 7 — Створити базу даних

```bash
psql -h localhost -U postgres -c "CREATE DATABASE freelance_db;"
psql -h localhost -U postgres -d freelance_db -f sql/init_db.sql
```

> При виконанні psql запитає пароль — ввести пароль з Кроку 3.

`init_db.sql` автоматично створює таблиці, ролі та наповнює базу тестовими даними.

### Крок 8 — Запустити

```bash
npm run dev
```

Відкрити [http://localhost:3000](http://localhost:3000)

## Тестові акаунти

Пароль для всіх: `password123`

| Логін | Роль |
|-------|------|
| admin | Адміністратор |
| ivan_koval | Замовник |
| olena_shevch | Замовник |
| dev_andriy | Виконавець |
| designer_max | Виконавець |

## Архітектура безпеки

Автентифікація реалізована на рівні СУБД:

- При логіні backend підключається до PostgreSQL **від імені користувача** з наданим паролем
- PostgreSQL сам перевіряє пароль — при невірному підключення відхиляється
- При успіху створюється JWT-сесія (NextAuth)
- Для запитів до БД використовується `SET ROLE` — кожен запит виконується з привілеями відповідної ролі (`freelance_admin`, `freelance_client`, `freelance_contractor`, `freelance_guest`)
- Паролі не зберігаються в таблиці `Users` — лише в системному каталозі PostgreSQL (`pg_authid`)

| Роль PostgreSQL | Пароль | Привілеї |
|---|---|---|
| `freelance_admin` | `admin_pass123` | Повний доступ |
| `freelance_client` | `client_pass123` | CRUD проекти, угоди, відгуки |
| `freelance_contractor` | `contractor_pass123` | Перегляд проектів, завдання, угоди |
| `freelance_guest` | `guest_pass123` | SELECT публічний каталог |

## Структура проекту

```
├── app/                  # Сторінки (Next.js App Router)
│   ├── api/              # API Routes (серверна частина)
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
│   ├── init_db.sql       # Схема БД + ролі + тестові дані
│   └── freelance_db_dump.sql  # Резервна копія БД
├── docs/                 # Документація (пояснювальна записка, ER-діаграма)
└── tests/                # E2E тести (Playwright)
```

## База даних

- 10 таблиць, 5 ENUM типів, 1 домен
- 3 представлення (VIEW)
- 5 функцій, 3 тригери
- 4 ролі з RLS (Row Level Security)

ER-діаграма: `docs/er-diagram.png`
