# Category Tiles Seed Implementation

## Overview
Added an idempotent seed mechanism that ensures the Home landing page always has a CATEGORY_TILES section with 4 default tiles.

## Files Modified

### 1. `backend/src/content/content.service.ts`

**Added Methods:**
- `ensureCategoryTilesSection(homePageId: string)` - Private method that idempotently creates the section

**Modified Methods:**
- `getHomePage()` - Now calls `ensureCategoryTilesSection()` before returning data

## Implementation Details

### Seed Logic

```typescript
private async ensureCategoryTilesSection(homePageId: string) {
  // 1. Check if CATEGORY_TILES section already exists
  const existingSection = await this.prisma.landingSection.findFirst({
    where: {
      landingPageId: homePageId,
      type: 'CATEGORY_TILES',
    },
  });

  if (existingSection) {
    console.log('[ContentService] CATEGORY_TILES section already exists, skipping seed');
    return; // Idempotent - skip if exists
  }

  // 2. Get highest display order to append at end
  const lastSection = await this.prisma.landingSection.findFirst({
    where: { landingPageId: homePageId },
    orderBy: { displayOrder: 'desc' },
  });

  const displayOrder = lastSection ? lastSection.displayOrder + 1 : 1;

  // 3. Create section with 4 default tiles
  await this.prisma.landingSection.create({
    data: {
      landingPageId: homePageId,
      type: 'CATEGORY_TILES',
      title: 'Shop by Collection',
      displayOrder,
      data: JSON.stringify({
        tiles: [
          {
            title: 'Cookware',
            imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600',
            linkUrl: '/category/cookware',
          },
          {
            title: 'Bakeware',
            imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
            linkUrl: '/category/bakeware',
          },
          {
            title: 'Kitchen Tools',
            imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600',
            linkUrl: '/category/kitchen-tools',
          },
          {
            title: 'Small Appliances',
            imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600',
            linkUrl: '/category/small-appliances',
          },
        ],
      }),
      config: JSON.stringify({
        columns: 4,
        mobileColumns: 2,
        aspectRatio: 1.2,
        showTitle: true,
        overlayOpacity: 0.3,
      }),
      isActive: true,
    },
  });
}
```

## Tile Data Structure

Each tile in `section.data['tiles']` contains:
```json
{
  "title": "Cookware",
  "imageUrl": "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600",
  "linkUrl": "/category/cookware"
}
```

## Image URLs Used

1. **Cookware**: `https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600`
2. **Bakeware**: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600`
3. **Kitchen Tools**: `https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600`
4. **Small Appliances**: `https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600`

## Link URLs

- Cookware: `/category/cookware`
- Bakeware: `/category/bakeware`
- Kitchen Tools: `/category/kitchen-tools`
- Small Appliances: `/category/small-appliances`

## Behavior

### When Section Exists
- Logs: `[ContentService] CATEGORY_TILES section already exists, skipping seed`
- Returns immediately without changes

### When Section Doesn't Exist
- Logs: `[ContentService] Creating default CATEGORY_TILES section...`
- Creates section with displayOrder = last section + 1
- Logs: `[ContentService] ✅ CATEGORY_TILES section created successfully`

## Trigger

The seed runs automatically on **every GET /landing-pages/home request** via the `getHomePage()` method.

This ensures:
- ✅ Idempotent - safe to call multiple times
- ✅ Automatic - no manual intervention needed
- ✅ Non-destructive - preserves existing sections
- ✅ Lazy initialization - only creates when home page exists

## Verification

### 1. API Endpoint
```bash
GET http://localhost:3000/landing-pages/home
```

**Expected Response:**
```json
{
  "id": "...",
  "slug": "home",
  "title": "Home",
  "isActive": true,
  "sections": [
    {
      "type": "CATEGORY_TILES",
      "title": "Shop by Collection",
      "data": {
        "tiles": [
          {
            "title": "Cookware",
            "imageUrl": "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600",
            "linkUrl": "/category/cookware"
          },
          // ... 3 more tiles
        ]
      },
      "config": {
        "columns": 4,
        "mobileColumns": 2,
        "aspectRatio": 1.2,
        "showTitle": true,
        "overlayOpacity": 0.3
      },
      "isActive": true,
      "displayOrder": 1
    }
  ]
}
```

### 2. Admin UI
Navigate to: **Admin → Landing Pages → Home → Edit Sections**

You should see a CATEGORY_TILES section with 4 tiles.

### 3. Frontend Homepage
Navigate to: **http://localhost:5000/**

The homepage should display 4 category tiles (Cookware, Bakeware, Kitchen Tools, Small Appliances) rendered by `PortoCategoryTilesSection` widget.

### 4. Server Logs
Check backend console output when hitting the home endpoint:
```
[ContentService] Fetching homepage with slug: home
[ContentService] Homepage query result: { found: true, id: '...', sectionsCount: X }
[ContentService] CATEGORY_TILES section already exists, skipping seed
```

OR (first time):
```
[ContentService] Creating default CATEGORY_TILES section...
[ContentService] ✅ CATEGORY_TILES section created successfully
```

## Database Impact

### No Schema Changes
- ✅ Uses existing `LandingSection` table
- ✅ Uses existing `type` enum (CATEGORY_TILES already defined)
- ✅ Uses existing `data` JSONB field

### Single Row Insertion
When the section doesn't exist, inserts **one row** into `landing_section` table:
```sql
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
) VALUES (
  uuid_generate_v4(),
  '<home_page_id>',
  'CATEGORY_TILES',
  'Shop by Collection',
  '{"tiles": [...]}',
  '{"columns": 4, ...}',
  <max_display_order + 1>,
  true,
  NOW(),
  NOW()
);
```

## Compatibility

### Frontend Widget Compatibility
The data structure matches exactly what `PortoCategoryTilesSection` expects:
```dart
class PortoCategoryTilesSection extends StatelessWidget {
  final LandingSectionDto section;
  
  List<Map<String, dynamic>> get tiles => 
      (section.data['tiles'] as List).cast<Map<String, dynamic>>();
  
  // Each tile has: title, imageUrl, linkUrl
}
```

### Admin UI Compatibility
The specialized Category Tiles editor in `admin_landing_pages_screen.dart` can edit this section:
- Opens visual tile editor when clicking "Edit Sections"
- Supports add/edit/delete of tiles
- Validates title, imageUrl, linkUrl fields

## Notes

1. **Idempotency**: Safe to restart backend - won't create duplicates
2. **Non-blocking**: If home page doesn't exist, returns empty structure without seeding
3. **Preserves Data**: Existing sections remain unchanged
4. **Auto-ordering**: New section appends to end with next available displayOrder
5. **Frontend Integration**: home_screen.dart already checks for CATEGORY_TILES sections

## Rollback

To remove the seeded section:
```sql
DELETE FROM landing_section 
WHERE type = 'CATEGORY_TILES' 
AND landing_page_id = (SELECT id FROM landing_page WHERE slug = 'home');
```

Or use Admin UI: **Landing Pages → Home → Edit Sections → Delete the CATEGORY_TILES section**
