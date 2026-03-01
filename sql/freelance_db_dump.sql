--
-- PostgreSQL database dump
--

\restrict DfFIFmCv6G6dbrDN1OUoPO1r3C2dth3bWV8wc69Zewrp6weRSZ6jMvEwOFi6Jq6

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: complaint_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.complaint_status AS ENUM (
    'In Process',
    'Resolved',
    'Rejected'
);


--
-- Name: deal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deal_status AS ENUM (
    'Pending',
    'In Progress',
    'Completed',
    'Cancelled'
);


--
-- Name: project_specialization; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_specialization AS ENUM (
    'Web Development',
    'Design',
    'Writing',
    'Marketing'
);


--
-- Name: safe_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.safe_status AS ENUM (
    'Frozen',
    'Released',
    'Returned'
);


--
-- Name: user_login; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.user_login AS character varying(20)
	CONSTRAINT user_login_check CHECK (((VALUE)::text ~ '^[a-zA-Z0-9_.]+$'::text));


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'client',
    'contractor',
    'admin'
);


--
-- Name: calculate_avg_hourly_cost(timestamp without time zone, timestamp without time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_avg_hourly_cost(publication_time timestamp without time zone, completion_time timestamp without time zone, p_project_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: check_contractor_unfinished_deals(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_contractor_unfinished_deals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_ranked_contractors(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_ranked_contractors(project_num integer) RETURNS TABLE(contractor_id integer, first_name character varying, last_name character varying, specialization character varying, completed_projects bigint, rank bigint)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_client_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_client_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Client
    SET updated_at = CURRENT_TIMESTAMP
    WHERE client_id = NEW.reviewer_id;
    RETURN NEW;
END;
$$;


--
-- Name: update_contractor_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_contractor_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client (
    client_id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    photo character varying(255),
    city character varying(50),
    rating integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_rating_check CHECK (((rating >= 0) AND (rating <= 25000)))
);


--
-- Name: contractor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contractor (
    contractor_id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    specialization character varying(100),
    resume text,
    portfolio text,
    photo character varying(255),
    city character varying(50),
    rating integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contractor_rating_check CHECK (((rating >= 0) AND (rating <= 100)))
);


--
-- Name: deal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal (
    deal_id integer NOT NULL,
    project_id integer,
    client_id integer,
    contractor_id integer,
    status public.deal_status DEFAULT 'Pending'::public.deal_status NOT NULL,
    amount numeric(10,2),
    creation_date date DEFAULT CURRENT_DATE NOT NULL,
    completion_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deal_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT deal_check CHECK (((completion_date IS NULL) OR (creation_date <= completion_date)))
);


--
-- Name: project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project (
    project_id integer NOT NULL,
    client_id integer NOT NULL,
    specialization public.project_specialization NOT NULL,
    description text NOT NULL,
    budget numeric(10,2) NOT NULL,
    deadline date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT project_budget_check CHECK ((budget >= (500)::numeric))
);


--
-- Name: active_projects; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_projects AS
 SELECT p.project_id,
    p.description,
    p.budget,
    p.deadline,
    p.specialization,
    (((cl.first_name)::text || ' '::text) || (cl.last_name)::text) AS client_name,
    cl.city AS client_city,
    COALESCE((d.status)::text, 'Не призначено'::text) AS deal_status,
        CASE
            WHEN (d.contractor_id IS NOT NULL) THEN ( SELECT (((contractor.first_name)::text || ' '::text) || (contractor.last_name)::text)
               FROM public.contractor
              WHERE (contractor.contractor_id = d.contractor_id))
            ELSE 'Не призначено'::text
        END AS contractor_name
   FROM ((public.project p
     JOIN public.client cl ON ((p.client_id = cl.client_id)))
     LEFT JOIN public.deal d ON ((p.project_id = d.project_id)))
  WHERE ((d.status = ANY (ARRAY['Pending'::public.deal_status, 'In Progress'::public.deal_status])) OR (d.status IS NULL));


--
-- Name: client_client_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_client_id_seq OWNED BY public.client.client_id;


--
-- Name: complaintclient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.complaintclient (
    complaint_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    subject character varying(200),
    details text NOT NULL,
    status public.complaint_status DEFAULT 'In Process'::public.complaint_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone
);


--
-- Name: complaintclient_complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.complaintclient_complaint_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: complaintclient_complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.complaintclient_complaint_id_seq OWNED BY public.complaintclient.complaint_id;


--
-- Name: complaintcontractor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.complaintcontractor (
    complaint_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    subject character varying(200),
    details text NOT NULL,
    status public.complaint_status DEFAULT 'In Process'::public.complaint_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone
);


--
-- Name: complaintcontractor_complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.complaintcontractor_complaint_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: complaintcontractor_complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.complaintcontractor_complaint_id_seq OWNED BY public.complaintcontractor.complaint_id;


--
-- Name: contractor_contractor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contractor_contractor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contractor_contractor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contractor_contractor_id_seq OWNED BY public.contractor.contractor_id;


--
-- Name: contractortask; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contractortask (
    contractortask_id integer NOT NULL,
    contractor_id integer NOT NULL,
    deal_id integer NOT NULL,
    task_type character varying(100),
    input_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    output_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contractortask_contractortask_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contractortask_contractortask_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contractortask_contractortask_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contractortask_contractortask_id_seq OWNED BY public.contractortask.contractortask_id;


--
-- Name: deal_deal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deal_deal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deal_deal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deal_deal_id_seq OWNED BY public.deal.deal_id;


--
-- Name: project_project_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_project_id_seq OWNED BY public.project.project_id;


--
-- Name: project_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.project_statistics AS
 SELECT p.specialization,
    count(p.project_id) AS total_projects,
    round(avg(p.budget), 2) AS avg_budget,
    count(
        CASE
            WHEN (d.status = 'Completed'::public.deal_status) THEN 1
            ELSE NULL::integer
        END) AS completed_count,
    count(
        CASE
            WHEN (d.status = 'In Progress'::public.deal_status) THEN 1
            ELSE NULL::integer
        END) AS in_progress_count,
    count(
        CASE
            WHEN (d.status = 'Pending'::public.deal_status) THEN 1
            ELSE NULL::integer
        END) AS pending_count
   FROM (public.project p
     LEFT JOIN public.deal d ON ((p.project_id = d.project_id)))
  GROUP BY p.specialization;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    ratings_id integer NOT NULL,
    reviewer_id integer NOT NULL,
    reviewed_id integer NOT NULL,
    project_id integer,
    rating integer NOT NULL,
    review_text text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


--
-- Name: ratings_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ratings_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ratings_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ratings_ratings_id_seq OWNED BY public.ratings.ratings_id;


--
-- Name: safe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safe (
    safe_id integer NOT NULL,
    deal_id integer,
    amount numeric(10,2) NOT NULL,
    status public.safe_status DEFAULT 'Frozen'::public.safe_status NOT NULL,
    freeze_date date DEFAULT CURRENT_DATE NOT NULL,
    release_date date,
    return_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT safe_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT safe_check CHECK ((((status = 'Released'::public.safe_status) AND (release_date IS NOT NULL)) OR ((status = 'Returned'::public.safe_status) AND (return_date IS NOT NULL)) OR (status = 'Frozen'::public.safe_status)))
);


--
-- Name: safe_safe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.safe_safe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: safe_safe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.safe_safe_id_seq OWNED BY public.safe.safe_id;


--
-- Name: top_contractors; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.top_contractors AS
 SELECT c.contractor_id,
    (((c.first_name)::text || ' '::text) || (c.last_name)::text) AS full_name,
    c.specialization,
    c.rating,
    c.city,
    count(d.deal_id) AS total_deals,
    count(
        CASE
            WHEN (d.status = 'Completed'::public.deal_status) THEN 1
            ELSE NULL::integer
        END) AS completed_deals,
    round(avg(r.rating), 2) AS avg_review_rating
   FROM ((public.contractor c
     LEFT JOIN public.deal d ON ((c.contractor_id = d.contractor_id)))
     LEFT JOIN public.ratings r ON ((c.contractor_id = r.reviewed_id)))
  GROUP BY c.contractor_id, c.first_name, c.last_name, c.specialization, c.rating, c.city
  ORDER BY c.rating DESC;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    login public.user_login NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.user_role DEFAULT 'client'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: client client_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client ALTER COLUMN client_id SET DEFAULT nextval('public.client_client_id_seq'::regclass);


--
-- Name: complaintclient complaint_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintclient ALTER COLUMN complaint_id SET DEFAULT nextval('public.complaintclient_complaint_id_seq'::regclass);


--
-- Name: complaintcontractor complaint_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintcontractor ALTER COLUMN complaint_id SET DEFAULT nextval('public.complaintcontractor_complaint_id_seq'::regclass);


--
-- Name: contractor contractor_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor ALTER COLUMN contractor_id SET DEFAULT nextval('public.contractor_contractor_id_seq'::regclass);


--
-- Name: contractortask contractortask_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractortask ALTER COLUMN contractortask_id SET DEFAULT nextval('public.contractortask_contractortask_id_seq'::regclass);


--
-- Name: deal deal_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal ALTER COLUMN deal_id SET DEFAULT nextval('public.deal_deal_id_seq'::regclass);


--
-- Name: project project_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project ALTER COLUMN project_id SET DEFAULT nextval('public.project_project_id_seq'::regclass);


--
-- Name: ratings ratings_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings ALTER COLUMN ratings_id SET DEFAULT nextval('public.ratings_ratings_id_seq'::regclass);


--
-- Name: safe safe_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safe ALTER COLUMN safe_id SET DEFAULT nextval('public.safe_safe_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client (client_id, user_id, first_name, last_name, photo, city, rating, created_at, updated_at) FROM stdin;
3	4	Марія	Бондар	maria.jpg	Одеса	2401	2026-02-15 16:26:17.966347	2026-02-15 16:26:17.966347
4	5	Дмитро	Лисенко	dmytro.png	Дніпро	998	2026-02-15 16:26:17.966347	2026-02-15 16:26:17.966347
5	6	Наталія	Мороз	natalia.jpg	Харків	3339	2026-02-15 16:26:17.966347	2026-02-15 16:26:17.966347
6	12	Андрій	Кендюх	\N	Білгород-Дністровський Д	0	2026-02-15 16:28:45.916987	2026-02-15 16:28:45.916987
7	13	Test	Test	\N	Kyiv	0	2026-02-19 22:54:42.038828	2026-02-19 22:54:42.038828
1	2	Іван	Коваль	ivan.jpg	Київ	0	2026-02-15 16:26:17.966347	2026-02-20 10:44:09.599513
2	3	Олена	Шевченко	olena.png	Львів	1145	2026-02-15 16:26:17.966347	2026-02-20 10:44:09.60458
\.


--
-- Data for Name: complaintclient; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.complaintclient (complaint_id, sender_id, receiver_id, subject, details, status, created_at, resolved_at) FROM stdin;
1	1	2	Проблема з оплатою	Виконавець не отримав оплату вчасно, потрібно розібратися	In Process	2026-02-15 16:26:17.982134	\N
2	2	3	Затримка дедлайну	Проект був завершений пізніше ніж було обіцяно	In Process	2026-02-15 16:26:17.982134	\N
3	3	4	Погана комунікація	Важко зв'язатися з виконавцем, не відповідає на повідомлення	In Process	2026-02-15 16:26:17.982134	\N
4	4	5	Невідповідність очікуванням	Результат роботи не відповідає технічному завданню	In Process	2026-02-15 16:26:17.982134	\N
5	5	1	Занижений бюджет	Виконавець вимагає доплату понад узгоджену суму	In Process	2026-02-15 16:26:17.982134	\N
6	1	2	Тестова скарга CRUD	Тест перевірки подання скарги від клієнта	Resolved	2026-02-19 15:54:53.599096	2026-02-19 22:23:41.739424
\.


--
-- Data for Name: complaintcontractor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.complaintcontractor (complaint_id, sender_id, receiver_id, subject, details, status, created_at, resolved_at) FROM stdin;
1	1	1	Нечіткі вимоги	Замовник не надав детальне технічне завдання	In Process	2026-02-15 16:26:17.983465	\N
2	2	2	Затримка оплати	Замовник затримав оплату без попередження	In Process	2026-02-15 16:26:17.983465	\N
3	3	3	Розширення обсягу	Замовник додав додаткову роботу понад домовленість	In Process	2026-02-15 16:26:17.983465	\N
4	4	4	Відсутність зворотного зв'язку	Замовник не відповідає на запитання по проекту	In Process	2026-02-15 16:26:17.983465	\N
5	5	5	Порушення умов угоди	Замовник намагався змінити умови контракту після підписання	Rejected	2026-02-15 16:26:17.983465	2026-02-19 22:22:25.922349
\.


--
-- Data for Name: contractor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contractor (contractor_id, user_id, first_name, last_name, specialization, resume, portfolio, photo, city, rating, created_at, updated_at) FROM stdin;
3	9	Світлана	Петренко	Writing	Копірайтер та блогер, пишу SEO-тексти	portfolio_svitlana.pdf	svitlana.jpg	Львів	65	2026-02-15 16:26:17.968338	2026-02-15 16:26:17.968338
4	10	Тарас	Гриценко	Marketing	Спеціаліст з digital-маркетингу	portfolio_taras.pdf	taras.png	Київ	49	2026-02-15 16:26:17.968338	2026-02-15 16:26:17.968338
5	11	Оксана	Ткаченко	Web Development	Frontend-розробниця з 3 роками досвіду	portfolio_oksana.pdf	oksana.jpg	Дніпро	36	2026-02-15 16:26:17.968338	2026-02-15 16:26:17.968338
1	7	Андрій	Мельник	Web Development	Досвідчений веб-розробник з 4 роками досвіду	portfolio_andriy.pdf	andriy.jpg	Одеса	97	2026-02-15 16:26:17.968338	2026-02-20 10:44:09.599513
2	8	Максим	Коваленко	Design	Графічний дизайнер з 5 роками досвіду	portfolio_maxym.pdf	maxym.png	Харків	90	2026-02-15 16:26:17.968338	2026-02-20 10:44:09.60458
\.


--
-- Data for Name: contractortask; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contractortask (contractortask_id, contractor_id, deal_id, task_type, input_data, output_data, created_at) FROM stdin;
1	1	1	HTML/CSS coding	{"pages": 5}	{"status": "incomplete"}	2026-02-15 16:26:17.975815
2	2	2	Logo Design	{"concepts": 3}	{"selected": 1}	2026-02-15 16:26:17.975815
3	3	3	SEO writing	{"keywords": ["AI", "cloud"]}	{"articles_written": 4}	2026-02-15 16:26:17.975815
4	4	4	SMM strategy	{"channels": ["Instagram", "TikTok"]}	{"campaign_ready": false}	2026-02-15 16:26:17.975815
5	5	5	Frontend dev	{"framework": "React"}	{"components": 12}	2026-02-15 16:26:17.975815
\.


--
-- Data for Name: deal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deal (deal_id, project_id, client_id, contractor_id, status, amount, creation_date, completion_date, created_at, updated_at) FROM stdin;
2	2	2	2	In Progress	1000.00	2025-03-20	\N	2026-02-15 16:26:17.972973	2026-02-15 16:26:17.972973
3	3	3	3	Completed	700.00	2025-02-15	2025-03-05	2026-02-15 16:26:17.972973	2026-02-15 16:26:17.972973
4	4	4	4	In Progress	1500.00	2025-03-25	\N	2026-02-15 16:26:17.972973	2026-02-15 16:26:17.972973
5	5	5	5	Completed	3000.00	2025-01-10	2025-02-28	2026-02-15 16:26:17.972973	2026-02-15 16:26:17.972973
6	2	2	1	Pending	1500.00	2026-02-19	\N	2026-02-19 15:54:56.160847	2026-02-19 15:54:56.160847
1	1	1	1	In Progress	2000.00	2025-04-01	\N	2026-02-15 16:26:17.972973	2026-02-19 16:02:50.687781
\.


--
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project (project_id, client_id, specialization, description, budget, deadline, created_at, updated_at) FROM stdin;
2	2	Design	Розробити логотип та фірмовий стиль для кав'ярні	1000.00	2025-05-15	2026-02-15 16:26:17.970834	2026-02-15 16:26:17.970834
3	3	Writing	Написати SEO-оптимізовані статті для блогу про технології	700.00	2025-04-30	2026-02-15 16:26:17.970834	2026-02-15 16:26:17.970834
4	4	Marketing	Розробити рекламну кампанію в соціальних мережах	1500.00	2025-06-10	2026-02-15 16:26:17.970834	2026-02-15 16:26:17.970834
5	5	Web Development	Розробка інтернет-магазину з інтеграцією онлайн-оплати	3000.00	2025-07-01	2026-02-15 16:26:17.970834	2026-02-15 16:26:17.970834
1	1	Web Development	Створити адаптивний сайт для малого бізнесу з каталогом товарів	2000.00	2025-05-31	2026-02-15 16:26:17.970834	2026-02-19 22:23:28.494047
6	1	Design	Тестовий проект для перевірки CRUD	5000.00	2026-06-30	2026-02-19 15:54:44.07918	2026-02-19 15:54:44.07918
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ratings (ratings_id, reviewer_id, reviewed_id, project_id, rating, review_text, created_at) FROM stdin;
3	1	2	1	8	Непогано, але міг би краще врахувати мої побажання.	2026-02-15 16:26:17.977142
4	2	1	2	10	Виконав завдання на найвищому рівні!	2026-02-15 16:26:17.977142
5	1	1	1	9	Якісний код і хороша комунікація протягом проекту.	2026-02-15 16:26:17.977142
1	1	1	1	10	Відмінний розробник, все зроблено вчасно та якісно!	2026-02-15 16:26:17.977142
2	2	2	2	10	Дизайн вийшов чудовий, саме те що потрібно!	2026-02-15 16:26:17.977142
\.


--
-- Data for Name: safe; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.safe (safe_id, deal_id, amount, status, freeze_date, release_date, return_date, created_at) FROM stdin;
1	1	2000.00	Frozen	2025-04-01	\N	\N	2026-02-15 16:26:17.980653
2	2	1000.00	Frozen	2025-03-20	\N	\N	2026-02-15 16:26:17.980653
3	3	700.00	Released	2025-02-15	2025-03-05	\N	2026-02-15 16:26:17.980653
4	4	1500.00	Frozen	2025-03-25	\N	\N	2026-02-15 16:26:17.980653
5	5	3000.00	Released	2025-01-10	2025-02-28	\N	2026-02-15 16:26:17.980653
6	6	1500.00	Frozen	2026-02-19	\N	\N	2026-02-19 15:54:56.165107
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, login, email, password_hash, role, created_at) FROM stdin;
1	admin	admin@freelance.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	admin	2026-02-15 16:26:17.963308
2	ivan_koval	ivan.koval@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	client	2026-02-15 16:26:17.963308
3	olena_shevch	olena.shevchenko@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	client	2026-02-15 16:26:17.963308
4	maria_bondar	maria.bondar@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	client	2026-02-15 16:26:17.963308
5	dmytro_lysen	dmytro.lysenko@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	client	2026-02-15 16:26:17.963308
6	natalia_moroz	natalia.moroz@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	client	2026-02-15 16:26:17.963308
7	dev_andriy	andriy.melnyk@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	contractor	2026-02-15 16:26:17.963308
8	designer_max	maxym.kovalenko@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	contractor	2026-02-15 16:26:17.963308
9	writer_svit	svitlana.petrenko@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	contractor	2026-02-15 16:26:17.963308
10	marketing_tar	taras.grytsenko@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	contractor	2026-02-15 16:26:17.963308
11	frontend_oks	oksana.tkachenko@example.ua	$2b$10$NdqGMPFxsvCLuMTRAo.JVOFF3MQdHvWQ84zSnWIAQbX5OjUj1Bw6i	contractor	2026-02-15 16:26:17.963308
12	AndrewK__	vamdubila@gmail.com	$2b$10$dC7ZTPLWsAis1XndfNzHJeySXJLfCz3gt2RY2bbkYhzAXqxh6hVgi	client	2026-02-15 16:28:45.91328
13	unique_test_login	ivan@example.com	$2b$10$WqXFHMQ5HXiy2zraAZBePu6l8QARjbzwOCMdMkdAN41b3qZmdCLla	client	2026-02-19 22:54:42.014159
\.


--
-- Name: client_client_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.client_client_id_seq', 7, true);


--
-- Name: complaintclient_complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.complaintclient_complaint_id_seq', 6, true);


--
-- Name: complaintcontractor_complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.complaintcontractor_complaint_id_seq', 5, true);


--
-- Name: contractor_contractor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contractor_contractor_id_seq', 5, true);


--
-- Name: contractortask_contractortask_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contractortask_contractortask_id_seq', 5, true);


--
-- Name: deal_deal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deal_deal_id_seq', 6, true);


--
-- Name: project_project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_project_id_seq', 6, true);


--
-- Name: ratings_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ratings_ratings_id_seq', 5, true);


--
-- Name: safe_safe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.safe_safe_id_seq', 6, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 13, true);


--
-- Name: client client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT client_pkey PRIMARY KEY (client_id);


--
-- Name: client client_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT client_user_id_key UNIQUE (user_id);


--
-- Name: complaintclient complaintclient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintclient
    ADD CONSTRAINT complaintclient_pkey PRIMARY KEY (complaint_id);


--
-- Name: complaintcontractor complaintcontractor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintcontractor
    ADD CONSTRAINT complaintcontractor_pkey PRIMARY KEY (complaint_id);


--
-- Name: contractor contractor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor
    ADD CONSTRAINT contractor_pkey PRIMARY KEY (contractor_id);


--
-- Name: contractor contractor_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor
    ADD CONSTRAINT contractor_user_id_key UNIQUE (user_id);


--
-- Name: contractortask contractortask_contractor_id_deal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractortask
    ADD CONSTRAINT contractortask_contractor_id_deal_id_key UNIQUE (contractor_id, deal_id);


--
-- Name: contractortask contractortask_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractortask
    ADD CONSTRAINT contractortask_pkey PRIMARY KEY (contractortask_id);


--
-- Name: deal deal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal
    ADD CONSTRAINT deal_pkey PRIMARY KEY (deal_id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (project_id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (ratings_id);


--
-- Name: safe safe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safe
    ADD CONSTRAINT safe_pkey PRIMARY KEY (safe_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_complaint_client_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_complaint_client_receiver ON public.complaintclient USING btree (receiver_id);


--
-- Name: idx_complaint_contractor_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_complaint_contractor_receiver ON public.complaintcontractor USING btree (receiver_id);


--
-- Name: idx_contractor_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractor_rating ON public.contractor USING btree (rating DESC);


--
-- Name: idx_contractor_specialization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractor_specialization ON public.contractor USING btree (specialization);


--
-- Name: idx_deal_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_contractor ON public.deal USING btree (contractor_id);


--
-- Name: idx_deal_creation_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_creation_date ON public.deal USING btree (creation_date);


--
-- Name: idx_deal_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_project ON public.deal USING btree (project_id);


--
-- Name: idx_deal_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_status ON public.deal USING btree (status);


--
-- Name: idx_project_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_client ON public.project USING btree (client_id);


--
-- Name: idx_project_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_deadline ON public.project USING btree (deadline);


--
-- Name: idx_project_specialization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_specialization ON public.project USING btree (specialization);


--
-- Name: idx_ratings_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ratings_project ON public.ratings USING btree (project_id);


--
-- Name: idx_ratings_reviewed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ratings_reviewed ON public.ratings USING btree (reviewed_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: ratings trg_update_client_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_client_rating AFTER INSERT OR UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_client_rating();


--
-- Name: ratings trg_update_contractor_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_contractor_rating AFTER INSERT OR UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_contractor_rating();


--
-- Name: client client_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT client_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: complaintclient complaintclient_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintclient
    ADD CONSTRAINT complaintclient_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.contractor(contractor_id) ON DELETE CASCADE;


--
-- Name: complaintclient complaintclient_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintclient
    ADD CONSTRAINT complaintclient_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.client(client_id) ON DELETE CASCADE;


--
-- Name: complaintcontractor complaintcontractor_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintcontractor
    ADD CONSTRAINT complaintcontractor_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.client(client_id) ON DELETE CASCADE;


--
-- Name: complaintcontractor complaintcontractor_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaintcontractor
    ADD CONSTRAINT complaintcontractor_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.contractor(contractor_id) ON DELETE CASCADE;


--
-- Name: contractor contractor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor
    ADD CONSTRAINT contractor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: contractortask contractortask_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractortask
    ADD CONSTRAINT contractortask_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor(contractor_id) ON DELETE CASCADE;


--
-- Name: contractortask contractortask_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractortask
    ADD CONSTRAINT contractortask_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deal(deal_id) ON DELETE CASCADE;


--
-- Name: deal deal_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal
    ADD CONSTRAINT deal_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client(client_id) ON DELETE SET NULL;


--
-- Name: deal deal_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal
    ADD CONSTRAINT deal_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor(contractor_id) ON DELETE SET NULL;


--
-- Name: deal deal_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal
    ADD CONSTRAINT deal_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE SET NULL;


--
-- Name: project project_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client(client_id) ON DELETE CASCADE;


--
-- Name: ratings ratings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE SET NULL;


--
-- Name: ratings ratings_reviewed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reviewed_id_fkey FOREIGN KEY (reviewed_id) REFERENCES public.contractor(contractor_id) ON DELETE CASCADE;


--
-- Name: ratings ratings_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.client(client_id) ON DELETE CASCADE;


--
-- Name: safe safe_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safe
    ADD CONSTRAINT safe_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deal(deal_id) ON DELETE CASCADE;


--
-- Name: deal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal ENABLE ROW LEVEL SECURITY;

--
-- Name: deal deal_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deal_select_own ON public.deal FOR SELECT USING (((client_id IN ( SELECT c.client_id
   FROM (public.client c
     JOIN public.users u ON ((c.user_id = u.user_id)))
  WHERE ((u.login)::text = CURRENT_USER))) OR (contractor_id IN ( SELECT co.contractor_id
   FROM (public.contractor co
     JOIN public.users u ON ((co.user_id = u.user_id)))
  WHERE ((u.login)::text = CURRENT_USER))) OR (CURRENT_USER = 'freelance_admin'::name)));


--
-- Name: project; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

--
-- Name: project project_modify_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY project_modify_own ON public.project USING ((client_id IN ( SELECT c.client_id
   FROM (public.client c
     JOIN public.users u ON ((c.user_id = u.user_id)))
  WHERE ((u.login)::text = CURRENT_USER))));


--
-- Name: project project_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY project_select_all ON public.project FOR SELECT USING (true);


--
-- Name: safe; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.safe ENABLE ROW LEVEL SECURITY;

--
-- Name: safe safe_select_related; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY safe_select_related ON public.safe FOR SELECT USING (((deal_id IN ( SELECT d.deal_id
   FROM public.deal d
  WHERE ((d.client_id IN ( SELECT c.client_id
           FROM (public.client c
             JOIN public.users u ON ((c.user_id = u.user_id)))
          WHERE ((u.login)::text = CURRENT_USER))) OR (d.contractor_id IN ( SELECT co.contractor_id
           FROM (public.contractor co
             JOIN public.users u ON ((co.user_id = u.user_id)))
          WHERE ((u.login)::text = CURRENT_USER)))))) OR (CURRENT_USER = 'freelance_admin'::name)));


--
-- PostgreSQL database dump complete
--

\unrestrict DfFIFmCv6G6dbrDN1OUoPO1r3C2dth3bWV8wc69Zewrp6weRSZ6jMvEwOFi6Jq6

