-- =====================================
-- Script: Data Warehouse GlobalSales Inc. (versión revisada)
-- Oracle SQL
-- =====================================

-- =========================================================
-- 0. Limpieza opcional
-- =========================================================
BEGIN EXECUTE IMMEDIATE 'DROP TABLE FACT_SALES PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE DIM_TIME PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE DIM_PRODUCT PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE DIM_CUSTOMER PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE DIM_STORE PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- =========================================================
-- 1. Tablas dimensión
-- =========================================================
CREATE TABLE DIM_PRODUCT (
    PRODUCT_ID      NUMBER PRIMARY KEY,
    PRODUCT_NAME    VARCHAR2(100) NOT NULL,
    CATEGORY        VARCHAR2(50)  NOT NULL,
    BRAND           VARCHAR2(50)  NOT NULL
);

CREATE TABLE DIM_CUSTOMER (
    CUSTOMER_ID      NUMBER PRIMARY KEY,
    CUSTOMER_NAME    VARCHAR2(100) NOT NULL,
    CITY             VARCHAR2(50)  NOT NULL,
    COUNTRY          VARCHAR2(50)  NOT NULL
);

CREATE TABLE DIM_STORE (
    STORE_ID         NUMBER PRIMARY KEY,
    STORE_NAME       VARCHAR2(100) NOT NULL,
    CITY             VARCHAR2(50)  NOT NULL,
    COUNTRY          VARCHAR2(50)  NOT NULL
);

CREATE TABLE DIM_TIME (
    TIME_ID              NUMBER PRIMARY KEY,
    FULL_DATE            DATE         NOT NULL,
    DAY_NUMBER           NUMBER       NOT NULL,
    DAY_NAME             VARCHAR2(15) NOT NULL,
    WEEK_OF_YEAR         NUMBER       NOT NULL,
    MONTH_NUMBER         NUMBER       NOT NULL,
    MONTH_NAME           VARCHAR2(15) NOT NULL,
    QUARTER_NUMBER       NUMBER       NOT NULL,
    YEAR_NUMBER          NUMBER       NOT NULL,
    YEAR_MONTH           VARCHAR2(7)  NOT NULL,
    IS_WEEKEND           CHAR(1)      CHECK (IS_WEEKEND IN ('Y','N'))
);

ALTER TABLE DIM_TIME ADD CONSTRAINT UK_DIM_TIME_FULL_DATE UNIQUE (FULL_DATE);

-- =========================================================
-- 2. Tabla de hechos
--    Granularidad: una fila = una venta
-- =========================================================
CREATE TABLE FACT_SALES (
    SALE_ID          NUMBER PRIMARY KEY,
    TIME_ID          NUMBER NOT NULL,
    PRODUCT_ID       NUMBER NOT NULL,
    CUSTOMER_ID      NUMBER NOT NULL,
    STORE_ID         NUMBER NOT NULL,
    QUANTITY         NUMBER NOT NULL CHECK (QUANTITY > 0),
    UNIT_PRICE       NUMBER(10,2) NOT NULL CHECK (UNIT_PRICE > 0),
    TOTAL_AMOUNT     NUMBER(12,2) NOT NULL CHECK (TOTAL_AMOUNT > 0),

    CONSTRAINT FK_FACT_TIME
        FOREIGN KEY (TIME_ID) REFERENCES DIM_TIME(TIME_ID),
    CONSTRAINT FK_FACT_PRODUCT
        FOREIGN KEY (PRODUCT_ID) REFERENCES DIM_PRODUCT(PRODUCT_ID),
    CONSTRAINT FK_FACT_CUSTOMER
        FOREIGN KEY (CUSTOMER_ID) REFERENCES DIM_CUSTOMER(CUSTOMER_ID),
    CONSTRAINT FK_FACT_STORE
        FOREIGN KEY (STORE_ID) REFERENCES DIM_STORE(STORE_ID)
);

