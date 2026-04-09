-- =====================================================
-- FREELANCE PLATFORM - Повна ініціалізація БД
-- PostgreSQL 18.1
-- =====================================================

-- Видалення існуючих обʼєктів
DROP TRIGGER IF EXISTS trg_update_contractor_rating ON Ratings;
DROP TRIGGER IF EXISTS trg_update_client_rating ON Ratings;
DROP TRIGGER IF EXISTS before_insert_new_deal ON Deal;

DROP FUNCTION IF EXISTS update_contractor_rating();
DROP FUNCTION IF EXISTS update_client_rating();
DROP FUNCTION IF EXISTS check_contractor_unfinished_deals();
DROP FUNCTION IF EXISTS get_ranked_contractors(INT);
DROP FUNCTION IF EXISTS calculate_avg_hourly_cost(TIMESTAMP, TIMESTAMP, INT);

DROP VIEW IF EXISTS top_contractors;
DROP VIEW IF EXISTS active_projects;
DROP VIEW IF EXISTS project_statistics;

DROP TABLE IF EXISTS ComplaintContractor CASCADE;
DROP TABLE IF EXISTS ComplaintClient CASCADE;
DROP TABLE IF EXISTS Ratings CASCADE;
DROP TABLE IF EXISTS Safe CASCADE;
DROP TABLE IF EXISTS ContractorTask CASCADE;
DROP TABLE IF EXISTS Deal CASCADE;
DROP TABLE IF EXISTS Project CASCADE;
DROP TABLE IF EXISTS Contractor CASCADE;
DROP TABLE IF EXISTS Client CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

DROP TYPE IF EXISTS complaint_status CASCADE;
DROP TYPE IF EXISTS deal_status CASCADE;
DROP TYPE IF EXISTS project_specialization CASCADE;
DROP TYPE IF EXISTS safe_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

DROP DOMAIN IF EXISTS user_login CASCADE;

-- =====================================================
-- ДОМЕНИ ТА ТИПИ
-- =====================================================

-- Домен для логіна (тільки латиниця, цифри, . та _)
CREATE DOMAIN user_login AS VARCHAR(20)
CHECK (VALUE ~ '^[a-zA-Z0-9_.]+$');

-- ENUM типи
CREATE TYPE project_specialization AS ENUM (
    'Web Development', 'Design', 'Writing', 'Marketing'
);

CREATE TYPE deal_status AS ENUM (
    'Pending', 'In Progress', 'Completed', 'Cancelled'
);

CREATE TYPE complaint_status AS ENUM (
    'In Process', 'Resolved', 'Rejected'
);

CREATE TYPE safe_status AS ENUM (
    'Frozen', 'Released', 'Returned'
);

CREATE TYPE user_role AS ENUM (
    'client', 'contractor', 'admin'
);

-- =====================================================
-- ТАБЛИЦІ
-- =====================================================

