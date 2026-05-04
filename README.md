# FreelanceHub

Інформаційна система для фрілансерів — курсовий проект з дисципліни «Проектування інформаційних систем» (3 курс, 6 семестр, спеціальність 126).

## Стек технологій

- **Backend/Frontend**: Next.js 16 (JavaScript, App Router)
- **БД**: PostgreSQL 15+
- **CSS**: Tailwind CSS v4
- **Авторизація**: NextAuth.js (Credentials, JWT) — автентифікація через PostgreSQL-ролі
- **DB access**: pg (node-postgres), параметризовані SQL-запити

## Вимоги

- **Node.js** 18.18 або новіше
- **PostgreSQL** 15 або новіше

## Встановлення та запуск

### 1. Встановити залежності

```bash
npm install
```

### 2. Налаштувати змінні оточення

Скопіюйте `.env.example` у `.env.local`:

- **Windows**: `copy .env.example .env.local`
- **macOS/Linux**: `cp .env.example .env.local`

Заповніть `.env.local`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/freelance_db
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

> **Підказка**: `NEXTAUTH_SECRET` — будь-який випадковий рядок. Згенерувати:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
> ```

> **Важливо**: `DATABASE_URL` має використовувати суперкористувача PostgreSQL (`postgres`), бо backend виконує `SET ROLE` для перемикання між ролями.

### 3. Налаштувати PostgreSQL

Переконайтесь, що PostgreSQL запущений. Створіть базу та виконайте ініціалізацію:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE freelance_db;"
psql -h localhost -U postgres -d freelance_db -f sql/init_db.sql
```

`init_db.sql` автоматично:
- створює схему (таблиці, типи, домени)
- створює 4 PostgreSQL-ролі з привілеями та RLS
- наповнює базу тестовими даними

### 4. Запустити

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