-- =========================================================
-- 3. Índices útiles para la práctica
-- =========================================================
CREATE INDEX IDX_FACT_SALES_TIME      ON FACT_SALES (TIME_ID);
CREATE INDEX IDX_FACT_SALES_CUSTOMER  ON FACT_SALES (CUSTOMER_ID);
CREATE INDEX IDX_FACT_SALES_PRODUCT   ON FACT_SALES (PRODUCT_ID);
CREATE INDEX IDX_FACT_SALES_STORE     ON FACT_SALES (STORE_ID);
CREATE INDEX IDX_DIM_CUSTOMER_COUNTRY ON DIM_CUSTOMER (COUNTRY);
CREATE INDEX IDX_DIM_STORE_COUNTRY    ON DIM_STORE (COUNTRY);
CREATE INDEX IDX_DIM_TIME_YEAR_MONTH  ON DIM_TIME (YEAR_MONTH);
CREATE INDEX IDX_DIM_TIME_FULL_DATE   ON DIM_TIME (FULL_DATE);

-- =========================================================
-- 4. Datos de dimensiones
-- =========================================================
INSERT INTO DIM_PRODUCT VALUES (1 , 'Laptop X1'        , 'Electronics', 'BrandA');
INSERT INTO DIM_PRODUCT VALUES (2 , 'Laptop X2'        , 'Electronics', 'BrandA');
INSERT INTO DIM_PRODUCT VALUES (3 , 'Smartphone S1'    , 'Electronics', 'BrandB');
INSERT INTO DIM_PRODUCT VALUES (4 , 'Printer P1'       , 'Peripherals', 'BrandC');
INSERT INTO DIM_PRODUCT VALUES (5 , 'Monitor M1'       , 'Peripherals', 'BrandD');
INSERT INTO DIM_PRODUCT VALUES (6 , 'Keyboard K1'      , 'Peripherals', 'BrandD');
INSERT INTO DIM_PRODUCT VALUES (7 , 'Mouse M1'         , 'Peripherals', 'BrandE');
INSERT INTO DIM_PRODUCT VALUES (8 , 'Tablet T1'        , 'Electronics', 'BrandB');
INSERT INTO DIM_PRODUCT VALUES (9 , 'Headset H1'       , 'Accessories', 'BrandF');
INSERT INTO DIM_PRODUCT VALUES (10, 'USB Drive U1'     , 'Accessories', 'BrandG');
INSERT INTO DIM_PRODUCT VALUES (11, 'Smartwatch W1'    , 'Electronics', 'BrandH');
INSERT INTO DIM_PRODUCT VALUES (12, 'Webcam C1'        , 'Accessories', 'BrandI');

INSERT INTO DIM_CUSTOMER VALUES (1 , 'Alice Johnson' , 'Madrid'    , 'Spain');
INSERT INTO DIM_CUSTOMER VALUES (2 , 'Bob Smith'     , 'Barcelona' , 'Spain');
INSERT INTO DIM_CUSTOMER VALUES (3 , 'Charlie Brown' , 'Valencia'  , 'Spain');
INSERT INTO DIM_CUSTOMER VALUES (4 , 'Diana Prince'  , 'Lisbon'    , 'Portugal');
INSERT INTO DIM_CUSTOMER VALUES (5 , 'Evan Lee'      , 'Paris'     , 'France');
INSERT INTO DIM_CUSTOMER VALUES (6 , 'Fiona Chen'    , 'Marseille' , 'France');
INSERT INTO DIM_CUSTOMER VALUES (7 , 'George Martin' , 'Amsterdam' , 'Netherlands');
INSERT INTO DIM_CUSTOMER VALUES (8 , 'Hannah Scott'  , 'Rotterdam' , 'Netherlands');
INSERT INTO DIM_CUSTOMER VALUES (9 , 'Ian Clark'     , 'Berlin'    , 'Germany');
INSERT INTO DIM_CUSTOMER VALUES (10, 'Julia Adams'   , 'Munich'    , 'Germany');
INSERT INTO DIM_CUSTOMER VALUES (11, 'Kevin Wright'  , 'Seville'   , 'Spain');
INSERT INTO DIM_CUSTOMER VALUES (12, 'Laura Green'   , 'Bilbao'    , 'Spain');
INSERT INTO DIM_CUSTOMER VALUES (13, 'Mateo Ruiz'    , 'Madrid'    , 'Spain');
INSERT INTO DIM_CUSTOMER VALUES (14, 'Nora Silva'    , 'Porto'     , 'Portugal');
INSERT INTO DIM_CUSTOMER VALUES (15, 'Oscar Petit'   , 'Lyon'      , 'France');