-- Таблиця користувачів (для авторизації)
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    login user_login UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Клієнти (замовники)
CREATE TABLE Client (
    client_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    photo VARCHAR(255),
    city VARCHAR(50),
    rating INTEGER DEFAULT 0 CHECK (rating BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Виконавці (фрілансери)
CREATE TABLE Contractor (
    contractor_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    resume TEXT,
    portfolio TEXT,
    photo VARCHAR(255),
    city VARCHAR(50),
    rating INTEGER DEFAULT 0 CHECK (rating BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проекти
CREATE TABLE Project (
    project_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES Client(client_id) ON DELETE CASCADE,
    specialization project_specialization NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL CHECK (budget >= 500),
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Угоди
CREATE TABLE Deal (
    deal_id SERIAL PRIMARY KEY,
    project_id INT REFERENCES Project(project_id) ON DELETE SET NULL,
    client_id INT REFERENCES Client(client_id) ON DELETE SET NULL,
    contractor_id INT REFERENCES Contractor(contractor_id) ON DELETE SET NULL,
    status deal_status NOT NULL DEFAULT 'Pending',
    amount DECIMAL(10,2) CHECK (amount > 0),
    creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    CHECK (completion_date IS NULL OR creation_date <= completion_date),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Завдання виконавців
CREATE TABLE ContractorTask (
    contractortask_id SERIAL PRIMARY KEY,
    contractor_id INT NOT NULL REFERENCES Contractor(contractor_id) ON DELETE CASCADE,
    deal_id INT NOT NULL REFERENCES Deal(deal_id) ON DELETE CASCADE,
    task_type VARCHAR(100),
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contractor_id, deal_id)
);

-- Ескроу (безпечні платежі)
CREATE TABLE Safe (
    safe_id SERIAL PRIMARY KEY,
    deal_id INT REFERENCES Deal(deal_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status safe_status NOT NULL DEFAULT 'Frozen',
    freeze_date DATE NOT NULL DEFAULT CURRENT_DATE,
    release_date DATE,
    return_date DATE,
    CHECK (
        (status = 'Released' AND release_date IS NOT NULL) OR
        (status = 'Returned' AND return_date IS NOT NULL) OR
        (status = 'Frozen')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Рейтинги
CREATE TABLE Ratings (
    ratings_id SERIAL PRIMARY KEY,
    reviewer_id INT NOT NULL REFERENCES Client(client_id) ON DELETE CASCADE,
    reviewed_id INT NOT NULL REFERENCES Contractor(contractor_id) ON DELETE CASCADE,
    project_id INT REFERENCES Project(project_id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Скарги від клієнтів
CREATE TABLE ComplaintClient (
    complaint_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES Client(client_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES Contractor(contractor_id) ON DELETE CASCADE,
    subject VARCHAR(200),
    details TEXT NOT NULL,
    status complaint_status DEFAULT 'In Process',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Скарги від виконавців
CREATE TABLE ComplaintContractor (
    complaint_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES Contractor(contractor_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES Client(client_id) ON DELETE CASCADE,
    subject VARCHAR(200),
    details TEXT NOT NULL,
    status complaint_status DEFAULT 'In Process',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- =====================================================
-- ІНДЕКСИ
-- =====================================================

CREATE INDEX idx_project_specialization ON Project(specialization);
CREATE INDEX idx_project_deadline ON Project(deadline);
CREATE INDEX idx_project_client ON Project(client_id);

CREATE INDEX idx_deal_status ON Deal(status);
CREATE INDEX idx_deal_contractor ON Deal(contractor_id);
CREATE INDEX idx_deal_project ON Deal(project_id);
CREATE INDEX idx_deal_creation_date ON Deal(creation_date);

CREATE INDEX idx_contractor_specialization ON Contractor(specialization);
CREATE INDEX idx_contractor_rating ON Contractor(rating DESC);

CREATE INDEX idx_ratings_reviewed ON Ratings(reviewed_id);
CREATE INDEX idx_ratings_project ON Ratings(project_id);

CREATE INDEX idx_complaint_client_receiver ON ComplaintClient(receiver_id);
CREATE INDEX idx_complaint_contractor_receiver ON ComplaintContractor(receiver_id);

CREATE INDEX idx_users_role ON Users(role);
CREATE INDEX idx_users_email ON Users(email);

-- =====================================================
-- VIEW (Представлення)
-- =====================================================

-- Топ виконавці
CREATE VIEW top_contractors AS
SELECT
    c.contractor_id,
    c.first_name || ' ' || c.last_name AS full_name,
    c.specialization,
    c.rating,
    c.city,
    COUNT(d.deal_id) AS total_deals,
    COUNT(CASE WHEN d.status = 'Completed' THEN 1 END) AS completed_deals,
    ROUND(AVG(r.rating), 2) AS avg_review_rating
FROM Contractor c
LEFT JOIN Deal d ON c.contractor_id = d.contractor_id
LEFT JOIN Ratings r ON c.contractor_id = r.reviewed_id
GROUP BY c.contractor_id, c.first_name, c.last_name, c.specialization, c.rating, c.city
ORDER BY c.rating DESC;

-- Активні проекти
CREATE VIEW active_projects AS
SELECT
    p.project_id,
    p.description,
    p.budget,
    p.deadline,
    p.specialization,
    cl.first_name || ' ' || cl.last_name AS client_name,
    cl.city AS client_city,
    COALESCE(d.status::text, 'Не призначено') AS deal_status,
    CASE
        WHEN d.contractor_id IS NOT NULL THEN
            (SELECT first_name || ' ' || last_name FROM Contractor WHERE contractor_id = d.contractor_id)
        ELSE 'Не призначено'
    END AS contractor_name
FROM Project p
JOIN Client cl ON p.client_id = cl.client_id
LEFT JOIN Deal d ON p.project_id = d.project_id
WHERE d.status IN ('Pending', 'In Progress') OR d.status IS NULL;

-- Статистика по проектах
CREATE VIEW project_statistics AS
SELECT
    p.specialization,
    COUNT(p.project_id) AS total_projects,
    ROUND(AVG(p.budget), 2) AS avg_budget,
    COUNT(CASE WHEN d.status = 'Completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN d.status = 'In Progress' THEN 1 END) AS in_progress_count,
    COUNT(CASE WHEN d.status = 'Pending' THEN 1 END) AS pending_count
FROM Project p
LEFT JOIN Deal d ON p.project_id = d.project_id
GROUP BY p.specialization;

-- =====================================================
-- ФУНКЦІЇ
-- =====================================================

-- Оновлення рейтингу виконавця (автоматично після відгуку)
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Contractor
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating) * 10), 0)
        FROM Ratings
        WHERE reviewed_id = NEW.reviewed_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE contractor_id = NEW.reviewed_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Оновлення часу зміни для клієнта
CREATE OR REPLACE FUNCTION update_client_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Client
    SET updated_at = CURRENT_TIMESTAMP
    WHERE client_id = NEW.reviewer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Перевірка незавершених контрактів фрілансера
CREATE OR REPLACE FUNCTION check_contractor_unfinished_deals()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM Deal
        WHERE contractor_id = NEW.contractor_id
          AND status IN ('Pending', 'In Progress')
          AND deal_id != COALESCE(NEW.deal_id, -1)
    ) THEN
        RAISE EXCEPTION 'Фрілансер (ID: %) має незавершені контракти. Укладення нового контракту неможливе.', NEW.contractor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Підбір та ранжування фрілансерів за проектом
CREATE OR REPLACE FUNCTION get_ranked_contractors(project_num INT)
RETURNS TABLE(
    contractor_id INT,
    first_name VARCHAR,
    last_name VARCHAR,
    specialization VARCHAR,
    completed_projects BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.contractor_id,
        c.first_name,
        c.last_name,
        c.specialization,
        COUNT(d.deal_id) AS completed_projects,
        RANK() OVER (ORDER BY COUNT(d.deal_id) DESC) AS rank
    FROM Contractor c
    LEFT JOIN Deal d ON c.contractor_id = d.contractor_id AND d.status = 'Completed'
    WHERE c.specialization::text = (
        SELECT pr.specialization::text FROM Project pr WHERE pr.project_id = project_num
    )
    GROUP BY c.contractor_id, c.first_name, c.last_name, c.specialization
    ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- Розрахунок середньої вартості години роботи
CREATE OR REPLACE FUNCTION calculate_avg_hourly_cost(
    publication_time TIMESTAMP,
    completion_time TIMESTAMP,
    p_project_id INT
)
RETURNS NUMERIC(10,2) AS $$
DECLARE
    total_hours NUMERIC;
    project_amount NUMERIC;
    avg_hourly_cost NUMERIC(10,2);
BEGIN
    total_hours := EXTRACT(EPOCH FROM (completion_time - publication_time)) / 3600;
    IF total_hours <= 0 THEN
        RAISE EXCEPTION 'Час завершення повинен бути після часу публікації.';
    END IF;

    SELECT amount INTO project_amount
    FROM Deal WHERE Deal.project_id = p_project_id;

    IF project_amount IS NULL THEN
        RAISE EXCEPTION 'Не знайдено контракт з ID проекту: %', p_project_id;
    END IF;

    avg_hourly_cost := project_amount / total_hours;
    RETURN ROUND(avg_hourly_cost, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ТРИГЕРИ
-- =====================================================

-- Автооновлення рейтингу виконавця після нового відгуку
CREATE TRIGGER trg_update_contractor_rating
AFTER INSERT OR UPDATE ON Ratings
FOR EACH ROW
EXECUTE FUNCTION update_contractor_rating();

-- Оновлення часу зміни клієнта
CREATE TRIGGER trg_update_client_rating
AFTER INSERT OR UPDATE ON Ratings
FOR EACH ROW
EXECUTE FUNCTION update_client_rating();

-- Перевірка незавершених контрактів (закоментовано для демо)
-- CREATE TRIGGER before_insert_new_deal
-- BEFORE INSERT ON Deal
-- FOR EACH ROW
-- EXECUTE FUNCTION check_contractor_unfinished_deals();

-- =====================================================
-- РОЛІ ТА ПРИВІЛЕЇ
-- =====================================================

-- Видалення старих ролей (якщо є)
DO $$
BEGIN
    -- Відкликання привілеїв перед видаленням
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'freelance_admin') THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM freelance_admin;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM freelance_admin;
        DROP ROLE freelance_admin;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'freelance_client') THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM freelance_client;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM freelance_client;
        DROP ROLE freelance_client;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'freelance_contractor') THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM freelance_contractor;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM freelance_contractor;
        DROP ROLE freelance_contractor;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'freelance_guest') THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM freelance_guest;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM freelance_guest;
        DROP ROLE freelance_guest;
    END IF;
END $$;

-- Створення ролей
CREATE ROLE freelance_admin WITH LOGIN PASSWORD 'admin_pass123';
CREATE ROLE freelance_client WITH LOGIN PASSWORD 'client_pass123';
CREATE ROLE freelance_contractor WITH LOGIN PASSWORD 'contractor_pass123';
CREATE ROLE freelance_guest WITH LOGIN PASSWORD 'guest_pass123';

-- Привілеї для схеми
GRANT USAGE ON SCHEMA public TO freelance_admin, freelance_client, freelance_contractor, freelance_guest;

-- ADMIN — повний доступ
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO freelance_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO freelance_admin;

-- CLIENT — CRUD свої проекти, угоди, рейтинги, скарги
GRANT SELECT (user_id, login, email, role, created_at) ON Users TO freelance_client;
GRANT SELECT, INSERT, UPDATE ON Client TO freelance_client;
GRANT SELECT, INSERT, UPDATE, DELETE ON Project TO freelance_client;
GRANT SELECT, INSERT, UPDATE ON Deal TO freelance_client;
GRANT SELECT ON Contractor TO freelance_client;
GRANT SELECT ON ContractorTask TO freelance_client;
GRANT SELECT, INSERT ON Ratings TO freelance_client;
GRANT SELECT, INSERT ON ComplaintClient TO freelance_client;
GRANT SELECT ON ComplaintContractor TO freelance_client;
GRANT SELECT, INSERT, UPDATE ON Safe TO freelance_client;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO freelance_client;

-- CONTRACTOR — перегляд проектів, робота з завданнями
GRANT SELECT (user_id, login, email, role, created_at) ON Users TO freelance_contractor;
GRANT SELECT ON Client TO freelance_contractor;
GRANT SELECT, UPDATE ON Contractor TO freelance_contractor;
GRANT SELECT ON Project TO freelance_contractor;
GRANT SELECT, UPDATE ON Deal TO freelance_contractor;
GRANT SELECT, INSERT, UPDATE ON ContractorTask TO freelance_contractor;
GRANT SELECT ON Ratings TO freelance_contractor;
GRANT SELECT ON ComplaintClient TO freelance_contractor;
GRANT SELECT, INSERT ON ComplaintContractor TO freelance_contractor;
GRANT SELECT, UPDATE ON Safe TO freelance_contractor;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO freelance_contractor;

-- GUEST — тільки перегляд публічних даних
GRANT SELECT ON Project TO freelance_guest;
GRANT SELECT ON Contractor TO freelance_guest;
GRANT SELECT ON Ratings TO freelance_guest;
GRANT SELECT (client_id, first_name, last_name, city) ON Client TO freelance_guest;
GRANT SELECT ON top_contractors TO freelance_guest;
GRANT SELECT ON active_projects TO freelance_guest;
GRANT SELECT ON project_statistics TO freelance_guest;

-- Привілеї на VIEW
GRANT SELECT ON top_contractors TO freelance_client, freelance_contractor;
GRANT SELECT ON active_projects TO freelance_client, freelance_contractor;
GRANT SELECT ON project_statistics TO freelance_admin;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- RLS для таблиці Project
ALTER TABLE Project ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_select_all ON Project
    FOR SELECT USING (true);

CREATE POLICY project_modify_own ON Project
    FOR ALL USING (
        client_id IN (
            SELECT c.client_id FROM Client c
            JOIN Users u ON c.user_id = u.user_id
            WHERE u.login = current_setting('app.current_login', true)
        )
    );

-- RLS для таблиці Deal
ALTER TABLE Deal ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_select_own ON Deal
    FOR SELECT USING (
        client_id IN (SELECT c.client_id FROM Client c JOIN Users u ON c.user_id = u.user_id WHERE u.login = current_setting('app.current_login', true))
        OR contractor_id IN (SELECT co.contractor_id FROM Contractor co JOIN Users u ON co.user_id = u.user_id WHERE u.login = current_setting('app.current_login', true))
        OR current_user = 'freelance_admin'
    );

-- RLS для Safe
ALTER TABLE Safe ENABLE ROW LEVEL SECURITY;

CREATE POLICY safe_select_related ON Safe
    FOR SELECT USING (
        deal_id IN (
            SELECT d.deal_id FROM Deal d
            WHERE d.client_id IN (SELECT c.client_id FROM Client c JOIN Users u ON c.user_id = u.user_id WHERE u.login = current_setting('app.current_login', true))
            OR d.contractor_id IN (SELECT co.contractor_id FROM Contractor co JOIN Users u ON co.user_id = u.user_id WHERE u.login = current_setting('app.current_login', true))
        )
        OR current_user = 'freelance_admin'
    );

-- =====================================================
-- ТЕСТОВІ ДАНІ
-- =====================================================

-- Тестові користувачі (пароль для всіх: password123)
INSERT INTO Users (login, email, password_hash, role) VALUES
('admin', 'admin@freelance.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'admin'),
('ivan_koval', 'ivan.koval@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'client'),
('olena_shevch', 'olena.shevchenko@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'client'),
('maria_bondar', 'maria.bondar@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'client'),
('dmytro_lysen', 'dmytro.lysenko@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'client'),
('natalia_moroz', 'natalia.moroz@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'client'),
('dev_andriy', 'andriy.melnyk@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'contractor'),
('designer_max', 'maxym.kovalenko@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'contractor'),
('writer_svit', 'svitlana.petrenko@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'contractor'),
('marketing_tar', 'taras.grytsenko@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'contractor'),
('frontend_oks', 'oksana.tkachenko@example.ua', '$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i', 'contractor');

-- Клієнти
INSERT INTO Client (user_id, first_name, last_name, photo, city, rating) VALUES
(2, 'Іван', 'Коваль', 'ivan.jpg', 'Київ', 0),
(3, 'Олена', 'Шевченко', 'olena.png', 'Львів', 72),
(4, 'Марія', 'Бондар', 'maria.jpg', 'Одеса', 85),
(5, 'Дмитро', 'Лисенко', 'dmytro.png', 'Дніпро', 58),
(6, 'Наталія', 'Мороз', 'natalia.jpg', 'Харків', 91);

-- Виконавці
INSERT INTO Contractor (user_id, first_name, last_name, specialization, resume, portfolio, photo, city, rating) VALUES
(7, 'Андрій', 'Мельник', 'Web Development', 'Досвідчений веб-розробник з 4 роками досвіду', 'portfolio_andriy.pdf', 'andriy.jpg', 'Одеса', 0),
(8, 'Максим', 'Коваленко', 'Design', 'Графічний дизайнер з 5 роками досвіду', 'portfolio_maxym.pdf', 'maxym.png', 'Харків', 65),
(9, 'Світлана', 'Петренко', 'Writing', 'Копірайтер та блогер, пишу SEO-тексти', 'portfolio_svitlana.pdf', 'svitlana.jpg', 'Львів', 49),
(10, 'Тарас', 'Гриценко', 'Marketing', 'Спеціаліст з digital-маркетингу', 'portfolio_taras.pdf', 'taras.png', 'Київ', 36),
(11, 'Оксана', 'Ткаченко', 'Web Development', 'Frontend-розробниця з 3 роками досвіду', 'portfolio_oksana.pdf', 'oksana.jpg', 'Дніпро', 42);

-- Проекти
INSERT INTO Project (client_id, specialization, description, budget, deadline) VALUES
(1, 'Web Development', 'Створити адаптивний сайт для малого бізнесу з каталогом товарів', 2000, '2025-06-01'),
(2, 'Design', 'Розробити логотип та фірмовий стиль для кав''ярні', 1000, '2025-05-15'),
(3, 'Writing', 'Написати SEO-оптимізовані статті для блогу про технології', 700, '2025-04-30'),
(4, 'Marketing', 'Розробити рекламну кампанію в соціальних мережах', 1500, '2025-06-10'),
(5, 'Web Development', 'Розробка інтернет-магазину з інтеграцією онлайн-оплати', 3000, '2025-07-01');

-- Угоди
INSERT INTO Deal (project_id, client_id, contractor_id, status, amount, creation_date, completion_date) VALUES
(1, 1, 1, 'Pending', 2000, '2025-04-01', NULL),
(2, 2, 2, 'In Progress', 1000, '2025-03-20', NULL),
(3, 3, 3, 'Completed', 700, '2025-02-15', '2025-03-05'),
(4, 4, 4, 'In Progress', 1500, '2025-03-25', NULL),
(5, 5, 5, 'Completed', 3000, '2025-01-10', '2025-02-28');

-- Завдання
INSERT INTO ContractorTask (contractor_id, deal_id, task_type, input_data, output_data) VALUES
(1, 1, 'HTML/CSS coding', '{"pages": 5}', '{"status": "incomplete"}'),
(2, 2, 'Logo Design', '{"concepts": 3}', '{"selected": 1}'),
(3, 3, 'SEO writing', '{"keywords": ["AI", "cloud"]}', '{"articles_written": 4}'),
(4, 4, 'SMM strategy', '{"channels": ["Instagram", "TikTok"]}', '{"campaign_ready": false}'),
(5, 5, 'Frontend dev', '{"framework": "React"}', '{"components": 12}');

-- Рейтинги
INSERT INTO Ratings (reviewer_id, reviewed_id, project_id, rating, review_text) VALUES
(1, 1, 1, 10, 'Відмінний розробник, все зроблено вчасно та якісно!'),
(2, 2, 2, 10, 'Дизайн вийшов чудовий, саме те що потрібно!'),
(1, 2, 1, 8, 'Непогано, але міг би краще врахувати мої побажання.'),
(2, 1, 2, 10, 'Виконав завдання на найвищому рівні!'),
(1, 1, 1, 9, 'Якісний код і хороша комунікація протягом проекту.');

-- Ескроу
INSERT INTO Safe (deal_id, amount, status, freeze_date, release_date, return_date) VALUES
(1, 2000, 'Frozen', '2025-04-01', NULL, NULL),
(2, 1000, 'Frozen', '2025-03-20', NULL, NULL),
(3, 700, 'Released', '2025-02-15', '2025-03-05', NULL),
(4, 1500, 'Frozen', '2025-03-25', NULL, NULL),
(5, 3000, 'Released', '2025-01-10', '2025-02-28', NULL);

-- Скарги від клієнтів
INSERT INTO ComplaintClient (sender_id, receiver_id, subject, details) VALUES
(1, 2, 'Проблема з оплатою', 'Виконавець не отримав оплату вчасно, потрібно розібратися'),
(2, 3, 'Затримка дедлайну', 'Проект був завершений пізніше ніж було обіцяно'),
(3, 4, 'Погана комунікація', 'Важко зв''язатися з виконавцем, не відповідає на повідомлення'),
(4, 5, 'Невідповідність очікуванням', 'Результат роботи не відповідає технічному завданню'),
(5, 1, 'Занижений бюджет', 'Виконавець вимагає доплату понад узгоджену суму');

-- Скарги від виконавців
INSERT INTO ComplaintContractor (sender_id, receiver_id, subject, details) VALUES
(1, 1, 'Нечіткі вимоги', 'Замовник не надав детальне технічне завдання'),
(2, 2, 'Затримка оплати', 'Замовник затримав оплату без попередження'),
(3, 3, 'Розширення обсягу', 'Замовник додав додаткову роботу понад домовленість'),
(4, 4, 'Відсутність зворотного зв''язку', 'Замовник не відповідає на запитання по проекту'),
(5, 5, 'Порушення умов угоди', 'Замовник намагався змінити умови контракту після підписання');

-- =====================================================
-- ПЕРЕВІРКА
-- =====================================================
SELECT 'Database initialized successfully!' AS message;
SELECT 'Users: ' || COUNT(*) FROM Users;
SELECT 'Clients: ' || COUNT(*) FROM Client;
SELECT 'Contractors: ' || COUNT(*) FROM Contractor;
SELECT 'Projects: ' || COUNT(*) FROM Project;
SELECT 'Deals: ' || COUNT(*) FROM Deal;
