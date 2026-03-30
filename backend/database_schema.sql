-- ============================================================================
-- COMPREHENSIVE INVENTORY DATABASE SCHEMA FOR POSTGRESQL
-- ============================================================================
-- This schema is designed for a complete inventory management system
-- with proper normalization, data integrity, and relational structure
-- ============================================================================

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_pricing CASCADE;
DROP TABLE IF EXISTS product_specifications CASCADE;
DROP TABLE IF EXISTS product_packaging CASCADE;
DROP TABLE IF EXISTS product_dimensions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS designers CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- ============================================================================
-- MASTER DATA TABLES
-- ============================================================================

-- Countries Master Table
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(3) UNIQUE NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_countries_code ON countries(country_code);

COMMENT ON TABLE countries IS 'Master table for countries of origin';

-- Brands Master Table
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_name ON brands(brand_name);
CREATE INDEX idx_brands_active ON brands(is_active);

COMMENT ON TABLE brands IS 'Master table for product brands';

-- Designers Master Table
CREATE TABLE designers (
    id SERIAL PRIMARY KEY,
    designer_name VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_designers_name ON designers(designer_name);

COMMENT ON TABLE designers IS 'Master table for product designers';

-- Categories Master Table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_name ON categories(category_name);
CREATE INDEX idx_categories_active ON categories(is_active);

COMMENT ON TABLE categories IS 'Master table for product categories';

-- Subcategories Master Table
CREATE TABLE subcategories (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,
    subcategory_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE (category_id, subcategory_name)
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_name ON subcategories(subcategory_name);
CREATE INDEX idx_subcategories_active ON subcategories(is_active);

COMMENT ON TABLE subcategories IS 'Master table for product subcategories linked to categories';

-- ============================================================================
-- PRODUCT CORE TABLES
-- ============================================================================

-- Products Master Table (Core Product Information)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    sku_2025 VARCHAR(50),
    sku_2026 VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_english VARCHAR(255),
    description TEXT,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    brand_id INTEGER,
    designer_id INTEGER,
    country_id INTEGER,
    
    -- Product Attributes
    material VARCHAR(255),
    colour VARCHAR(100),
    size VARCHAR(50),
    ean BIGINT,
    ean_secondary BIGINT,
    customs_tariff_number BIGINT,
    
    -- Product Features
    dishwasher_safe BOOLEAN DEFAULT FALSE,
    cleaning_maintenance TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_discontinued BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (designer_id) REFERENCES designers(id) ON DELETE SET NULL,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL
);

-- Indexes for products table
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_ean ON products(ean);
CREATE INDEX idx_products_name ON products(name);

COMMENT ON TABLE products IS 'Core product master data table';

-- ============================================================================
-- PRODUCT DETAILS TABLES
-- ============================================================================

-- Product Dimensions Table
CREATE TABLE product_dimensions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    
    -- Functional Dimensions
    functional_depth_cm DECIMAL(10, 2),
    functional_width_cm DECIMAL(10, 2),
    functional_height_cm DECIMAL(10, 2),
    functional_diameter_cm DECIMAL(10, 2),
    functional_capacity_liter DECIMAL(10, 3),
    
    -- Packed Dimensions
    packed_weight_kg DECIMAL(10, 3),
    packed_depth_cm DECIMAL(10, 2),
    packed_width_cm DECIMAL(10, 2),
    packed_height_cm DECIMAL(10, 2),
    
    -- Product Weight
    product_weight_kg DECIMAL(10, 3),
    technical_capacity_liter DECIMAL(10, 3),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_dimensions_product ON product_dimensions(product_id);

COMMENT ON TABLE product_dimensions IS 'Product physical dimensions and capacities';

-- Product Packaging Table
CREATE TABLE product_packaging (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    
    -- Packaging Type
    packaging_type VARCHAR(100),
    
    -- Colli Information (Individual Package)
    colli_size INTEGER,
    colli_weight_kg DECIMAL(10, 3),
    colli_length_cm DECIMAL(10, 2),
    colli_width_cm DECIMAL(10, 2),
    colli_height_cm DECIMAL(10, 2),
    
    -- Master Colli Information (Bulk Package)
    master_colli_weight_kg DECIMAL(10, 3),
    master_colli_length_cm DECIMAL(10, 2),
    master_colli_width_cm DECIMAL(10, 2),
    master_colli_height_cm DECIMAL(10, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_packaging_product ON product_packaging(product_id);

COMMENT ON TABLE product_packaging IS 'Product packaging specifications and colli information';

-- Product Pricing Table
CREATE TABLE product_pricing (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    
    -- Pricing Information
    rrp_aed_excl_vat DECIMAL(10, 2),
    price_incl_vat DECIMAL(10, 2),
    listed_price_incl_vat DECIMAL(10, 2),
    
    -- Pricing Metadata
    currency VARCHAR(3) DEFAULT 'AED',
    vat_rate DECIMAL(5, 2) DEFAULT 5.00,
    is_current BOOLEAN DEFAULT TRUE,
    
    -- Date Range
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Comments
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_pricing_product ON product_pricing(product_id);
CREATE INDEX idx_pricing_current ON product_pricing(is_current);
CREATE INDEX idx_pricing_effective ON product_pricing(effective_from, effective_to);

COMMENT ON TABLE product_pricing IS 'Product pricing history with effective date ranges';

-- Product Images Table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    
    -- Image Information
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'product', -- product, thumbnail, detail, lifestyle
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_primary ON product_images(is_primary);

COMMENT ON TABLE product_images IS 'Product image URLs and metadata';

-- Product Specifications Table (Additional flexible attributes)
CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    
    -- Flexible key-value pairs for additional specs
    spec_key VARCHAR(100) NOT NULL,
    spec_value TEXT,
    spec_unit VARCHAR(50),
    
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, spec_key)
);

CREATE INDEX idx_specifications_product ON product_specifications(product_id);
CREATE INDEX idx_specifications_key ON product_specifications(spec_key);

COMMENT ON TABLE product_specifications IS 'Flexible product specifications for additional attributes';

-- ============================================================================
-- INVENTORY MANAGEMENT TABLES
-- ============================================================================

-- Inventory Transactions Table
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL, -- PURCHASE, SALE, ADJUSTMENT, RETURN
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    
    -- Reference Information
    reference_number VARCHAR(100),
    reference_type VARCHAR(50), -- PO, SO, INV, ADJ
    
    -- Location/Warehouse
    location VARCHAR(100),
    
    -- Transaction Metadata
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_transactions_reference ON inventory_transactions(reference_number);

COMMENT ON TABLE inventory_transactions IS 'Complete transaction history for inventory tracking';

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Complete Product View with all related information
CREATE OR REPLACE VIEW vw_products_complete AS
SELECT 
    p.id,
    p.sku,
    p.sku_2025,
    p.sku_2026,
    p.name,
    p.name_english,
    p.description,
    p.material,
    p.colour,
    p.size,
    p.ean,
    p.customs_tariff_number,
    p.dishwasher_safe,
    p.cleaning_maintenance,
    p.is_active,
    
    -- Category Information
    c.category_name,
    sc.subcategory_name,
    
    -- Brand and Designer
    b.brand_name,
    d.designer_name,
    
    -- Country
    co.country_name,
    
    -- Dimensions
    pd.functional_width_cm,
    pd.functional_depth_cm,
    pd.functional_height_cm,
    pd.functional_diameter_cm,
    pd.functional_capacity_liter,
    pd.product_weight_kg,
    pd.packed_weight_kg,
    
    -- Packaging
    pk.packaging_type,
    pk.colli_size,
    pk.colli_weight_kg,
    
    -- Current Pricing
    pp.rrp_aed_excl_vat,
    pp.price_incl_vat,
    pp.listed_price_incl_vat,
    
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN designers d ON p.designer_id = d.id
LEFT JOIN countries co ON p.country_id = co.id
LEFT JOIN product_dimensions pd ON p.id = pd.product_id
LEFT JOIN product_packaging pk ON p.id = pk.product_id
LEFT JOIN product_pricing pp ON p.id = pp.product_id AND pp.is_current = TRUE;

COMMENT ON VIEW vw_products_complete IS 'Complete product view with all related data';

-- Current Inventory View
CREATE OR REPLACE VIEW vw_current_inventory AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    c.category_name,
    b.brand_name,
    COALESCE(SUM(CASE 
        WHEN it.transaction_type IN ('PURCHASE', 'RETURN') THEN it.quantity
        WHEN it.transaction_type IN ('SALE', 'ADJUSTMENT') THEN -it.quantity
        ELSE 0
    END), 0) AS current_stock,
    pp.rrp_aed_excl_vat,
    pp.price_incl_vat
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN inventory_transactions it ON p.id = it.product_id
LEFT JOIN product_pricing pp ON p.id = pp.product_id AND pp.is_current = TRUE
WHERE p.is_active = TRUE
GROUP BY p.id, p.sku, p.name, c.category_name, b.brand_name, 
         pp.rrp_aed_excl_vat, pp.price_incl_vat;

COMMENT ON VIEW vw_current_inventory IS 'Current inventory stock levels by product';

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designers_updated_at BEFORE UPDATE ON designers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_dimensions_updated_at BEFORE UPDATE ON product_dimensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_packaging_updated_at BEFORE UPDATE ON product_packaging
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_pricing_updated_at BEFORE UPDATE ON product_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL MASTER DATA
-- ============================================================================

-- Insert base categories from the Excel data
INSERT INTO categories (id, category_name, display_order) VALUES
(1, 'Tea & Coffee', 1),
(2, 'Table', 2),
(3, 'Glass & Stemware', 3);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
