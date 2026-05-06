-- Insert HOME_MID banner for Loyalty Program section
INSERT INTO "banners" (
  "id",
  "title",
  "subtitle",
  "placement",
  "imageDesktopUrl",
  "imageMobileUrl",
  "ctaText",
  "ctaUrl",
  "displayOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Join Our Loyalty Program',
  'Earn points with every purchase and unlock exclusive rewards',
  'HOME_MID',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
  'Learn More',
  '/loyalty-program',
  1,
  true,
  NOW(),
  NOW()
);
