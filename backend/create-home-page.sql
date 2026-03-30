-- Create Home Landing Page with CATEGORY_TILES section
-- This SQL script creates the home landing page if it doesn't exist
-- and adds the CATEGORY_TILES section

-- First, insert or get the home landing page
INSERT INTO landing_page (id, title, slug, description, is_published, meta_title, meta_description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Home Page',
  'home',
  'Main homepage with dynamic sections',
  true,
  'Welcome to Solo Ecommerce',
  'Your one-stop shop for quality kitchen products',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Get the home page ID
DO $$
DECLARE
  home_page_id UUID;
  section_exists BOOLEAN;
BEGIN
  -- Get home page ID
  SELECT id INTO home_page_id FROM landing_page WHERE slug = 'home';
  
  -- Check if CATEGORY_TILES section already exists
  SELECT EXISTS(
    SELECT 1 FROM landing_section 
    WHERE landing_page_id = home_page_id AND type = 'CATEGORY_TILES'
  ) INTO section_exists;
  
  -- Only create if it doesn't exist
  IF NOT section_exists THEN
    INSERT INTO landing_section (
      id,
      landing_page_id,
      type,
      title,
      data,
      config,
      display_order,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      home_page_id,
      'CATEGORY_TILES',
      'Shop by Collection',
      jsonb_build_object(
        'tiles', jsonb_build_array(
          jsonb_build_object(
            'title', 'Cookware',
            'imageUrl', 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600',
            'linkUrl', '/category/cookware'
          ),
          jsonb_build_object(
            'title', 'Bakeware',
            'imageUrl', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
            'linkUrl', '/category/bakeware'
          ),
          jsonb_build_object(
            'title', 'Kitchen Tools',
            'imageUrl', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600',
            'linkUrl', '/category/kitchen-tools'
          ),
          jsonb_build_object(
            'title', 'Small Appliances',
            'imageUrl', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600',
            'linkUrl', '/category/small-appliances'
          )
        )
      ),
      jsonb_build_object(
        'columns', 4,
        'mobileColumns', 2,
        'aspectRatio', 1.2,
        'showTitle', true,
        'overlayOpacity', 0.3
      ),
      COALESCE((SELECT MAX(display_order) FROM landing_section WHERE landing_page_id = home_page_id), 0) + 1,
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created CATEGORY_TILES section for home page';
  ELSE
    RAISE NOTICE 'CATEGORY_TILES section already exists for home page';
  END IF;
END $$;

-- Verify the result
SELECT 
  lp.slug as page_slug,
  ls.type as section_type,
  ls.title as section_title,
  ls.is_active,
  ls.display_order
FROM landing_page lp
LEFT JOIN landing_section ls ON ls.landing_page_id = lp.id
WHERE lp.slug = 'home'
ORDER BY ls.display_order;
