BEGIN;

-- ===== Parents =====

INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-tea-coffee',
 (SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Tea & Coffee','tea-and-coffee',10,true,NOW(),NOW(),NULL),

('cat-table',
 (SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Table','table',20,true,NOW(),NOW(),NULL),

('cat-glass-stemware',
 (SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Glass & Stemware','glass-and-stemware',30,true,NOW(),NOW(),NULL),

('cat-on-the-go',
 (SELECT id FROM departments WHERE slug='on-the-go' OR name='On-the-Go' LIMIT 1),
 'On The Go Hot & Cold','on-the-go-hot-and-cold',40,true,NOW(),NOW(),NULL),

('cat-kitchen',
 (SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Kitchen','kitchen',50,true,NOW(),NOW(),NULL),

('cat-indoor-living',
 (SELECT id FROM departments WHERE slug='furniture' OR name='Furniture' LIMIT 1),
 'Indoor Living','indoor-living',60,true,NOW(),NOW(),NULL),

('cat-outdoor',
 (SELECT id FROM departments WHERE slug='outdoor' OR name='Outdoor' LIMIT 1),
 'Outdoor','outdoor',70,true,NOW(),NOW(),NULL)
ON CONFLICT (slug) DO NOTHING;


-- ===== Tea & Coffee (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-tea-coffee-dallahs-vacuum-jugs',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Dallahs & Vacuum Jugs','tea-and-coffee-dallahs-vacuum-jugs',10,true,NOW(),NOW(),'cat-tea-coffee'),
('cat-tea-coffee-cups-saucers',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Cups & Saucers','tea-and-coffee-cups-and-saucers',20,true,NOW(),NOW(),'cat-tea-coffee'),
('cat-tea-coffee-makers',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Tea & Coffee Makers','tea-and-coffee-makers',30,true,NOW(),NOW(),'cat-tea-coffee'),
('cat-tea-coffee-milk-sugar',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Milk & Sugar','tea-and-coffee-milk-and-sugar',40,true,NOW(),NOW(),'cat-tea-coffee'),
('cat-tea-coffee-trays',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Trays','tea-and-coffee-trays',50,true,NOW(),NOW(),'cat-tea-coffee'),
('cat-tea-coffee-accessories',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Accessories','tea-and-coffee-accessories',60,true,NOW(),NOW(),'cat-tea-coffee')
ON CONFLICT (slug) DO NOTHING;


-- ===== Table (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-table-plates',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Plates','table-plates',10,true,NOW(),NOW(),'cat-table'),
('cat-table-bowls',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Bowls','table-bowls',20,true,NOW(),NOW(),'cat-table'),
('cat-table-serveware',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Serveware','table-serveware',30,true,NOW(),NOW(),'cat-table'),
('cat-table-cutlery-flatware',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Cutlery & Flatware','table-cutlery-and-flatware',40,true,NOW(),NOW(),'cat-table'),
('cat-table-mats-linens',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Table Mats & Linens','table-mats-and-linens',50,true,NOW(),NOW(),'cat-table'),
('cat-table-accessories',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Table Accessories','table-accessories',60,true,NOW(),NOW(),'cat-table')
ON CONFLICT (slug) DO NOTHING;


-- ===== Glass & Stemware (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-glass-tumblers',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Tumblers','glass-and-stemware-tumblers',10,true,NOW(),NOW(),'cat-glass-stemware'),
('cat-glass-wine-goblet',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Wine & Goblet Glasses','glass-and-stemware-wine-and-goblet-glasses',20,true,NOW(),NOW(),'cat-glass-stemware'),
('cat-glass-beer',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Beer Glasses','glass-and-stemware-beer-glasses',30,true,NOW(),NOW(),'cat-glass-stemware'),
('cat-glass-cocktail-coup',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Cocktail & Coup Glasses','glass-and-stemware-cocktail-and-coup-glasses',40,true,NOW(),NOW(),'cat-glass-stemware'),
('cat-glass-carafes-decanters',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Carafes & Decanters','glass-and-stemware-carafes-and-decanters',50,true,NOW(),NOW(),'cat-glass-stemware'),
('cat-glass-bar-accessories',(SELECT id FROM departments WHERE slug='tableware' OR name='Tableware' LIMIT 1),
 'Bar Accessories','glass-and-stemware-bar-accessories',60,true,NOW(),NOW(),'cat-glass-stemware')
ON CONFLICT (slug) DO NOTHING;


-- ===== On The Go Hot & Cold (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-otg-035',(SELECT id FROM departments WHERE slug='on-the-go' OR name='On-the-Go' LIMIT 1),
 '0.35 L','on-the-go-hot-and-cold-0-35l',10,true,NOW(),NOW(),'cat-on-the-go'),
('cat-otg-05',(SELECT id FROM departments WHERE slug='on-the-go' OR name='On-the-Go' LIMIT 1),
 '0.5 L','on-the-go-hot-and-cold-0-5l',20,true,NOW(),NOW(),'cat-on-the-go'),
('cat-otg-07',(SELECT id FROM departments WHERE slug='on-the-go' OR name='On-the-Go' LIMIT 1),
 '0.7 L','on-the-go-hot-and-cold-0-7l',30,true,NOW(),NOW(),'cat-on-the-go'),
('cat-otg-09',(SELECT id FROM departments WHERE slug='on-the-go' OR name='On-the-Go' LIMIT 1),
 '0.9 L (Sip & Go)','on-the-go-hot-and-cold-0-9l-sip-and-go',40,true,NOW(),NOW(),'cat-on-the-go')
ON CONFLICT (slug) DO NOTHING;


-- ===== Kitchen (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-kitchen-pots',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Pots','kitchen-pots',10,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-pans',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Pans','kitchen-pans',20,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-saucepans',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Saucepans','kitchen-saucepans',30,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-saute-pans',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Saute pans','kitchen-saute-pans',40,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-lids',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Lids','kitchen-lids',50,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-tools',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Tools','kitchen-tools',60,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-show-all',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Show All','kitchen-show-all',70,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-equipment',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Equipment','kitchen-equipment',80,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-oil-vinegar',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Oil & Vinegar','kitchen-oil-and-vinegar',90,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-accessories',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Accessories','kitchen-accessories',100,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-organizers',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Organizers','kitchen-organizers',110,true,NOW(),NOW(),'cat-kitchen'),
('cat-kitchen-trivets-more',(SELECT id FROM departments WHERE slug='kitchenware' OR name='Kitchenware' LIMIT 1),
 'Trivets & More','kitchen-trivets-and-more',120,true,NOW(),NOW(),'cat-kitchen')
ON CONFLICT (slug) DO NOTHING;


-- ===== Indoor Living (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-indoor-vases-candles',(SELECT id FROM departments WHERE slug='furniture' OR name='Furniture' LIMIT 1),
 'Vases & Candles','indoor-living-vases-and-candles',10,true,NOW(),NOW(),'cat-indoor-living'),
('cat-indoor-decorative',(SELECT id FROM departments WHERE slug='furniture' OR name='Furniture' LIMIT 1),
 'Decorative','indoor-living-decorative',20,true,NOW(),NOW(),'cat-indoor-living'),
('cat-indoor-organizing',(SELECT id FROM departments WHERE slug='furniture' OR name='Furniture' LIMIT 1),
 'Organizing','indoor-living-organizing',30,true,NOW(),NOW(),'cat-indoor-living'),
('cat-indoor-bathroom',(SELECT id FROM departments WHERE slug='furniture' OR name='Furniture' LIMIT 1),
 'Bathroom','indoor-living-bathroom',40,true,NOW(),NOW(),'cat-indoor-living')
ON CONFLICT (slug) DO NOTHING;


-- ===== Outdoor (children) =====
INSERT INTO categories (id, "departmentId", name, slug, "sortOrder", "isActive", "createdAt", "updatedAt", "parentId")
VALUES
('cat-outdoor-bird-feeding',(SELECT id FROM departments WHERE slug='outdoor' OR name='Outdoor' LIMIT 1),
 'Bird Feeding','outdoor-bird-feeding',10,true,NOW(),NOW(),'cat-outdoor'),
('cat-outdoor-fire-grills',(SELECT id FROM departments WHERE slug='outdoor' OR name='Outdoor' LIMIT 1),
 'Fire & Grills','outdoor-fire-and-grills',20,true,NOW(),NOW(),'cat-outdoor'),
('cat-outdoor-self-watering-planters',(SELECT id FROM departments WHERE slug='outdoor' OR name='Outdoor' LIMIT 1),
 'Self Watering Planters','outdoor-self-watering-planters',30,true,NOW(),NOW(),'cat-outdoor')
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- quick check
SELECT COUNT(*) AS total_categories FROM categories;
SELECT COUNT(*) AS total_parents FROM categories WHERE "parentId" IS NULL;
SELECT COUNT(*) AS total_children FROM categories WHERE "parentId" IS NOT NULL;
