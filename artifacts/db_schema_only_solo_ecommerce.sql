-- ============================================================================
-- SCHEMA EXPORT: solo_ecommerce
-- Generated: 2026-02-01 23:13:25
-- Host: localhost:5433
-- NOTE: This is schema-only, no customer data included
-- ============================================================================

--
-- PostgreSQL database dump
--

\restrict IovhqSKezJTxHgI2mITtfSh2wgbnmqIqmdPGoyYWcIswa50GPfWHFsJbdpbUfsG

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

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
-- Name: inventory; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA inventory;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: AnalyticsEventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AnalyticsEventType" AS ENUM (
    'PAGE_VIEW',
    'PRODUCT_VIEW',
    'PRODUCT_SEARCH',
    'ADD_TO_CART',
    'REMOVE_FROM_CART',
    'CART_VIEW',
    'CHECKOUT_START',
    'CHECKOUT_COMPLETE',
    'ORDER_PLACED'
);


--
-- Name: BannerPlacement; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BannerPlacement" AS ENUM (
    'HOME_HERO',
    'HOME_TOP',
    'HOME_MID',
    'HOME_BOTTOM',
    'CATEGORY_TOP',
    'CART_TOP'
);


--
-- Name: CartItemType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CartItemType" AS ENUM (
    'PRODUCT',
    'PACKAGE'
);


--
-- Name: CategoryLandingSectionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoryLandingSectionType" AS ENUM (
    'SUBCATEGORY_NAV',
    'PRODUCT_GRID',
    'FEATURED_COLLECTIONS',
    'NEW_ARRIVALS',
    'TOP_SELLERS',
    'BRAND_STRIP',
    'PROMO_BANNER',
    'SEO_FAQ',
    'LOYALTY_BANNER'
);


--
-- Name: ContentBlockType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentBlockType" AS ENUM (
    'HOMEPAGE_SECTION',
    'ABOUT_US',
    'FOOTER_INFO',
    'CUSTOM'
);


--
-- Name: EmailOutboxStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmailOutboxStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);


--
-- Name: EmailOutboxType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmailOutboxType" AS ENUM (
    'ORDER_CONFIRMATION',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'PASSWORD_RESET',
    'WELCOME'
);


--
-- Name: HomeSectionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."HomeSectionType" AS ENUM (
    'HERO_SLIDER',
    'CATEGORY_TILES',
    'NEW_ARRIVALS',
    'TOP_SELLERS',
    'BRAND_STRIP',
    'LOYALTY_BANNER',
    'PROMO_BANNER'
);


--
-- Name: LandingSectionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LandingSectionType" AS ENUM (
    'PRODUCT_GRID',
    'CATEGORY_GRID',
    'RICH_TEXT',
    'IMAGE',
    'BANNER_CAROUSEL',
    'HERO',
    'CATEGORY_TILES',
    'PRODUCT_CAROUSEL',
    'BRAND_STRIP',
    'PROMO_BANNER',
    'TOP_PROMO_BAR',
    'TOP_LINKS_BAR',
    'MAIN_HEADER',
    'PRIMARY_NAV',
    'HERO_SLIDER',
    'VALUE_PROPS_ROW',
    'PROMO_BANNER_ROW_3',
    'PRODUCT_COLLECTION',
    'SALE_STRIP_BANNER',
    'CATEGORY_CIRCLE_STRIP',
    'INFO_BLOCKS_3',
    'BLOG_LATEST_GRID',
    'BRAND_LOGO_STRIP',
    'FOOTER_CONFIG',
    'NEWSLETTER_BLOCK',
    'TESTIMONIALS'
);


--
-- Name: LoyaltyTransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LoyaltyTransactionType" AS ENUM (
    'EARNED',
    'REDEEMED',
    'ADJUSTMENT',
    'EXPIRED'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PAYMENT_PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CREDIT_CARD',
    'CASH_ON_DELIVERY'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'REFUNDED'
);


--
-- Name: ProductCollectionStrategy; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProductCollectionStrategy" AS ENUM (
    'NEWEST',
    'BEST_SELLING',
    'FEATURED',
    'MANUAL',
    'CATEGORY_FILTER',
    'BRAND_FILTER',
    'TAG_FILTER',
    'PRICE_RANGE',
    'ON_SALE'
);


--
-- Name: PromoType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PromoType" AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT',
    'FREE_SHIPPING'
);


--
-- Name: ShippingMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShippingMethod" AS ENUM (
    'STANDARD',
    'EXPRESS',
    'OVERNIGHT',
    'PICKUP'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'CUSTOMER',
    'ADMIN',
    'SUPER_ADMIN'
);


--
-- Name: import_job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.import_job_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


--
-- Name: import_row_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.import_row_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'SKIPPED',
    'FAILED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    name_ar character varying(100),
    slug character varying(100) NOT NULL,
    description text,
    logo_id uuid,
    website character varying(255),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: brands; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.brands AS
 SELECT id,
    name AS brand_name,
    name_ar,
    slug,
    description,
    logo_id,
    website,
    sort_order AS display_order,
    is_active,
    created_at,
    updated_at
   FROM public.brands;


