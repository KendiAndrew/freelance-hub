# FreelanceHub

Інформаційна система для фрілансерів — курсовий проект з дисципліни «Проектування інформаційних систем» (3 курс, 6 семестр, спеціальність 126).

## Стек технологій

- **Backend/Frontend**: Next.js 16 (JavaScript, App Router)
- **БД**: PostgreSQL 18
- **CSS**: Tailwind CSS v4
- **Авторизація**: NextAuth.js (Credentials, bcrypt, JWT)
- **DB access**: pg (node-postgres), параметризовані SQL-запити

## Встановлення та запуск

### 1. Встановити залежності

```bash
npm install
```

### 2. Налаштувати PostgreSQL

Створити базу даних та виконати SQL-скрипт:

```bash
psql -U postgres -c "CREATE DATABASE freelance_db;"
psql -U postgres -d freelance_db -f sql/init_db.sql
```

### 3. Налаштувати змінні оточення

Скопіювати `.env.example` в `.env.local` та заповнити:

```bash
cp .env.example .env.local
```

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/freelance_db
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Запустити

```bash
npm run dev
```

Відкрити http://localhost:3000

## Тестові акаунти

Пароль для всіх: `password123`

| Логін | Роль |
|-------|------|
| admin | Адміністратор |
| ivan_koval | Замовник |
| olena_shevch | Замовник |
| dev_andriy | Виконавець |
| designer_max | Виконавець |

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
├── sql/                  # SQL-скрипти ініціалізації БД
├── docs/                 # Документація (пояснювальна записка, ER-діаграма)
└── tests/                # E2E тести (Playwright)
```

## База даних

- 10 таблиць, 5 ENUM типів, 1 домен
- 3 представлення (VIEW)
- 5 функцій, 3 тригери
- 4 ролі з RLS (Row Level Security)

ER-діаграма: `docs/er-diagram.png`
