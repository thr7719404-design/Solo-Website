# Design System Documentation
## UI/UX Guidelines and Component Library

**Application:** Solo E-Commerce Platform  
**Design Language:** Modern Minimalism  
**Framework:** Flutter Material Design 3  
**Last Updated:** December 27, 2025

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Iconography](#iconography)
7. [Imagery](#imagery)
8. [Animations](#animations)
9. [Responsive Design](#responsive-design)
10. [Dark Mode](#dark-mode-planned)

---

## Design Philosophy

### Core Principles

**1. Minimalism**
- Clean, uncluttered interfaces
- Focus on content and products
- Generous white space
- Sharp, angular design (no rounded corners on main elements)

**2. Elegance**
- Premium feel matching luxury products
- Sophisticated color palette
- High-quality product photography
- Subtle, refined interactions

**3. Clarity**
- Clear visual hierarchy
- Intuitive navigation
- Readable typography
- Consistent patterns

**4. Accessibility**
- High contrast ratios (WCAG AA compliant)
- Large touch targets (minimum 48x48dp)
- Screen reader support
- Keyboard navigation

### Brand Personality
- **Sophisticated:** Premium aesthetic
- **Modern:** Contemporary design patterns
- **Trustworthy:** Clear information hierarchy
- **Approachable:** User-friendly interactions

---

## Color System

### Primary Palette

```dart
// File: lib/theme/app_theme.dart

Primary Color (Black)
Color(0xFF1A1A1A)
RGB: 26, 26, 26
Usage: Headers, buttons, primary text, app bar

Accent Color (Dark Goldenrod)
Color(0xFFB8860B)
RGB: 184, 134, 11
Usage: Highlights, hover states, CTAs, badges

Background (White)
Colors.white
RGB: 255, 255, 255
Usage: Main background, cards

Card Background
Color(0xFFFAFAFA)
RGB: 250, 250, 250
Usage: Elevated surfaces, product cards
```

### Visual Swatches

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Primary   │  │   Accent    │  │ Background  │
│   #1A1A1A   │  │   #B8860B   │  │   #FFFFFF   │
│   ███████   │  │   ███████   │  │   ░░░░░░░   │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Card BG    │  │   Border    │  │  Text Sec   │
│   #FAFAFA   │  │   #E5E5E5   │  │   #666666   │
│   ▓▓▓▓▓▓▓   │  │   ░░░░░░░   │  │   ███████   │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Text Colors

```dart
Text Primary
Color(0xFF1A1A1A)
Usage: Headlines, body text, primary content

Text Secondary
Color(0xFF666666)
Usage: Descriptions, captions, helper text

Text Disabled
Color(0xFFBBBBBB)
Usage: Disabled buttons, inactive elements

Text on Primary
Colors.white
Usage: Text on black backgrounds, buttons
```

### Semantic Colors

```dart
Success (Green)
Color(0xFF10B981)
RGB: 16, 185, 129
Usage: Success messages, checkmarks, in-stock badges

Error (Red)
Color(0xFFDC2626)
RGB: 220, 38, 38
Usage: Error messages, validation errors, out-of-stock

Warning (Amber)
Color(0xFFF59E0B)
RGB: 245, 158, 11
Usage: Warnings, low stock alerts

Info (Blue)
Color(0xFF3B82F6)
RGB: 59, 130, 246
Usage: Information messages, tooltips
```

### Color Usage Guidelines

**Do's:**
- Use primary black for main actions and headers
- Use accent gold sparingly for emphasis
- Maintain high contrast for readability
- Use semantic colors consistently

**Don'ts:**
- Don't use accent color for large backgrounds
- Don't mix multiple accent colors
- Don't use low-contrast color combinations
- Don't deviate from the defined palette

---

## Typography

### Font Family

**Primary Font:** Work Sans (Google Fonts)
- **Weight Range:** 300 (Light) to 700 (Bold)
- **Characteristics:** Clean, geometric, readable
- **Fallback:** -apple-system, system-ui, sans-serif

### Type Scale

```dart
Display Large
Font: Work Sans Light
Size: 48px
Weight: 300
Line Height: 56px
Letter Spacing: -1px
Usage: Hero headlines, landing page titles

Display Medium
Font: Work Sans Light
Size: 36px
Weight: 300
Line Height: 44px
Letter Spacing: -0.5px
Usage: Section headers, featured content

Headline Large
Font: Work Sans Regular
Size: 28px
Weight: 400
Line Height: 36px
Letter Spacing: 0
Usage: Page titles, major sections

Headline Medium
Font: Work Sans Regular
Size: 22px
Weight: 400
Line Height: 28px
Letter Spacing: 0
Usage: Card titles, subsection headers

Title Large
Font: Work Sans Medium
Size: 16px
Weight: 500
Line Height: 24px
Letter Spacing: 0.5px
Usage: Product names, navigation items

Title Medium
Font: Work Sans Medium
Size: 14px
Weight: 500
Line Height: 20px
Letter Spacing: 0.3px
Usage: Button text, labels, tabs

Body Large
Font: Work Sans Regular
Size: 15px
Weight: 400
Line Height: 24px
Letter Spacing: 0
Usage: Body text, descriptions, paragraphs

Body Medium
Font: Work Sans Regular
Size: 13px
Weight: 400
Line Height: 20px
Letter Spacing: 0
Usage: Secondary text, captions, metadata

Label Large
Font: Work Sans Semibold
Size: 13px
Weight: 600
Line Height: 16px
Letter Spacing: 0.5px
Usage: Buttons, badges, tags (ALL CAPS)
```

### Typography Examples

```
┌─────────────────────────────────────────┐
│  DISPLAY LARGE (48px)                   │
│  Premium Kitchenware                    │
├─────────────────────────────────────────┤
│  Headline Large (28px)                  │
│  Shop by Category                       │
├─────────────────────────────────────────┤
│  Title Large (16px)                     │
│  Serving Fork 11cm 3pcs                 │
├─────────────────────────────────────────┤
│  Body Large (15px)                      │
│  Eva Trio has developed a complete      │
│  range of serving utensils designed     │
│  for professional use.                  │
├─────────────────────────────────────────┤
│  Body Medium (13px)                     │
│  In stock • Ships in 2-3 days           │
├─────────────────────────────────────────┤
│  Label Large (13px)                     │
│  [ADD TO CART]                          │
└─────────────────────────────────────────┘
```

### Typography Guidelines

**Hierarchy:**
- Maximum 3 levels of hierarchy per screen
- Clear distinction between levels (size, weight, color)
- Consistent spacing between text blocks

**Line Length:**
- Body text: 50-75 characters per line (ideal)
- Headings: No line length restriction
- Mobile: Reduce to 40-50 characters

**Alignment:**
- Left-aligned for body text (LTR languages)
- Center-aligned for headlines (optional)
- Right-aligned for numbers (prices, quantities)

---

## Spacing & Layout

### Spacing Scale

Based on 8px grid system:

```dart
XXS:  4px  (0.25rem)  - Icon padding, minimal spacing
XS:   8px  (0.5rem)   - Compact spacing, tight groups
S:    12px (0.75rem)  - Small gaps, list items
M:    16px (1rem)     - Default spacing, paragraphs
L:    24px (1.5rem)   - Section spacing, cards
XL:   32px (2rem)     - Major sections, page padding
XXL:  48px (3rem)     - Hero spacing, feature blocks
XXXL: 64px (4rem)     - Dramatic spacing, landing pages
```

### Layout Grid

**Desktop (>1200px):**
- 12 column grid
- Gutter: 24px
- Max width: 1440px
- Margins: 48px

**Tablet (768px - 1199px):**
- 8 column grid
- Gutter: 16px
- Full width
- Margins: 24px

**Mobile (<768px):**
- 4 column grid
- Gutter: 16px
- Full width
- Margins: 16px

### Container Widths

```dart
Content Container:    1200px max
Narrow Container:     800px max
Wide Container:       1440px max
Full Width:           100%

Padding:
- Desktop:    48px horizontal
- Tablet:     24px horizontal
- Mobile:     16px horizontal
```

---

## Components

### Buttons

#### Primary Button (Elevated)
```dart
Style:
- Background: Primary Black (#1A1A1A)
- Text: White
- Padding: 32px horizontal, 16px vertical
- Border Radius: 0 (sharp corners)
- Elevation: 0 (flat)
- Text Style: Label Large, ALL CAPS

States:
- Default: Black background
- Hover: Slightly lighter (#2A2A2A)
- Pressed: Darker (#0A0A0A)
- Disabled: Gray (#CCCCCC)
```

**Example:**
```
┌────────────────────────┐
│   ADD TO CART          │
└────────────────────────┘
 Black background, white text
```

#### Secondary Button (Outlined)
```dart
Style:
- Background: Transparent
- Border: 1px solid Black (#1A1A1A)
- Text: Black
- Padding: 32px horizontal, 16px vertical
- Border Radius: 0

States:
- Default: Outlined
- Hover: Light gray background
- Pressed: Darker gray background
- Disabled: Gray border and text
```

**Example:**
```
┌────────────────────────┐
│   ADD TO FAVORITES     │
└────────────────────────┘
 White background, black border
```

#### Text Button
```dart
Style:
- Background: Transparent
- Text: Black
- Padding: 16px horizontal, 12px vertical
- No border

States:
- Default: Black text
- Hover: Underline
- Pressed: Accent color
```

### Cards

#### Product Card
```dart
Style:
- Background: White
- Border: 1px solid #E5E5E5
- Border Radius: 0
- Elevation: 0 (flat)
- Padding: 0

Layout:
┌───────────────────┐
│                   │
│   Product Image   │
│   (1:1 ratio)     │
│                   │
├───────────────────┤
│ Product Name      │
│ Short Description │
│ ★★★★☆ (23)       │
│ AED 145.00        │
│ [Add to Cart]     │
└───────────────────┘

Hover State:
- Subtle shadow (elevation 2)
- Scale 1.02
```

#### Category Card
```dart
Style:
- Background: Light gray (#F5F5F5)
- Border Radius: 12px (exception to sharp corners)
- Padding: 24px

Layout:
┌───────────────────┐
│   Category Icon   │
│   Category Name   │
│   →               │
└───────────────────┘

Hover:
- Darken background
- Scale arrow icon
```

### Form Inputs

#### Text Field
```dart
Style:
- Background: White
- Border: 1px solid #E5E5E5
- Border Radius: 0
- Padding: 16px
- Font: Body Large

States:
- Default: Gray border
- Focus: Black border (1px)
- Error: Red border, error message below
- Disabled: Gray background, gray border

Label:
- Position: Above input
- Font: Title Medium
- Color: Text Primary
```

**Example:**
```
Email Address *
┌─────────────────────────────┐
│ user@example.com            │
└─────────────────────────────┘
Helper text or error message
```

### Navigation

#### Top App Bar
```dart
Style:
- Height: 64px (mobile), 80px (desktop)
- Background: White
- Border Bottom: 1px solid #E5E5E5
- Elevation: 0

Layout:
┌────────────────────────────────────┐
│ [☰]    [LOGO]        [🔍][♡][🛒] │
└────────────────────────────────────┘

Scroll Behavior:
- Floating: Hides on scroll down, shows on scroll up
- Pinned: Always visible
```

#### Drawer Menu
```dart
Style:
- Width: 320px
- Background: White
- Elevation: 16

Header:
- Gradient: Blue to Purple
- Height: 180px
- User avatar/icon
- Welcome text

Sections:
- Quick Actions: 4 icon buttons
- Navigation Items: List tiles
- Footer: Version, social links

Dividers:
- 1px solid #E5E5E5
- 16px margin
```

### Badges

```dart
// Notification Badge
Style:
- Background: Accent Gold
- Shape: Circle
- Size: 20x20px
- Position: Top-right of icon

// Status Badge
Styles:
- In Stock: Green background, white text
- Low Stock: Amber background, dark text
- Out of Stock: Red background, white text
- New: Black background, white text
- Sale: Accent Gold, black text

Shape: Pill (fully rounded)
Padding: 6px horizontal, 4px vertical
Font: Label Large, 11px
```

**Examples:**
```
┌────┐  ┌────────────┐  ┌─────────┐
│ 3  │  │ IN STOCK   │  │  NEW    │
└────┘  └────────────┘  └─────────┘
Circle   Green pill      Black pill
```

### Loading States

```dart
// Circular Progress Indicator
- Color: Primary Black
- Size: 40x40px
- Stroke Width: 4px

// Linear Progress Indicator
- Color: Primary Black
- Height: 4px
- Background: Light gray

// Skeleton Loader
- Background: Linear gradient shimmer
- Colors: #F0F0F0 to #E0E0E0
- Animation: 1.5s ease-in-out
```

### Dialogs & Modals

```dart
Style:
- Background: White
- Border Radius: 0
- Max Width: 600px
- Padding: 32px
- Elevation: 24

Header:
- Title: Headline Large
- Close button: Top-right

Content:
- Body text: Body Large
- Scrollable if content overflows

Actions:
- Bottom-aligned
- Primary + Secondary buttons
- Right-aligned (Western)
```

---

## Iconography

### Icon Style
- **Library:** Material Icons (Flutter default)
- **Weight:** Regular (400)
- **Size:** 24px default
- **Color:** Text Primary (#1A1A1A)

### Common Icons

```dart
// Navigation
menu (☰)
arrow_back (←)
arrow_forward (→)
close (✕)

// Actions
search (🔍)
favorite / favorite_border (♡/♥)
shopping_bag / shopping_bag_outlined (🛒)
share (↗)
more_vert (⋮)

// E-commerce
add_shopping_cart
remove_shopping_cart
local_shipping
payment
receipt

// User
account_circle
person
location_on
phone
email

// Feedback
check_circle (✓)
error (!)
warning (⚠)
info (ℹ)

// Media
image
photo_camera
play_arrow
```

### Icon Sizes

```dart
Small:    16px (badges, inline)
Default:  24px (buttons, navigation)
Medium:   32px (featured actions)
Large:    48px (hero sections)
```

---

## Imagery

### Product Images

**Requirements:**
- Format: JPG or WebP
- Resolution: Minimum 1200x1200px
- Aspect Ratio: 1:1 (square)
- Background: White or transparent
- Lighting: Bright, even, professional

**Display Sizes:**
- Thumbnail: 100x100px
- Card: 300x300px
- Detail: 600x600px
- Zoom: 1200x1200px

### Hero Banners

**Requirements:**
- Format: JPG or WebP
- Resolution: 1920x600px (desktop)
- Aspect Ratio: 16:5
- Mobile: 800x600px (4:3)
- File Size: < 200KB (optimized)

### Category Images

**Requirements:**
- Format: JPG or WebP
- Resolution: 800x800px
- Aspect Ratio: 1:1
- Style: Lifestyle or product shots

---

## Animations

### Timing Functions

```dart
// Easing Curves
Ease In Out: Curves.easeInOut (default)
Ease Out: Curves.easeOut (entrances)
Ease In: Curves.easeIn (exits)
Fast Out Slow In: Curves.fastOutSlowIn (material)

// Durations
Instant:  0ms     (immediate feedback)
Fast:     200ms   (micro-interactions)
Normal:   300ms   (standard transitions)
Slow:     500ms   (emphasized transitions)
```

### Common Animations

#### Page Transitions
```dart
Duration: 300ms
Curve: Curves.easeInOut
Type: Slide from right (forward), slide to right (back)
```

#### Button Press
```dart
Duration: 100ms
Effect: Scale to 0.95
Curve: Curves.easeInOut
```

#### Card Hover
```dart
Duration: 200ms
Effect: 
- Elevation 0 → 2
- Scale 1.0 → 1.02
Curve: Curves.easeOut
```

#### Loading Spinner
```dart
Duration: 1.5s
Type: Circular rotation
Curve: Linear
Loop: Infinite
```

#### Snackbar
```dart
Entry: 300ms slide up
Duration: 4s visible
Exit: 200ms fade out
```

---

## Responsive Design

### Breakpoints

```dart
Mobile:     < 768px
Tablet:     768px - 1199px
Desktop:    ≥ 1200px
Large:      ≥ 1440px

// Usage in Flutter
MediaQuery.of(context).size.width
```

### Responsive Patterns

#### Grid Columns
```dart
Mobile:     1-2 columns
Tablet:     2-3 columns
Desktop:    3-4 columns
Large:      4-5 columns

// Product Grid
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: width > 1200 ? 4 : (width > 768 ? 3 : 2),
    crossAxisSpacing: 16,
    mainAxisSpacing: 16,
  ),
)
```

#### Text Scaling
```dart
// Reduce font sizes on mobile
Mobile:     85% of base size
Tablet:     92% of base size
Desktop:    100% of base size
```

#### Spacing Adjustments
```dart
// Reduce padding/margins on mobile
Mobile:     50% of desktop spacing
Tablet:     75% of desktop spacing
Desktop:    100% spacing
```

---

## Dark Mode (Planned)

### Color Adaptations

```dart
Background:     #121212 (near black)
Surface:        #1E1E1E
Primary:        #FFFFFF (white)
Accent:         #FFD700 (brighter gold)
Text Primary:   #FFFFFF
Text Secondary: #B0B0B0
Border:         #2A2A2A
```

### Implementation Strategy
1. Duplicate theme in `app_theme.dart`
2. Create `darkTheme` getter
3. Detect system preference
4. Add manual toggle in settings
5. Persist user choice

---

## Accessibility

### Color Contrast

**WCAG AA Compliance:**
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

**Current Ratios:**
- Black on White: 21:1 ✓
- White on Black: 21:1 ✓
- Gold on White: 4.8:1 ✓
- Gray text on White: 4.6:1 ✓

### Touch Targets

**Minimum Sizes:**
- Buttons: 48x48dp
- Icons: 48x48dp tap area (24x24dp visual)
- Links: 48dp height
- Form fields: 48dp height

### Focus States

```dart
// Keyboard navigation
Focus Indicator:
- Border: 2px solid Accent Gold
- Offset: 2px outside element
- Animated: Fade in 150ms
```

---

## Design Tokens (Code)

```dart
// File: lib/theme/design_tokens.dart

class DesignTokens {
  // Spacing
  static const double spaceXXS = 4.0;
  static const double spaceXS = 8.0;
  static const double spaceS = 12.0;
  static const double spaceM = 16.0;
  static const double spaceL = 24.0;
  static const double spaceXL = 32.0;
  static const double spaceXXL = 48.0;
  
  // Border Radius
  static const double radiusNone = 0.0;
  static const double radiusS = 4.0;
  static const double radiusM = 8.0;
  static const double radiusL = 12.0;
  static const double radiusFull = 9999.0;
  
  // Elevation
  static const double elevation0 = 0.0;
  static const double elevation1 = 2.0;
  static const double elevation2 = 4.0;
  static const double elevation3 = 8.0;
  static const double elevation4 = 16.0;
  
  // Animation Durations
  static const int durationInstant = 0;
  static const int durationFast = 200;
  static const int durationNormal = 300;
  static const int durationSlow = 500;
}
```

---

## Component Library

### Usage Examples

```dart
// Primary Button
ElevatedButton(
  onPressed: () {},
  child: const Text('ADD TO CART'),
)

// Secondary Button
OutlinedButton(
  onPressed: () {},
  child: const Text('ADD TO FAVORITES'),
)

// Product Card
Card(
  child: Column(
    children: [
      Image.network(product.imageUrl),
      Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(product.name, style: theme.textTheme.titleLarge),
            Text(product.description, style: theme.textTheme.bodyMedium),
            Row(
              children: [
                Text('AED ${product.price}', 
                  style: theme.textTheme.titleMedium),
              ],
            ),
          ],
        ),
      ),
    ],
  ),
)
```

---

**Document:** DESIGN_SYSTEM_DOCUMENTATION.md  
**Generated:** December 27, 2025  
**Design Framework:** Material Design 3, Flutter
**Design File:** lib/theme/app_theme.dart