--
-- Name: brands_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.brands_v1_backup (
    id integer NOT NULL,
    brand_name character varying(100) NOT NULL,
    description text,
    website character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logo_id text
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.brands_id_seq OWNED BY inventory.brands_v1_backup.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    name_ar character varying(100),
    slug character varying(100) NOT NULL,
    description text,
    image_id uuid,
    parent_id integer,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.categories AS
 SELECT id,
    name AS category_name,
    name_ar,
    slug,
    description,
    image_id,
    parent_id,
    sort_order AS display_order,
    is_active,
    created_at,
    updated_at
   FROM public.categories;


--
-- Name: categories_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.categories_v1_backup (
    id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image_id text
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.categories_id_seq OWNED BY inventory.categories_v1_backup.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    country_code character varying(3) NOT NULL,
    country_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: countries; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.countries AS
 SELECT id,
    country_code,
    country_name,
    is_active,
    created_at,
    updated_at
   FROM public.countries;


--
-- Name: countries_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.countries_v1_backup (
    id integer NOT NULL,
    country_code character varying(3) NOT NULL,
    country_name character varying(100) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.countries_id_seq OWNED BY inventory.countries_v1_backup.id;


--
-- Name: designers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    bio text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: designers; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.designers AS
 SELECT id,
    name,
    slug,
    bio,
    is_active,
    created_at,
    updated_at
   FROM public.designers;


--
-- Name: designers_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.designers_v1_backup (
    id integer NOT NULL,
    designer_name character varying(100) NOT NULL,
    bio text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: designers_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.designers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: designers_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.designers_id_seq OWNED BY inventory.designers_v1_backup.id;


--
-- Name: inventory_transactions_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.inventory_transactions_v1_backup (
    id integer NOT NULL,
    product_id integer NOT NULL,
    transaction_type character varying(50) NOT NULL,
    quantity integer NOT NULL,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reference character varying(100),
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(100)
);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.inventory_transactions_id_seq OWNED BY inventory.inventory_transactions_v1_backup.id;


--
-- Name: product_dimensions_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.product_dimensions_v1_backup (
    id integer NOT NULL,
    product_id integer NOT NULL,
    functional_depth_cm numeric(10,2),
    functional_width_cm numeric(10,2),
    functional_height_cm numeric(10,2),
    functional_diameter_cm numeric(10,2),
    functional_capacity_liter numeric(10,3),
    packed_weight_kg numeric(10,3),
    packed_depth_cm numeric(10,2),
    packed_width_cm numeric(10,2),
    packed_height_cm numeric(10,2),
    product_weight_kg numeric(10,3),
    technical_capacity_liter numeric(10,3),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_dimensions_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.product_dimensions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_dimensions_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.product_dimensions_id_seq OWNED BY inventory.product_dimensions_v1_backup.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer NOT NULL,
    media_asset_id uuid NOT NULL,
    alt_text character varying(255),
    display_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_images; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.product_images AS
 SELECT id,
    product_id,
    media_asset_id,
    alt_text,
    display_order,
    is_primary,
    created_at,
    updated_at
   FROM public.product_images;


--
-- Name: product_images_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.product_images_v1_backup (
    id integer NOT NULL,
    product_id integer NOT NULL,
    image_url character varying(500),
    image_type character varying(50),
    alt_text character varying(255),
    display_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    media_asset_id text
);


--
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.product_images_id_seq OWNED BY inventory.product_images_v1_backup.id;


--
-- Name: product_packaging_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.product_packaging_v1_backup (
    id integer NOT NULL,
    product_id integer NOT NULL,
    packaging_type character varying(100),
    colli_size integer,
    colli_weight_kg numeric(10,3),
    colli_length_cm numeric(10,2),
    colli_width_cm numeric(10,2),
    colli_height_cm numeric(10,2),
    master_colli_weight_kg numeric(10,3),
    master_colli_length_cm numeric(10,2),
    master_colli_width_cm numeric(10,2),
    master_colli_height_cm numeric(10,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_packaging_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.product_packaging_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_packaging_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.product_packaging_id_seq OWNED BY inventory.product_packaging_v1_backup.id;


--
-- Name: product_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_pricing (
    id integer NOT NULL,
    product_id integer NOT NULL,
    price_excl_vat_aed numeric(10,2) NOT NULL,
    price_incl_vat_aed numeric(10,2) NOT NULL,
    cost_price_aed numeric(10,2),
    vat_rate numeric(5,4) DEFAULT 0.05 NOT NULL,
    is_current boolean DEFAULT true NOT NULL,
    effective_from date,
    effective_to date,
    remarks text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_pricing; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.product_pricing AS
 SELECT id,
    product_id,
    price_excl_vat_aed AS rrp_aed_excl_vat,
    price_incl_vat_aed AS price_incl_vat,
    vat_rate,
    is_current,
    effective_from,
    effective_to,
    remarks,
    created_at,
    updated_at
   FROM public.product_pricing;


--
-- Name: product_pricing_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.product_pricing_v1_backup (
    id integer NOT NULL,
    product_id integer NOT NULL,
    rrp_aed_excl_vat numeric(10,2),
    price_incl_vat numeric(10,2),
    listed_price_incl_vat numeric(10,2),
    currency character varying(3) DEFAULT 'AED'::character varying NOT NULL,
    vat_rate numeric(5,2),
    is_current boolean DEFAULT true NOT NULL,
    effective_from date,
    effective_to date,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_pricing_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.product_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.product_pricing_id_seq OWNED BY inventory.product_pricing_v1_backup.id;


--
-- Name: product_specifications_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.product_specifications_v1_backup (
    id integer NOT NULL,
    product_id integer NOT NULL,
    spec_key character varying(100) NOT NULL,
    spec_value text,
    spec_unit character varying(50),
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_specifications_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.product_specifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_specifications_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.product_specifications_id_seq OWNED BY inventory.product_specifications_v1_backup.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    sku character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    name_ar character varying(255),
    slug character varying(255) NOT NULL,
    description text,
    short_description character varying(500),
    full_description text,
    category_id integer,
    subcategory_id integer,
    brand_id integer,
    designer_id integer,
    country_id integer,
    material character varying(255),
    colour character varying(100),
    size character varying(50),
    ean bigint,
    barcode character varying(100),
    highlights jsonb DEFAULT '[]'::jsonb,
    specs jsonb DEFAULT '[]'::jsonb,
    delivery_note character varying(500),
    returns_note character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    is_discontinued boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_new boolean DEFAULT false NOT NULL,
    is_best_seller boolean DEFAULT false NOT NULL,
    meta_title character varying(200),
    meta_description character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.products AS
 SELECT id,
    sku,
    name,
    name_ar,
    slug,
    description,
    short_description,
    full_description,
    category_id,
    subcategory_id,
    brand_id,
    designer_id,
    country_id,
    material,
    colour,
    size,
    ean,
    barcode,
    highlights,
    specs,
    delivery_note,
    returns_note,
    is_active,
    is_discontinued,
    is_featured,
    is_new,
    is_best_seller,
    meta_title,
    meta_description,
    created_at,
    updated_at
   FROM public.products;


--
-- Name: products_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.products_v1_backup (
    id integer NOT NULL,
    sku character varying(50) NOT NULL,
    sku_2025 character varying(50),
    sku_2026 character varying(50),
    name character varying(255) NOT NULL,
    name_english character varying(255),
    description text,
    category_id integer,
    subcategory_id integer,
    brand_id integer,
    designer_id integer,
    country_id integer,
    material character varying(255),
    colour character varying(100),
    size character varying(50),
    ean bigint,
    ean_secondary bigint,
    customs_tariff_number bigint,
    dishwasher_safe boolean,
    cleaning_maintenance text,
    is_active boolean DEFAULT true NOT NULL,
    is_discontinued boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_new boolean DEFAULT false NOT NULL,
    is_best_seller boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delivery_note character varying(500),
    full_description text,
    gallery_image_urls jsonb DEFAULT '[]'::jsonb,
    highlights jsonb DEFAULT '[]'::jsonb,
    meta_description character varying(500),
    meta_title character varying(200),
    returns_note character varying(500),
    short_description character varying(500),
    specs jsonb DEFAULT '[]'::jsonb,
    url_slug character varying(255)
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.products_id_seq OWNED BY inventory.products_v1_backup.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    name_ar character varying(100),
    slug character varying(100) NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: subcategories; Type: VIEW; Schema: inventory; Owner: -
--

CREATE VIEW inventory.subcategories AS
 SELECT id,
    category_id,
    name AS subcategory_name,
    name_ar,
    slug,
    description,
    sort_order AS display_order,
    is_active,
    created_at,
    updated_at
   FROM public.subcategories;


--
-- Name: subcategories_v1_backup; Type: TABLE; Schema: inventory; Owner: -
--

CREATE TABLE inventory.subcategories_v1_backup (
    id integer NOT NULL,
    category_id integer NOT NULL,
    subcategory_name character varying(100) NOT NULL,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: inventory; Owner: -
--

CREATE SEQUENCE inventory.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: inventory; Owner: -
--

ALTER SEQUENCE inventory.subcategories_id_seq OWNED BY inventory.subcategories_v1_backup.id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: _v2_migration_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._v2_migration_log (
    id integer NOT NULL,
    step character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'COMPLETED'::character varying NOT NULL,
    row_count integer,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone DEFAULT now(),
    notes text
);


--
-- Name: _v2_migration_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._v2_migration_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _v2_migration_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._v2_migration_log_id_seq OWNED BY public._v2_migration_log.id;


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    "userId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "addressLine1" text NOT NULL,
    "addressLine2" text,
    city text NOT NULL,
    "postalCode" text,
    phone text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    label text
);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id text NOT NULL,
    type public."AnalyticsEventType" NOT NULL,
    "userId" text,
    metadata text,
    "sessionId" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "productId" integer
);


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ctaText" text,
    "ctaUrl" text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "endAt" timestamp(3) without time zone,
    "imageDesktopUrl" text DEFAULT ''::text NOT NULL,
    "imageMobileUrl" text,
    placement public."BannerPlacement" DEFAULT 'HOME_HERO'::public."BannerPlacement" NOT NULL,
    "startAt" timestamp(3) without time zone,
    image_id text,
    mobile_image_id text
);


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: blog_post_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_post_tags (
    id text NOT NULL,
    "postId" text NOT NULL,
    "tagId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    "featuredImage" text,
    author text,
    "readTimeMinutes" integer,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "metaTitle" text,
    "metaDescription" text
);


--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_tags (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: brands_v1_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands_v1_backup (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    logo text,
    website text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "cartId" text NOT NULL,
    type public."CartItemType" NOT NULL,
    "packageId" text,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "productId" integer
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "promoCode" character varying(50),
    "promoCodeId" text,
    "promoDiscount" numeric(10,2),
    "guestKey" uuid,
    "createdFrom" character varying(30)
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: categories_v1_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_v1_backup (
    id text NOT NULL,
    "departmentId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "parentId" text
);


--
-- Name: category_landing_page_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_landing_page_configs (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    "heroTitle" text,
    "heroSubtitle" text,
    "heroImageUrl" text,
    "heroImageMobileUrl" text,
    "ctaLabel" text,
    "ctaTargetType" text,
    "ctaTargetValue" text,
    "isHeroEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: category_landing_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_landing_sections (
    id text NOT NULL,
    "landingId" text NOT NULL,
    type public."CategoryLandingSectionType" NOT NULL,
    title text,
    "position" integer NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: content_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_blocks (
    id text NOT NULL,
    key text NOT NULL,
    type public."ContentBlockType" NOT NULL,
    title text,
    content text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: departments_v1_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments_v1_backup (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: designers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.designers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: designers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.designers_id_seq OWNED BY public.designers.id;


--
-- Name: email_outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_outbox (
    id text NOT NULL,
    "orderId" text,
    "userId" text,
    type public."EmailOutboxType" NOT NULL,
    status public."EmailOutboxStatus" DEFAULT 'PENDING'::public."EmailOutboxStatus" NOT NULL,
    recipient text NOT NULL,
    subject text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 3 NOT NULL,
    "lastError" text,
    payload text,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "usedAt" timestamp(3) without time zone
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: finance_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_settings (
    id text NOT NULL,
    "baseCurrencyCode" character varying(3) DEFAULT 'AED'::character varying NOT NULL,
    "vatRate" numeric(5,4) DEFAULT 0.05 NOT NULL,
    "roundingMode" character varying(20) DEFAULT 'HALF_UP'::character varying NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedByUserId" text
);


--
-- Name: global_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_sales (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "discountPercent" numeric(5,4) NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdByUserId" text,
    "updatedByUserId" text
);


--
-- Name: home_page_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_page_configs (
    id text NOT NULL,
    key text DEFAULT 'home'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    announcement_enabled boolean DEFAULT true NOT NULL,
    announcement_text character varying(500)
);


--
-- Name: home_page_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_page_sections (
    id text NOT NULL,
    "homePageId" text NOT NULL,
    type public."HomeSectionType" NOT NULL,
    title text,
    subtitle text,
    "position" integer NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: import_job_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_job_rows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    job_id uuid NOT NULL,
    row_number integer NOT NULL,
    sku character varying(50),
    status public.import_row_status DEFAULT 'PENDING'::public.import_row_status NOT NULL,
    action character varying(20),
    data_json jsonb,
    error_message text,
    product_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: import_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying(500) NOT NULL,
    original_filename character varying(255) NOT NULL,
    file_size_bytes integer,
    status public.import_job_status DEFAULT 'PENDING'::public.import_job_status NOT NULL,
    total_rows integer DEFAULT 0 NOT NULL,
    processed_rows integer DEFAULT 0 NOT NULL,
    inserted_rows integer DEFAULT 0 NOT NULL,
    updated_rows integer DEFAULT 0 NOT NULL,
    skipped_rows integer DEFAULT 0 NOT NULL,
    failed_rows integer DEFAULT 0 NOT NULL,
    error_log jsonb,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    product_id integer NOT NULL,
    transaction_type character varying(50) NOT NULL,
    quantity integer NOT NULL,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reference character varying(100),
    notes text,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: invoice_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_counters (
    id text NOT NULL,
    year integer NOT NULL,
    "lastNumber" integer DEFAULT 0 NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "currencyCode" character varying(3) DEFAULT 'AED'::character varying NOT NULL,
    "vatRateSnapshot" numeric(5,4) NOT NULL,
    "sellerName" character varying(200) NOT NULL,
    "sellerAddress" text NOT NULL,
    "sellerTaxNumber" character varying(50),
    "buyerName" character varying(200) NOT NULL,
    "buyerAddress" text NOT NULL,
    "buyerTaxNumber" character varying(50),
    "subtotalExclVat" numeric(12,2) NOT NULL,
    "discountExclVat" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatAmount" numeric(12,2) NOT NULL,
    "shippingExclVat" numeric(12,2) DEFAULT 0 NOT NULL,
    "shippingVat" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalInclVat" numeric(12,2) NOT NULL,
    "pdfStoragePath" character varying(500),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: landing_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_pages (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    "heroBannerId" text,
    "seoTitle" text,
    "seoDescription" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: landing_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_sections (
    id text NOT NULL,
    "landingPageId" text NOT NULL,
    type public."LandingSectionType" NOT NULL,
    data text NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    config text,
    subtitle text,
    title text
);


--
-- Name: loyalty_page_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_page_config (
    id text NOT NULL,
    key text DEFAULT 'default'::text NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    "ctaText" text NOT NULL,
    "ctaUrl" text NOT NULL,
    "spendAedThreshold" integer DEFAULT 1000 NOT NULL,
    "rewardAed" integer DEFAULT 10 NOT NULL,
    "howItWorksJson" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "faqsJson" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    id text NOT NULL,
    "walletId" text NOT NULL,
    type public."LoyaltyTransactionType" NOT NULL,
    "amountAed" numeric(10,2) NOT NULL,
    description text,
    "orderId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: loyalty_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_wallets (
    id text NOT NULL,
    "userId" text NOT NULL,
    "balanceAed" numeric(10,2) DEFAULT 0 NOT NULL,
    "totalEarnedAed" numeric(10,2) DEFAULT 0 NOT NULL,
    "totalRedeemedAed" numeric(10,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id text NOT NULL,
    key character varying(500) NOT NULL,
    folder character varying(100) NOT NULL,
    filename character varying(255) NOT NULL,
    "mimeType" character varying(100) NOT NULL,
    "sizeBytes" integer NOT NULL,
    width integer,
    height integer,
    "altText" character varying(255),
    variants jsonb,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ownerId" character varying(100),
    "ownerType" character varying(50)
);


--
-- Name: navigation_menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.navigation_menu_items (
    id text NOT NULL,
    "menuId" text NOT NULL,
    "parentId" text,
    label text NOT NULL,
    url text,
    icon text,
    badge text,
    "badgeColor" text,
    "imageUrl" text,
    description text,
    "openInNewTab" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: navigation_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.navigation_menus (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    type public."CartItemType" NOT NULL,
    "packageId" text,
    name text NOT NULL,
    sku text,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "productId" integer,
    "currencyCode" character varying(3) DEFAULT 'AED'::character varying,
    "lineDiscountExclVat" numeric(12,2) DEFAULT 0,
    "lineSubtotalExclVat" numeric(12,2),
    "lineTotalInclVat" numeric(12,2),
    "lineVatAmount" numeric(12,2),
    "unitDiscountExclVat" numeric(10,2) DEFAULT 0,
    "unitPriceExclVat" numeric(10,2),
    "unitPriceInclVat" numeric(10,2),
    "unitVatAmount" numeric(10,2),
    "vatRateSnapshot" numeric(5,4)
);


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_history (
    id text NOT NULL,
    "orderId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


--
-- Name: order_status_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_master (
    id text NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    color character varying(20),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "shippingAddressId" text NOT NULL,
    "billingAddressId" text NOT NULL,
    "shippingMethod" public."ShippingMethod" NOT NULL,
    "shippingCost" numeric(10,2) NOT NULL,
    "trackingNumber" text,
    subtotal numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    tax numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    "promoCode" text,
    "paymentIntentId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "shippedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "paymentMethod" public."PaymentMethod" DEFAULT 'CREDIT_CARD'::public."PaymentMethod" NOT NULL,
    "billingInvoiceCompany" character varying(60),
    "billingInvoiceVatNumber" character varying(60),
    "loyaltyRedeemAed" numeric(10,2),
    "loyaltyEarnAed" numeric(10,2) DEFAULT 0,
    "statusMasterId" text,
    "shippingCompany" text,
    "trackingUrl" text,
    "currencyCode" character varying(3) DEFAULT 'AED'::character varying NOT NULL,
    "discountExclVat" numeric(12,2) DEFAULT 0,
    "globalSaleId" text,
    "globalSaleName" character varying(100),
    "globalSalePercent" numeric(5,4),
    "promoDiscountType" character varying(20),
    "promoDiscountValue" numeric(10,2),
    "shippingExclVat" numeric(12,2),
    "shippingVatAmount" numeric(12,2),
    "subtotalExclVat" numeric(12,2),
    "totalInclVat" numeric(12,2),
    "vatAmount" numeric(12,2),
    "vatRateSnapshot" numeric(5,4)
);


--
-- Name: package_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.package_items (
    id text NOT NULL,
    "packageId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "productId" integer NOT NULL
);


--
-- Name: packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packages (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "longDescription" text,
    image text,
    price numeric(10,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "metaTitle" text,
    "metaDescription" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "usedAt" timestamp(3) without time zone
);


--
-- Name: product_collection_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_collection_items (
    id text NOT NULL,
    "collectionId" text NOT NULL,
    "productId" integer NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_collections (
    id text NOT NULL,
    key text NOT NULL,
    title text NOT NULL,
    subtitle text,
    strategy public."ProductCollectionStrategy" DEFAULT 'MANUAL'::public."ProductCollectionStrategy" NOT NULL,
    "ruleJson" text,
    "limit" integer DEFAULT 12 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: product_dimensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_dimensions (
    id integer NOT NULL,
    product_id integer NOT NULL,
    length_cm numeric(10,2),
    width_cm numeric(10,2),
    height_cm numeric(10,2),
    diameter_cm numeric(10,2),
    capacity_liter numeric(10,3),
    weight_kg numeric(10,3),
    packed_length_cm numeric(10,2),
    packed_width_cm numeric(10,2),
    packed_height_cm numeric(10,2),
    packed_weight_kg numeric(10,3),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_dimensions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_dimensions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_dimensions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_dimensions_id_seq OWNED BY public.product_dimensions.id;


--
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;


--
-- Name: product_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_overrides (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id integer NOT NULL,
    is_featured_override boolean,
    is_new_override boolean,
    is_best_seller_override boolean,
    homepage_rank integer,
    custom_price_aed numeric(10,2),
    custom_sale_price_aed numeric(10,2),
    is_on_sale boolean DEFAULT false NOT NULL,
    product_sale_percent numeric(5,2),
    product_sale_name character varying(50),
    product_sale_starts_at timestamp without time zone,
    product_sale_ends_at timestamp without time zone,
    custom_description text,
    custom_long_description text,
    meta_title character varying(200),
    meta_description character varying(500),
    meta_keywords character varying(500),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: product_overrides_v1_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_overrides_v1_backup (
    id text NOT NULL,
    "inventorySku" text NOT NULL,
    "inventoryId" integer,
    "isFeatured" boolean,
    "isNew" boolean,
    "isBestSeller" boolean,
    "homepageRank" integer,
    "categoryRank" integer,
    "customPrice" numeric(10,2),
    "customSalePrice" numeric(10,2),
    "customPriceInclVat" numeric(10,2),
    "customImagesJson" text,
    "customDescription" text,
    "customLongDescription" text,
    "metaTitle" text,
    "metaDescription" text,
    "metaKeywords" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "isOnSale" boolean DEFAULT false NOT NULL,
    "productSaleEndsAt" timestamp(3) without time zone,
    "productSaleName" character varying(50),
    "productSalePercent" numeric(5,2),
    "productSaleStartsAt" timestamp(3) without time zone
);


--
-- Name: product_packaging; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_packaging (
    id integer NOT NULL,
    product_id integer NOT NULL,
    packaging_type character varying(100),
    units_per_pack integer,
    packs_per_case integer,
    pack_weight_kg numeric(10,3),
    case_weight_kg numeric(10,3),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_packaging_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_packaging_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_packaging_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_packaging_id_seq OWNED BY public.product_packaging.id;


--
-- Name: product_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_pricing_id_seq OWNED BY public.product_pricing.id;


--
-- Name: product_specifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_specifications (
    id integer NOT NULL,
    product_id integer NOT NULL,
    spec_key character varying(100) NOT NULL,
    spec_value text,
    spec_unit character varying(50),
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_specifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_specifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_specifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_specifications_id_seq OWNED BY public.product_specifications.id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    sku character varying(100),
    stock_qty integer DEFAULT 0 NOT NULL,
    price_override_aed numeric(10,2),
    sale_price_override_aed numeric(10,2),
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id text NOT NULL,
    code text NOT NULL,
    description text,
    type public."PromoType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "minOrderAmount" numeric(10,2),
    "maxDiscount" numeric(10,2),
    "usageLimit" integer,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isRevoked" boolean DEFAULT false NOT NULL
);


--
-- Name: saved_payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_payment_methods (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider text DEFAULT 'stripe'::text NOT NULL,
    "providerPaymentMethodId" text NOT NULL,
    brand text NOT NULL,
    last4 character varying(4) NOT NULL,
    "expMonth" integer NOT NULL,
    "expYear" integer NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: saved_search_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_search_terms (
    id text NOT NULL,
    term text NOT NULL,
    "resultCount" integer NOT NULL,
    "userId" text,
    "sessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    type text DEFAULT 'string'::text NOT NULL,
    "group" text DEFAULT 'general'::text NOT NULL,
    label text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "firstName" text,
    "lastName" text,
    phone text,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone
);


--
-- Name: brands_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.brands_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.brands_id_seq'::regclass);


--
-- Name: categories_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.categories_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.categories_id_seq'::regclass);


--
-- Name: countries_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.countries_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.countries_id_seq'::regclass);


--
-- Name: designers_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.designers_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.designers_id_seq'::regclass);


--
-- Name: inventory_transactions_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.inventory_transactions_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.inventory_transactions_id_seq'::regclass);


--
-- Name: product_dimensions_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_dimensions_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.product_dimensions_id_seq'::regclass);


--
-- Name: product_images_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_images_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.product_images_id_seq'::regclass);


--
-- Name: product_packaging_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_packaging_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.product_packaging_id_seq'::regclass);


--
-- Name: product_pricing_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_pricing_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.product_pricing_id_seq'::regclass);


--
-- Name: product_specifications_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_specifications_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.product_specifications_id_seq'::regclass);


--
-- Name: products_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.products_id_seq'::regclass);


--
-- Name: subcategories_v1_backup id; Type: DEFAULT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.subcategories_v1_backup ALTER COLUMN id SET DEFAULT nextval('inventory.subcategories_id_seq'::regclass);


--
-- Name: _v2_migration_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._v2_migration_log ALTER COLUMN id SET DEFAULT nextval('public._v2_migration_log_id_seq'::regclass);


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: designers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designers ALTER COLUMN id SET DEFAULT nextval('public.designers_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: product_dimensions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_dimensions ALTER COLUMN id SET DEFAULT nextval('public.product_dimensions_id_seq'::regclass);


--
-- Name: product_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq'::regclass);


--
-- Name: product_packaging id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_packaging ALTER COLUMN id SET DEFAULT nextval('public.product_packaging_id_seq'::regclass);


--
-- Name: product_pricing id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_pricing ALTER COLUMN id SET DEFAULT nextval('public.product_pricing_id_seq'::regclass);


--
-- Name: product_specifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_specifications ALTER COLUMN id SET DEFAULT nextval('public.product_specifications_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: brands_v1_backup brands_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.brands_v1_backup
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: categories_v1_backup categories_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.categories_v1_backup
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: countries_v1_backup countries_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.countries_v1_backup
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: designers_v1_backup designers_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.designers_v1_backup
    ADD CONSTRAINT designers_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions_v1_backup inventory_transactions_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.inventory_transactions_v1_backup
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_dimensions_v1_backup product_dimensions_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_dimensions_v1_backup
    ADD CONSTRAINT product_dimensions_pkey PRIMARY KEY (id);


--
-- Name: product_images_v1_backup product_images_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_images_v1_backup
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_packaging_v1_backup product_packaging_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_packaging_v1_backup
    ADD CONSTRAINT product_packaging_pkey PRIMARY KEY (id);


--
-- Name: product_pricing_v1_backup product_pricing_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_pricing_v1_backup
    ADD CONSTRAINT product_pricing_pkey PRIMARY KEY (id);


--
-- Name: product_specifications_v1_backup product_specifications_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_specifications_v1_backup
    ADD CONSTRAINT product_specifications_pkey PRIMARY KEY (id);


--
-- Name: products_v1_backup products_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: subcategories_v1_backup subcategories_pkey; Type: CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.subcategories_v1_backup
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: _v2_migration_log _v2_migration_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._v2_migration_log
    ADD CONSTRAINT _v2_migration_log_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_post_tags blog_post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: brands_v1_backup brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands_v1_backup
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories_v1_backup categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_v1_backup
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: category_landing_page_configs category_landing_page_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_landing_page_configs
    ADD CONSTRAINT category_landing_page_configs_pkey PRIMARY KEY (id);


--
-- Name: category_landing_sections category_landing_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_landing_sections
    ADD CONSTRAINT category_landing_sections_pkey PRIMARY KEY (id);


--
-- Name: content_blocks content_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_blocks
    ADD CONSTRAINT content_blocks_pkey PRIMARY KEY (id);


--
-- Name: departments_v1_backup departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments_v1_backup
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: email_outbox email_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_outbox
    ADD CONSTRAINT email_outbox_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: finance_settings finance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_settings
    ADD CONSTRAINT finance_settings_pkey PRIMARY KEY (id);


--
-- Name: global_sales global_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_sales
    ADD CONSTRAINT global_sales_pkey PRIMARY KEY (id);


--
-- Name: home_page_configs home_page_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_page_configs
    ADD CONSTRAINT home_page_configs_pkey PRIMARY KEY (id);


--
-- Name: home_page_sections home_page_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_page_sections
    ADD CONSTRAINT home_page_sections_pkey PRIMARY KEY (id);


--
-- Name: invoice_counters invoice_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_counters
    ADD CONSTRAINT invoice_counters_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: landing_pages landing_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_pkey PRIMARY KEY (id);


--
-- Name: landing_sections landing_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_sections
    ADD CONSTRAINT landing_sections_pkey PRIMARY KEY (id);


--
-- Name: loyalty_page_config loyalty_page_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_page_config
    ADD CONSTRAINT loyalty_page_config_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: loyalty_wallets loyalty_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_wallets
    ADD CONSTRAINT loyalty_wallets_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: navigation_menu_items navigation_menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navigation_menu_items
    ADD CONSTRAINT navigation_menu_items_pkey PRIMARY KEY (id);


--
-- Name: navigation_menus navigation_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navigation_menus
    ADD CONSTRAINT navigation_menus_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: order_status_master order_status_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_master
    ADD CONSTRAINT order_status_master_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: package_items package_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.package_items
    ADD CONSTRAINT package_items_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: product_collection_items product_collection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_collection_items
    ADD CONSTRAINT product_collection_items_pkey PRIMARY KEY (id);


--
-- Name: product_collections product_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_collections
    ADD CONSTRAINT product_collections_pkey PRIMARY KEY (id);


--
-- Name: product_overrides_v1_backup product_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_overrides_v1_backup
    ADD CONSTRAINT product_overrides_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: saved_payment_methods saved_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_payment_methods
    ADD CONSTRAINT saved_payment_methods_pkey PRIMARY KEY (id);


--
-- Name: saved_search_terms saved_search_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_search_terms
    ADD CONSTRAINT saved_search_terms_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: brands v2_brands_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT v2_brands_name_key UNIQUE (name);


--
-- Name: brands v2_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT v2_brands_pkey PRIMARY KEY (id);


--
-- Name: brands v2_brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT v2_brands_slug_key UNIQUE (slug);


--
-- Name: categories v2_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT v2_categories_name_key UNIQUE (name);


--
-- Name: categories v2_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT v2_categories_pkey PRIMARY KEY (id);


--
-- Name: categories v2_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT v2_categories_slug_key UNIQUE (slug);


--
-- Name: countries v2_countries_country_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT v2_countries_country_code_key UNIQUE (country_code);


--
-- Name: countries v2_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT v2_countries_pkey PRIMARY KEY (id);


--
-- Name: designers v2_designers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designers
    ADD CONSTRAINT v2_designers_name_key UNIQUE (name);


--
-- Name: designers v2_designers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designers
    ADD CONSTRAINT v2_designers_pkey PRIMARY KEY (id);


--
-- Name: designers v2_designers_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designers
    ADD CONSTRAINT v2_designers_slug_key UNIQUE (slug);


--
-- Name: import_job_rows v2_import_job_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job_rows
    ADD CONSTRAINT v2_import_job_rows_pkey PRIMARY KEY (id);


--
-- Name: import_jobs v2_import_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT v2_import_jobs_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions v2_inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT v2_inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_dimensions v2_product_dimensions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_dimensions
    ADD CONSTRAINT v2_product_dimensions_pkey PRIMARY KEY (id);


--
-- Name: product_dimensions v2_product_dimensions_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_dimensions
    ADD CONSTRAINT v2_product_dimensions_product_id_key UNIQUE (product_id);


--
-- Name: product_images v2_product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT v2_product_images_pkey PRIMARY KEY (id);


--
-- Name: product_overrides v2_product_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_overrides
    ADD CONSTRAINT v2_product_overrides_pkey PRIMARY KEY (id);


--
-- Name: product_overrides v2_product_overrides_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_overrides
    ADD CONSTRAINT v2_product_overrides_product_id_key UNIQUE (product_id);


--
-- Name: product_packaging v2_product_packaging_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_packaging
    ADD CONSTRAINT v2_product_packaging_pkey PRIMARY KEY (id);


--
-- Name: product_packaging v2_product_packaging_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_packaging
    ADD CONSTRAINT v2_product_packaging_product_id_key UNIQUE (product_id);


--
-- Name: product_pricing v2_product_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_pricing
    ADD CONSTRAINT v2_product_pricing_pkey PRIMARY KEY (id);


--
-- Name: product_pricing v2_product_pricing_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_pricing
    ADD CONSTRAINT v2_product_pricing_product_id_key UNIQUE (product_id);


--
-- Name: product_specifications v2_product_specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_specifications
    ADD CONSTRAINT v2_product_specifications_pkey PRIMARY KEY (id);


--
-- Name: product_variants v2_product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT v2_product_variants_pkey PRIMARY KEY (id);


--
-- Name: products v2_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_pkey PRIMARY KEY (id);


--
-- Name: products v2_products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_sku_key UNIQUE (sku);


--
-- Name: products v2_products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_slug_key UNIQUE (slug);


--
-- Name: subcategories v2_subcategories_category_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT v2_subcategories_category_id_name_key UNIQUE (category_id, name);


--
-- Name: subcategories v2_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT v2_subcategories_pkey PRIMARY KEY (id);


--
-- Name: brands_brand_name_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX brands_brand_name_idx ON inventory.brands_v1_backup USING btree (brand_name);


--
-- Name: brands_brand_name_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX brands_brand_name_key ON inventory.brands_v1_backup USING btree (brand_name);


--
-- Name: brands_is_active_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX brands_is_active_idx ON inventory.brands_v1_backup USING btree (is_active);


--
-- Name: brands_logo_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX brands_logo_id_idx ON inventory.brands_v1_backup USING btree (logo_id);


--
-- Name: categories_category_name_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX categories_category_name_idx ON inventory.categories_v1_backup USING btree (category_name);


--
-- Name: categories_category_name_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX categories_category_name_key ON inventory.categories_v1_backup USING btree (category_name);


--
-- Name: categories_image_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX categories_image_id_idx ON inventory.categories_v1_backup USING btree (image_id);


--
-- Name: categories_is_active_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX categories_is_active_idx ON inventory.categories_v1_backup USING btree (is_active);


--
-- Name: countries_country_code_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX countries_country_code_idx ON inventory.countries_v1_backup USING btree (country_code);


--
-- Name: countries_country_code_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX countries_country_code_key ON inventory.countries_v1_backup USING btree (country_code);


--
-- Name: designers_designer_name_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX designers_designer_name_idx ON inventory.designers_v1_backup USING btree (designer_name);


--
-- Name: designers_designer_name_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX designers_designer_name_key ON inventory.designers_v1_backup USING btree (designer_name);


--
-- Name: inventory_transactions_created_at_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX inventory_transactions_created_at_idx ON inventory.inventory_transactions_v1_backup USING btree (created_at);


--
-- Name: inventory_transactions_product_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX inventory_transactions_product_id_idx ON inventory.inventory_transactions_v1_backup USING btree (product_id);


--
-- Name: inventory_transactions_transaction_type_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX inventory_transactions_transaction_type_idx ON inventory.inventory_transactions_v1_backup USING btree (transaction_type);


--
-- Name: product_dimensions_product_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_dimensions_product_id_idx ON inventory.product_dimensions_v1_backup USING btree (product_id);


--
-- Name: product_dimensions_product_id_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX product_dimensions_product_id_key ON inventory.product_dimensions_v1_backup USING btree (product_id);


--
-- Name: product_images_display_order_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_images_display_order_idx ON inventory.product_images_v1_backup USING btree (display_order);


--
-- Name: product_images_media_asset_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_images_media_asset_id_idx ON inventory.product_images_v1_backup USING btree (media_asset_id);


--
-- Name: product_images_product_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_images_product_id_idx ON inventory.product_images_v1_backup USING btree (product_id);


--
-- Name: product_packaging_product_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_packaging_product_id_idx ON inventory.product_packaging_v1_backup USING btree (product_id);


--
-- Name: product_packaging_product_id_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX product_packaging_product_id_key ON inventory.product_packaging_v1_backup USING btree (product_id);


--
-- Name: product_pricing_product_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_pricing_product_id_idx ON inventory.product_pricing_v1_backup USING btree (product_id);


--
-- Name: product_pricing_product_id_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX product_pricing_product_id_key ON inventory.product_pricing_v1_backup USING btree (product_id);


--
-- Name: product_specifications_product_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX product_specifications_product_id_idx ON inventory.product_specifications_v1_backup USING btree (product_id);


--
-- Name: products_brand_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_brand_id_idx ON inventory.products_v1_backup USING btree (brand_id);


--
-- Name: products_category_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_category_id_idx ON inventory.products_v1_backup USING btree (category_id);


--
-- Name: products_created_at_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_created_at_idx ON inventory.products_v1_backup USING btree (created_at);


--
-- Name: products_is_active_brand_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_active_brand_id_idx ON inventory.products_v1_backup USING btree (is_active, brand_id);


--
-- Name: products_is_active_category_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_active_category_id_idx ON inventory.products_v1_backup USING btree (is_active, category_id);


--
-- Name: products_is_active_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_active_idx ON inventory.products_v1_backup USING btree (is_active);


--
-- Name: products_is_active_is_best_seller_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_active_is_best_seller_idx ON inventory.products_v1_backup USING btree (is_active, is_best_seller);


--
-- Name: products_is_active_is_featured_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_active_is_featured_idx ON inventory.products_v1_backup USING btree (is_active, is_featured);


--
-- Name: products_is_active_is_new_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_active_is_new_idx ON inventory.products_v1_backup USING btree (is_active, is_new);


--
-- Name: products_is_best_seller_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_best_seller_idx ON inventory.products_v1_backup USING btree (is_best_seller);


--
-- Name: products_is_featured_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_featured_idx ON inventory.products_v1_backup USING btree (is_featured);


--
-- Name: products_is_new_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_is_new_idx ON inventory.products_v1_backup USING btree (is_new);


--
-- Name: products_sku_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_sku_idx ON inventory.products_v1_backup USING btree (sku);


--
-- Name: products_sku_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX products_sku_key ON inventory.products_v1_backup USING btree (sku);


--
-- Name: products_subcategory_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_subcategory_id_idx ON inventory.products_v1_backup USING btree (subcategory_id);


--
-- Name: products_url_slug_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX products_url_slug_idx ON inventory.products_v1_backup USING btree (url_slug);


--
-- Name: subcategories_category_id_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX subcategories_category_id_idx ON inventory.subcategories_v1_backup USING btree (category_id);


--
-- Name: subcategories_category_id_subcategory_name_key; Type: INDEX; Schema: inventory; Owner: -
--

CREATE UNIQUE INDEX subcategories_category_id_subcategory_name_key ON inventory.subcategories_v1_backup USING btree (category_id, subcategory_name);


--
-- Name: subcategories_subcategory_name_idx; Type: INDEX; Schema: inventory; Owner: -
--

CREATE INDEX subcategories_subcategory_name_idx ON inventory.subcategories_v1_backup USING btree (subcategory_name);


--
-- Name: addresses_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "addresses_userId_idx" ON public.addresses USING btree ("userId");


--
-- Name: analytics_events_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "analytics_events_createdAt_idx" ON public.analytics_events USING btree ("createdAt");


--
-- Name: analytics_events_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "analytics_events_productId_idx" ON public.analytics_events USING btree ("productId");


--
-- Name: analytics_events_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "analytics_events_sessionId_idx" ON public.analytics_events USING btree ("sessionId");


--
-- Name: analytics_events_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_events_type_idx ON public.analytics_events USING btree (type);


--
-- Name: analytics_events_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "analytics_events_userId_idx" ON public.analytics_events USING btree ("userId");


--
-- Name: banners_displayOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "banners_displayOrder_idx" ON public.banners USING btree ("displayOrder");


--
-- Name: banners_endAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "banners_endAt_idx" ON public.banners USING btree ("endAt");


--
-- Name: banners_image_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX banners_image_id_idx ON public.banners USING btree (image_id);


--
-- Name: banners_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "banners_isActive_idx" ON public.banners USING btree ("isActive");


--
-- Name: banners_mobile_image_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX banners_mobile_image_id_idx ON public.banners USING btree (mobile_image_id);


--
-- Name: banners_placement_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX banners_placement_idx ON public.banners USING btree (placement);


--
-- Name: banners_startAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "banners_startAt_idx" ON public.banners USING btree ("startAt");


--
-- Name: blog_categories_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_categories_isActive_idx" ON public.blog_categories USING btree ("isActive");


--
-- Name: blog_categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blog_categories_name_key ON public.blog_categories USING btree (name);


--
-- Name: blog_categories_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_categories_slug_idx ON public.blog_categories USING btree (slug);


--
-- Name: blog_categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blog_categories_slug_key ON public.blog_categories USING btree (slug);


--
-- Name: blog_post_tags_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_post_tags_postId_idx" ON public.blog_post_tags USING btree ("postId");


--
-- Name: blog_post_tags_postId_tagId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "blog_post_tags_postId_tagId_key" ON public.blog_post_tags USING btree ("postId", "tagId");


--
-- Name: blog_post_tags_tagId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_post_tags_tagId_idx" ON public.blog_post_tags USING btree ("tagId");


--
-- Name: blog_posts_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_posts_categoryId_idx" ON public.blog_posts USING btree ("categoryId");


--
-- Name: blog_posts_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_posts_isActive_idx" ON public.blog_posts USING btree ("isActive");


--
-- Name: blog_posts_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_posts_isFeatured_idx" ON public.blog_posts USING btree ("isFeatured");


--
-- Name: blog_posts_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "blog_posts_publishedAt_idx" ON public.blog_posts USING btree ("publishedAt");


--
-- Name: blog_posts_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_slug_idx ON public.blog_posts USING btree (slug);


--
-- Name: blog_posts_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blog_posts_slug_key ON public.blog_posts USING btree (slug);


--
-- Name: blog_tags_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blog_tags_name_key ON public.blog_tags USING btree (name);


--
-- Name: blog_tags_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_tags_slug_idx ON public.blog_tags USING btree (slug);


--
-- Name: blog_tags_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blog_tags_slug_key ON public.blog_tags USING btree (slug);


--
-- Name: brands_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX brands_name_key ON public.brands_v1_backup USING btree (name);


--
-- Name: brands_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brands_slug_idx ON public.brands_v1_backup USING btree (slug);


--
-- Name: brands_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX brands_slug_key ON public.brands_v1_backup USING btree (slug);


--
-- Name: brands_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "brands_sortOrder_idx" ON public.brands_v1_backup USING btree ("sortOrder");


--
-- Name: cart_items_cartId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cart_items_cartId_idx" ON public.cart_items USING btree ("cartId");


--
-- Name: cart_items_packageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cart_items_packageId_idx" ON public.cart_items USING btree ("packageId");


--
-- Name: cart_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cart_items_productId_idx" ON public.cart_items USING btree ("productId");


--
-- Name: carts_guest_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX carts_guest_unique ON public.carts USING btree ("guestKey") WHERE ("guestKey" IS NOT NULL);


--
-- Name: carts_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX carts_user_unique ON public.carts USING btree ("userId") WHERE ("userId" IS NOT NULL);


--
-- Name: categories_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "categories_departmentId_idx" ON public.categories_v1_backup USING btree ("departmentId");


--
-- Name: categories_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "categories_parentId_idx" ON public.categories_v1_backup USING btree ("parentId");


--
-- Name: categories_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_slug_idx ON public.categories_v1_backup USING btree (slug);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories_v1_backup USING btree (slug);


--
-- Name: categories_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "categories_sortOrder_idx" ON public.categories_v1_backup USING btree ("sortOrder");


--
-- Name: category_landing_page_configs_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "category_landing_page_configs_categoryId_idx" ON public.category_landing_page_configs USING btree ("categoryId");


--
-- Name: category_landing_page_configs_categoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "category_landing_page_configs_categoryId_key" ON public.category_landing_page_configs USING btree ("categoryId");


--
-- Name: category_landing_page_configs_isHeroEnabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "category_landing_page_configs_isHeroEnabled_idx" ON public.category_landing_page_configs USING btree ("isHeroEnabled");


--
-- Name: category_landing_sections_isEnabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "category_landing_sections_isEnabled_idx" ON public.category_landing_sections USING btree ("isEnabled");


--
-- Name: category_landing_sections_landingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "category_landing_sections_landingId_idx" ON public.category_landing_sections USING btree ("landingId");


--
-- Name: category_landing_sections_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX category_landing_sections_position_idx ON public.category_landing_sections USING btree ("position");


--
-- Name: content_blocks_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "content_blocks_isActive_idx" ON public.content_blocks USING btree ("isActive");


--
-- Name: content_blocks_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_blocks_key_idx ON public.content_blocks USING btree (key);


--
-- Name: content_blocks_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX content_blocks_key_key ON public.content_blocks USING btree (key);


--
-- Name: content_blocks_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_blocks_type_idx ON public.content_blocks USING btree (type);


--
-- Name: departments_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_name_key ON public.departments_v1_backup USING btree (name);


--
-- Name: departments_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departments_slug_idx ON public.departments_v1_backup USING btree (slug);


--
-- Name: departments_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_slug_key ON public.departments_v1_backup USING btree (slug);


--
-- Name: departments_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "departments_sortOrder_idx" ON public.departments_v1_backup USING btree ("sortOrder");


--
-- Name: email_outbox_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_outbox_createdAt_idx" ON public.email_outbox USING btree ("createdAt");


--
-- Name: email_outbox_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_outbox_orderId_idx" ON public.email_outbox USING btree ("orderId");


--
-- Name: email_outbox_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_outbox_status_idx ON public.email_outbox USING btree (status);


--
-- Name: email_outbox_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_outbox_type_idx ON public.email_outbox USING btree (type);


--
-- Name: email_outbox_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_outbox_userId_idx" ON public.email_outbox USING btree ("userId");


--
-- Name: email_verification_tokens_tokenHash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_verification_tokens_tokenHash_idx" ON public.email_verification_tokens USING btree ("tokenHash");


--
-- Name: email_verification_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON public.email_verification_tokens USING btree ("tokenHash");


--
-- Name: email_verification_tokens_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "email_verification_tokens_userId_idx" ON public.email_verification_tokens USING btree ("userId");


--
-- Name: favorites_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "favorites_productId_idx" ON public.favorites USING btree ("productId");


--
-- Name: favorites_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "favorites_userId_idx" ON public.favorites USING btree ("userId");


--
-- Name: favorites_userId_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "favorites_userId_productId_key" ON public.favorites USING btree ("userId", "productId");


--
-- Name: global_sales_endsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "global_sales_endsAt_idx" ON public.global_sales USING btree ("endsAt");


--
-- Name: global_sales_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "global_sales_isActive_idx" ON public.global_sales USING btree ("isActive");


--
-- Name: global_sales_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "global_sales_startsAt_idx" ON public.global_sales USING btree ("startsAt");


--
-- Name: home_page_configs_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX home_page_configs_key_key ON public.home_page_configs USING btree (key);


--
-- Name: home_page_sections_homePageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "home_page_sections_homePageId_idx" ON public.home_page_sections USING btree ("homePageId");


--
-- Name: home_page_sections_isEnabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "home_page_sections_isEnabled_idx" ON public.home_page_sections USING btree ("isEnabled");


--
-- Name: home_page_sections_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX home_page_sections_position_idx ON public.home_page_sections USING btree ("position");


--
-- Name: idx_brands_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_is_active ON public.brands USING btree (is_active);


--
-- Name: idx_brands_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_slug ON public.brands USING btree (slug);


--
-- Name: idx_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);


--
-- Name: idx_import_job_rows_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_job_rows_job_id ON public.import_job_rows USING btree (job_id);


--
-- Name: idx_import_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_jobs_status ON public.import_jobs USING btree (status);


--
-- Name: idx_product_images_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_images_product_id ON public.product_images USING btree (product_id);


--
-- Name: idx_product_overrides_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_overrides_product_id ON public.product_overrides USING btree (product_id);


--
-- Name: idx_product_pricing_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_pricing_product_id ON public.product_pricing USING btree (product_id);


--
-- Name: idx_product_variants_default_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_product_variants_default_unique ON public.product_variants USING btree (product_id) WHERE (is_default = true);


--
-- Name: idx_product_variants_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_is_active ON public.product_variants USING btree (is_active);


--
-- Name: idx_product_variants_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_is_default ON public.product_variants USING btree (is_default);


--
-- Name: idx_product_variants_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_product_id ON public.product_variants USING btree (product_id);


--
-- Name: idx_product_variants_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_sku ON public.product_variants USING btree (sku) WHERE (sku IS NOT NULL);


--
-- Name: idx_products_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_brand_id ON public.products USING btree (brand_id);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at);


--
-- Name: idx_products_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_active ON public.products USING btree (is_active);


--
-- Name: idx_products_is_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: idx_subcategories_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_category_id ON public.subcategories USING btree (category_id);


--
-- Name: idx_subcategories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_slug ON public.subcategories USING btree (slug);


--
-- Name: invoice_counters_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoice_counters_year_key ON public.invoice_counters USING btree (year);


--
-- Name: invoices_invoiceNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "invoices_invoiceNumber_idx" ON public.invoices USING btree ("invoiceNumber");


--
-- Name: invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON public.invoices USING btree ("invoiceNumber");


--
-- Name: invoices_issuedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "invoices_issuedAt_idx" ON public.invoices USING btree ("issuedAt");


--
-- Name: invoices_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "invoices_orderId_idx" ON public.invoices USING btree ("orderId");


--
-- Name: invoices_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "invoices_orderId_key" ON public.invoices USING btree ("orderId");


--
-- Name: landing_pages_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "landing_pages_isActive_idx" ON public.landing_pages USING btree ("isActive");


--
-- Name: landing_pages_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX landing_pages_slug_idx ON public.landing_pages USING btree (slug);


--
-- Name: landing_pages_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX landing_pages_slug_key ON public.landing_pages USING btree (slug);


--
-- Name: landing_sections_displayOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "landing_sections_displayOrder_idx" ON public.landing_sections USING btree ("displayOrder");


--
-- Name: landing_sections_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "landing_sections_isActive_idx" ON public.landing_sections USING btree ("isActive");


--
-- Name: landing_sections_landingPageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "landing_sections_landingPageId_idx" ON public.landing_sections USING btree ("landingPageId");


--
-- Name: loyalty_page_config_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX loyalty_page_config_key_idx ON public.loyalty_page_config USING btree (key);


--
-- Name: loyalty_page_config_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX loyalty_page_config_key_key ON public.loyalty_page_config USING btree (key);


--
-- Name: loyalty_transactions_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "loyalty_transactions_createdAt_idx" ON public.loyalty_transactions USING btree ("createdAt");


--
-- Name: loyalty_transactions_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "loyalty_transactions_orderId_idx" ON public.loyalty_transactions USING btree ("orderId");


--
-- Name: loyalty_transactions_walletId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "loyalty_transactions_walletId_idx" ON public.loyalty_transactions USING btree ("walletId");


--
-- Name: loyalty_wallets_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "loyalty_wallets_userId_idx" ON public.loyalty_wallets USING btree ("userId");


--
-- Name: loyalty_wallets_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "loyalty_wallets_userId_key" ON public.loyalty_wallets USING btree ("userId");


--
-- Name: media_assets_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "media_assets_createdAt_idx" ON public.media_assets USING btree ("createdAt");


--
-- Name: media_assets_folder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_folder_idx ON public.media_assets USING btree (folder);


--
-- Name: media_assets_isDeleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "media_assets_isDeleted_idx" ON public.media_assets USING btree ("isDeleted");


--
-- Name: media_assets_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_assets_key_key ON public.media_assets USING btree (key);


--
-- Name: media_assets_ownerType_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "media_assets_ownerType_ownerId_idx" ON public.media_assets USING btree ("ownerType", "ownerId");


--
-- Name: navigation_menu_items_menuId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "navigation_menu_items_menuId_idx" ON public.navigation_menu_items USING btree ("menuId");


--
-- Name: navigation_menu_items_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "navigation_menu_items_parentId_idx" ON public.navigation_menu_items USING btree ("parentId");


--
-- Name: navigation_menu_items_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "navigation_menu_items_sortOrder_idx" ON public.navigation_menu_items USING btree ("sortOrder");


--
-- Name: navigation_menus_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "navigation_menus_isActive_idx" ON public.navigation_menus USING btree ("isActive");


--
-- Name: navigation_menus_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX navigation_menus_key_idx ON public.navigation_menus USING btree (key);


--
-- Name: navigation_menus_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX navigation_menus_key_key ON public.navigation_menus USING btree (key);


--
-- Name: order_items_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_orderId_idx" ON public.order_items USING btree ("orderId");


--
-- Name: order_items_packageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_packageId_idx" ON public.order_items USING btree ("packageId");


--
-- Name: order_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_productId_idx" ON public.order_items USING btree ("productId");


--
-- Name: order_status_history_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_status_history_createdAt_idx" ON public.order_status_history USING btree ("createdAt");


--
-- Name: order_status_history_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_status_history_orderId_idx" ON public.order_status_history USING btree ("orderId");


--
-- Name: order_status_master_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_status_master_code_idx ON public.order_status_master USING btree (code);


--
-- Name: order_status_master_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX order_status_master_code_key ON public.order_status_master USING btree (code);


--
-- Name: order_status_master_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_status_master_sortOrder_idx" ON public.order_status_master USING btree ("sortOrder");


--
-- Name: orders_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_createdAt_idx" ON public.orders USING btree ("createdAt");


--
-- Name: orders_currencyCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_currencyCode_idx" ON public.orders USING btree ("currencyCode");


--
-- Name: orders_orderNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_orderNumber_idx" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_paymentStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_paymentStatus_idx" ON public.orders USING btree ("paymentStatus");


--
-- Name: orders_statusMasterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_statusMasterId_idx" ON public.orders USING btree ("statusMasterId");


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_userId_idx" ON public.orders USING btree ("userId");


--
-- Name: package_items_packageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "package_items_packageId_idx" ON public.package_items USING btree ("packageId");


--
-- Name: package_items_packageId_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "package_items_packageId_productId_key" ON public.package_items USING btree ("packageId", "productId");


--
-- Name: package_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "package_items_productId_idx" ON public.package_items USING btree ("productId");


--
-- Name: packages_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "packages_isActive_idx" ON public.packages USING btree ("isActive");


--
-- Name: packages_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "packages_isFeatured_idx" ON public.packages USING btree ("isFeatured");


--
-- Name: packages_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX packages_slug_idx ON public.packages USING btree (slug);


--
-- Name: packages_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX packages_slug_key ON public.packages USING btree (slug);


--
-- Name: password_reset_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_token_idx ON public.password_reset_tokens USING btree (token);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: password_reset_tokens_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "password_reset_tokens_userId_idx" ON public.password_reset_tokens USING btree ("userId");


--
-- Name: product_collection_items_collectionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_collection_items_collectionId_idx" ON public.product_collection_items USING btree ("collectionId");


--
-- Name: product_collection_items_collectionId_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "product_collection_items_collectionId_productId_key" ON public.product_collection_items USING btree ("collectionId", "productId");


--
-- Name: product_collection_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_collection_items_productId_idx" ON public.product_collection_items USING btree ("productId");


--
-- Name: product_collections_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_collections_isActive_idx" ON public.product_collections USING btree ("isActive");


--
-- Name: product_collections_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_collections_key_idx ON public.product_collections USING btree (key);


--
-- Name: product_collections_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_collections_key_key ON public.product_collections USING btree (key);


--
-- Name: product_overrides_homepageRank_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_overrides_homepageRank_idx" ON public.product_overrides_v1_backup USING btree ("homepageRank");


--
-- Name: product_overrides_inventoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_overrides_inventoryId_idx" ON public.product_overrides_v1_backup USING btree ("inventoryId");


--
-- Name: product_overrides_inventorySku_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_overrides_inventorySku_idx" ON public.product_overrides_v1_backup USING btree ("inventorySku");


--
-- Name: product_overrides_inventorySku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "product_overrides_inventorySku_key" ON public.product_overrides_v1_backup USING btree ("inventorySku");


--
-- Name: product_overrides_isBestSeller_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_overrides_isBestSeller_idx" ON public.product_overrides_v1_backup USING btree ("isBestSeller");


--
-- Name: product_overrides_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_overrides_isFeatured_idx" ON public.product_overrides_v1_backup USING btree ("isFeatured");


--
-- Name: product_overrides_isNew_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_overrides_isNew_idx" ON public.product_overrides_v1_backup USING btree ("isNew");


--
-- Name: promo_codes_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_code_idx ON public.promo_codes USING btree (code);


--
-- Name: promo_codes_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promo_codes_code_key ON public.promo_codes USING btree (code);


--
-- Name: promo_codes_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "promo_codes_expiresAt_idx" ON public.promo_codes USING btree ("expiresAt");


--
-- Name: promo_codes_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "promo_codes_isActive_idx" ON public.promo_codes USING btree ("isActive");


--
-- Name: promo_codes_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "promo_codes_startsAt_idx" ON public.promo_codes USING btree ("startsAt");


--
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_token_idx ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_tokens_userId_idx" ON public.refresh_tokens USING btree ("userId");


--
-- Name: saved_payment_methods_isDefault_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "saved_payment_methods_isDefault_idx" ON public.saved_payment_methods USING btree ("isDefault");


--
-- Name: saved_payment_methods_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "saved_payment_methods_userId_idx" ON public.saved_payment_methods USING btree ("userId");


--
-- Name: saved_search_terms_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "saved_search_terms_createdAt_idx" ON public.saved_search_terms USING btree ("createdAt");


--
-- Name: saved_search_terms_term_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX saved_search_terms_term_idx ON public.saved_search_terms USING btree (term);


--
-- Name: saved_search_terms_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "saved_search_terms_userId_idx" ON public.saved_search_terms USING btree ("userId");


--
-- Name: site_settings_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_settings_group_idx ON public.site_settings USING btree ("group");


--
-- Name: site_settings_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_settings_key_idx ON public.site_settings USING btree (key);


--
-- Name: site_settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX site_settings_key_key ON public.site_settings USING btree (key);


--
-- Name: users_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_createdAt_idx" ON public.users USING btree ("createdAt");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: brands_v1_backup brands_logo_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.brands_v1_backup
    ADD CONSTRAINT brands_logo_id_fkey FOREIGN KEY (logo_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories_v1_backup categories_image_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.categories_v1_backup
    ADD CONSTRAINT categories_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_transactions_v1_backup inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.inventory_transactions_v1_backup
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory.products_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_dimensions_v1_backup product_dimensions_product_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_dimensions_v1_backup
    ADD CONSTRAINT product_dimensions_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory.products_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_images_v1_backup product_images_media_asset_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_images_v1_backup
    ADD CONSTRAINT product_images_media_asset_id_fkey FOREIGN KEY (media_asset_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_images_v1_backup product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_images_v1_backup
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory.products_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_packaging_v1_backup product_packaging_product_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_packaging_v1_backup
    ADD CONSTRAINT product_packaging_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory.products_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_pricing_v1_backup product_pricing_product_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_pricing_v1_backup
    ADD CONSTRAINT product_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory.products_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_specifications_v1_backup product_specifications_product_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.product_specifications_v1_backup
    ADD CONSTRAINT product_specifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory.products_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products_v1_backup products_brand_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES inventory.brands_v1_backup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products_v1_backup products_category_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES inventory.categories_v1_backup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products_v1_backup products_country_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup
    ADD CONSTRAINT products_country_id_fkey FOREIGN KEY (country_id) REFERENCES inventory.countries_v1_backup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products_v1_backup products_designer_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup
    ADD CONSTRAINT products_designer_id_fkey FOREIGN KEY (designer_id) REFERENCES inventory.designers_v1_backup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products_v1_backup products_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.products_v1_backup
    ADD CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES inventory.subcategories_v1_backup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subcategories_v1_backup subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: inventory; Owner: -
--

ALTER TABLE ONLY inventory.subcategories_v1_backup
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES inventory.categories_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics_events analytics_events_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: banners banners_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: banners banners_mobile_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_mobile_image_id_fkey FOREIGN KEY (mobile_image_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blog_post_tags blog_post_tags_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT "blog_post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.blog_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_post_tags blog_post_tags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT "blog_post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.blog_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.blog_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories_v1_backup categories_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_v1_backup
    ADD CONSTRAINT "categories_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments_v1_backup(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories_v1_backup categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_v1_backup
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories_v1_backup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_fk FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: category_landing_sections category_landing_sections_landingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_landing_sections
    ADD CONSTRAINT "category_landing_sections_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES public.category_landing_page_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: favorites favorites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: home_page_sections home_page_sections_homePageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_page_sections
    ADD CONSTRAINT "home_page_sections_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES public.home_page_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: landing_pages landing_pages_heroBannerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT "landing_pages_heroBannerId_fkey" FOREIGN KEY ("heroBannerId") REFERENCES public.banners(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: landing_sections landing_sections_landingPageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_sections
    ADD CONSTRAINT "landing_sections_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES public.landing_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT "loyalty_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.loyalty_wallets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loyalty_wallets loyalty_wallets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_wallets
    ADD CONSTRAINT "loyalty_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: navigation_menu_items navigation_menu_items_menuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navigation_menu_items
    ADD CONSTRAINT "navigation_menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES public.navigation_menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: navigation_menu_items navigation_menu_items_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navigation_menu_items
    ADD CONSTRAINT "navigation_menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.navigation_menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_status_history order_status_history_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_billingAddressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_shippingAddressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_statusMasterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_statusMasterId_fkey" FOREIGN KEY ("statusMasterId") REFERENCES public.order_status_master(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: package_items package_items_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.package_items
    ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_collection_items product_collection_items_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_collection_items
    ADD CONSTRAINT "product_collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public.product_collections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saved_payment_methods saved_payment_methods_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_payment_methods
    ADD CONSTRAINT "saved_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: import_job_rows v2_import_job_rows_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job_rows
    ADD CONSTRAINT v2_import_job_rows_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.import_jobs(id) ON DELETE CASCADE;


--
-- Name: import_job_rows v2_import_job_rows_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job_rows
    ADD CONSTRAINT v2_import_job_rows_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: inventory_transactions v2_inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT v2_inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_dimensions v2_product_dimensions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_dimensions
    ADD CONSTRAINT v2_product_dimensions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_images v2_product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT v2_product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_overrides v2_product_overrides_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_overrides
    ADD CONSTRAINT v2_product_overrides_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_packaging v2_product_packaging_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_packaging
    ADD CONSTRAINT v2_product_packaging_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_pricing v2_product_pricing_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_pricing
    ADD CONSTRAINT v2_product_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_specifications v2_product_specifications_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_specifications
    ADD CONSTRAINT v2_product_specifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_variants v2_product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT v2_product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products v2_products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;


--
-- Name: products v2_products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products v2_products_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE SET NULL;


--
-- Name: products v2_products_designer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_designer_id_fkey FOREIGN KEY (designer_id) REFERENCES public.designers(id) ON DELETE SET NULL;


--
-- Name: products v2_products_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT v2_products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;


--
-- Name: subcategories v2_subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT v2_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IovhqSKezJTxHgI2mITtfSh2wgbnmqIqmdPGoyYWcIswa50GPfWHFsJbdpbUfsG