INSERT INTO DIM_STORE VALUES (1 , 'Store Madrid Central' , 'Madrid'    , 'Spain');
INSERT INTO DIM_STORE VALUES (2 , 'Store Barcelona'      , 'Barcelona' , 'Spain');
INSERT INTO DIM_STORE VALUES (3 , 'Store Valencia'       , 'Valencia'  , 'Spain');
INSERT INTO DIM_STORE VALUES (4 , 'Store Seville'        , 'Seville'   , 'Spain');
INSERT INTO DIM_STORE VALUES (5 , 'Store Bilbao'         , 'Bilbao'    , 'Spain');
INSERT INTO DIM_STORE VALUES (6 , 'Store Lisbon'         , 'Lisbon'    , 'Portugal');
INSERT INTO DIM_STORE VALUES (7 , 'Store Paris'          , 'Paris'     , 'France');
INSERT INTO DIM_STORE VALUES (8 , 'Store Marseille'      , 'Marseille' , 'France');
INSERT INTO DIM_STORE VALUES (9 , 'Store Amsterdam'      , 'Amsterdam' , 'Netherlands');
INSERT INTO DIM_STORE VALUES (10, 'Store Berlin'         , 'Berlin'    , 'Germany');

-- =========================================================
-- 5. Carga de la dimensión de tiempo
--    Rango fijo para que marzo de 2025 exista siempre
-- =========================================================
DECLARE
    v_start_date DATE := DATE '2024-01-01';
    v_end_date   DATE := DATE '2025-12-31';
    v_date       DATE;
    v_time_id    NUMBER := 1;
BEGIN
    v_date := v_start_date;

    WHILE v_date <= v_end_date LOOP
        INSERT INTO DIM_TIME (
            TIME_ID,
            FULL_DATE,
            DAY_NUMBER,
            DAY_NAME,
            WEEK_OF_YEAR,
            MONTH_NUMBER,
            MONTH_NAME,
            QUARTER_NUMBER,
            YEAR_NUMBER,
            YEAR_MONTH,
            IS_WEEKEND
        )
        VALUES (
            v_time_id,
            v_date,
            TO_NUMBER(TO_CHAR(v_date, 'DD')),
            TRIM(TO_CHAR(v_date, 'DAY', 'NLS_DATE_LANGUAGE=ENGLISH')),
            TO_NUMBER(TO_CHAR(v_date, 'IW')),
            TO_NUMBER(TO_CHAR(v_date, 'MM')),
            TRIM(TO_CHAR(v_date, 'MONTH', 'NLS_DATE_LANGUAGE=ENGLISH')),
            TO_NUMBER(TO_CHAR(v_date, 'Q')),
            TO_NUMBER(TO_CHAR(v_date, 'YYYY')),
            TO_CHAR(v_date, 'YYYY-MM'),
            CASE
                WHEN TO_CHAR(v_date, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH') IN ('SAT','SUN') THEN 'Y'
                ELSE 'N'
            END
        );

        v_time_id := v_time_id + 1;
        v_date := v_date + 1;
    END LOOP;

    COMMIT;
END;
/

-- =========================================================
-- 6. Carga de hechos
--    Se generan 20000 ventas con combinaciones menos artificiales
-- =========================================================
DECLARE
    v_time_id      NUMBER;
    v_product_id   NUMBER;
    v_customer_id  NUMBER;
    v_store_id     NUMBER;
    v_quantity     NUMBER;
    v_unit_price   NUMBER(10,2);
BEGIN
    DBMS_RANDOM.SEED(202503);

    FOR i IN 1..20000 LOOP
        -- Rango de fechas fijo: 2024-01-01 a 2025-12-31
        v_time_id := TRUNC(DBMS_RANDOM.VALUE(1, 732));

        -- Combinaciones independientes
        v_product_id  := TRUNC(DBMS_RANDOM.VALUE(1, 13));
        v_customer_id := TRUNC(DBMS_RANDOM.VALUE(1, 16));
        v_store_id    := TRUNC(DBMS_RANDOM.VALUE(1, 11));

        -- Sesgo intencional: más ventas para clientes de España
        IF DBMS_RANDOM.VALUE(0, 1) < 0.45 THEN
            v_customer_id := TRUNC(DBMS_RANDOM.VALUE(1, 5));
        ELSIF DBMS_RANDOM.VALUE(0, 1) < 0.25 THEN
            v_customer_id := TRUNC(DBMS_RANDOM.VALUE(11, 14));
        END IF;

        v_quantity   := TRUNC(DBMS_RANDOM.VALUE(1, 6));
        v_unit_price := ROUND(DBMS_RANDOM.VALUE(25, 2200), 2);

        INSERT INTO FACT_SALES (
            SALE_ID,
            TIME_ID,
            PRODUCT_ID,
            CUSTOMER_ID,
            STORE_ID,
            QUANTITY,
            UNIT_PRICE,
            TOTAL_AMOUNT
        )
        VALUES (
            i,
            v_time_id,
            v_product_id,
            v_customer_id,
            v_store_id,
            v_quantity,
            v_unit_price,
            ROUND(v_quantity * v_unit_price, 2)
        );
    END LOOP;

    COMMIT;
END;
/


-- Plan de la CONSULTA ORIGINAL
EXPLAIN PLAN FOR
SELECT c.CUSTOMER_ID, c.CUSTOMER_NAME, p.CATEGORY, 
       COUNT(f.SALE_ID) AS total_sales_count, 
       SUM(f.TOTAL_AMOUNT) AS total_sales_amount
FROM FACT_SALES f 
LEFT JOIN DIM_CUSTOMER c ON f.CUSTOMER_ID = c.CUSTOMER_ID
LEFT JOIN DIM_PRODUCT p ON f.PRODUCT_ID = p.PRODUCT_ID
LEFT JOIN DIM_STORE s ON f.STORE_ID = s.STORE_ID
LEFT JOIN DIM_TIME t ON f.TIME_ID = t.TIME_ID
WHERE TO_CHAR(t.FULL_DATE,'YYYY-MM') = '2025-03' 
  AND UPPER(c.CONTRY) = 'SPAIN'
GROUP BY c.CUSTOMER_ID, c.CUSTOMER_NAME, p.CATEGORY
HAVING SUM(f.TOTAL_AMOUNT) > 500
ORDER BY c.CUSTOMER_ID, p.CATEGORY;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);


-- Plan de la CONSULTA ORIGINAL
EXPLAIN PLAN FOR
SELECT c.CUSTOMER_ID, c.CUSTOMER_NAME, p.CATEGORY, 
       COUNT(f.SALE_ID) AS total_sales_count, 
       SUM(f.TOTAL_AMOUNT) AS total_sales_amount
FROM FACT_SALES f 
LEFT JOIN DIM_CUSTOMER c ON f.CUSTOMER_ID = c.CUSTOMER_ID
LEFT JOIN DIM_PRODUCT p ON f.PRODUCT_ID = p.PRODUCT_ID
LEFT JOIN DIM_STORE s ON f.STORE_ID = s.STORE_ID
LEFT JOIN DIM_TIME t ON f.TIME_ID = t.TIME_ID
WHERE TO_CHAR(t.FULL_DATE,'YYYY-MM') = '2025-03' 
  AND UPPER(c.CONTRY) = 'SPAIN'
GROUP BY c.CUSTOMER_ID, c.CUSTOMER_NAME, p.CATEGORY
HAVING SUM(f.TOTAL_AMOUNT) > 500
ORDER BY c.CUSTOMER_ID, p.CATEGORY;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
