# Sitemap & User Flow Documentation
## Navigation Structure and User Journeys

**Application:** Solo E-Commerce Platform  
**Version:** 1.0.0  
**Last Updated:** December 27, 2025

---

## Table of Contents

1. [Site Map](#site-map)
2. [Navigation Structure](#navigation-structure)
3. [User Flows](#user-flows)
4. [Page Relationships](#page-relationships)
5. [Deep Linking](#deep-linking)

---

## Site Map

### Visual Site Structure

```
┌──────────────────────────────────────────────────────────┐
│                      Home Screen                          │
│                   (Landing Page)                          │
│                 http://localhost:5000                     │
└────────────────────┬─────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┬──────────────────────┬────────────┐
     │               │               │                      │            │
     ▼               ▼               ▼                      ▼            ▼
┌─────────┐    ┌─────────┐    ┌──────────┐         ┌───────────┐  ┌─────────┐
│ Search  │    │Category │    │ Product  │         │   Cart    │  │Favorites│
│ Screen  │    │ Screen  │    │  Detail  │         │  Screen   │  │ Screen  │
└─────────┘    └────┬────┘    └─────┬────┘         └─────┬─────┘  └─────────┘
                    │               │                     │
                    ▼               ▼                     ▼
              ┌─────────┐    ┌──────────┐         ┌───────────┐
              │ Product │    │  Add to  │         │ Checkout  │
              │  List   │    │   Cart   │         │  Screen   │
              └─────────┘    └──────────┘         └─────┬─────┘
                                                         │
                                                         ▼
                                                  ┌───────────┐
                                                  │  Order    │
                                                  │Confirmation│
                                                  └───────────┘
┌────────────────────────────────────────────────────────────────┐
│                      Drawer Menu                                │
├────────────────────────────────────────────────────────────────┤
│  Quick Actions: Search | Favorites | Orders | Cart             │
│                                                                 │
│  Shop                          My Account                       │
│  ├── Tea & Coffee              ├── My Profile                  │
│  ├── Table                     ├── Order History               │
│  ├── Glass & Stemware          └── Favorites                   │
│  ├── New Arrivals                                              │
│  └── Best Sellers              More                            │
│                                ├── About Us                     │
│                                ├── Contact Us                   │
│                                ├── Help & FAQs                  │
│                                ├── Bulk Orders                  │
│                                ├── Loyalty Program              │
│                                └── Sign Out                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Navigation Structure

### Primary Navigation

#### 1. Top App Bar
**Location:** Fixed at top of all screens  
**Components:**
- **Left:** Hamburger menu icon (opens drawer)
- **Center:** Logo (tap to return home)
- **Right:** 
  - Search icon
  - Favorites icon
  - Cart icon (with badge)

#### 2. Drawer Menu
**Location:** Slides from left  
**Access:** Tap hamburger icon or swipe from left edge

**Sections:**

**Header:**
- User avatar/icon
- "Welcome back!" or "Hello, Guest"

**Quick Actions (4 buttons):**
- 🔍 Search
- ❤️ Favorites
- 📦 Orders
- 🛒 Cart (with item count)

**Shop Section:**
- 🍵 Tea & Coffee → Category Screen
- 🍽️ Table → Category Screen
- 🥂 Glass & Stemware → Category Screen
- ✨ New Arrivals → Product List
- 🔥 Best Sellers → Product List

**My Account Section:**
- 👤 My Profile → My Account Screen
- 📋 My Orders → Order History
- ❤️ Favorites → Favorites Screen

**More Section:**
- ℹ️ About Us → About Us Screen
- 📞 Contact Us → Contact Form
- ❓ Help & FAQs → Help Screen
- 📦 Bulk Orders → Bulk Order Screen
- 🎁 Loyalty Program → Loyalty Screen
- 🚪 Sign Out → Logout

---

### Secondary Navigation

#### Bottom Sheet Modals
Used for quick actions without full navigation:
- **Filter Sheet:** Product filtering options
- **Sort Sheet:** Sorting criteria
- **Size Guide:** Product sizing information
- **Share Sheet:** Social sharing options

#### Floating Action Buttons
- **Back to Top:** Appears after scrolling down
- **Chat Support:** Fixed bottom-right (planned)

---

## User Flows

### 1. Browse & Purchase Flow

```
┌─────────────┐
│   START     │
│  Home Page  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ User Action:                    │
│ • Tap category                  │
│ • Tap featured product          │
│ • Search for product            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────┐
│  Product List   │
│  (Category/     │
│   Search)       │
└──────┬──────────┘
       │
       ├──→ Filter/Sort ──→ Refined Results
       │
       ▼
┌─────────────────┐
│  Tap Product    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Product Detail  │
│ • View images   │
│ • Read specs    │
│ • Check reviews │
└──────┬──────────┘
       │
       ├──→ Add to Favorites
       │
       ▼
┌─────────────────┐
│  Add to Cart    │
└──────┬──────────┘
       │
       ├──→ Continue Shopping ──→ Back to List
       │
       ▼
┌─────────────────┐
│   View Cart     │
│ • Adjust qty    │
│ • Remove items  │
│ • Apply promo   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Proceed to      │
│   Checkout      │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────┐
│ Checkout Steps:             │
│ 1. Shipping Address         │
│ 2. Billing Address          │
│ 3. Payment Method           │
│ 4. Review Order             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────┐
│  Place Order    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Confirmation   │
│  • Order #      │
│  • Receipt      │
│  • Track link   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│      END        │
│  Order Placed   │
└─────────────────┘
```

**Estimated Time:** 3-5 minutes  
**Steps:** 8-10 clicks/taps  
**Exit Points:** 
- Home button (anytime)
- Cart abandonment
- Checkout abandonment

---

### 2. New User Registration Flow

```
┌─────────────┐
│   START     │
│  Any Page   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Trigger:                │
│ • Tap "Sign In" in      │
│   drawer               │
│ • Try to checkout       │
│ • Try to favorite item  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│  Login Screen   │
└──────┬──────────┘
       │
       ├──→ Have account? → Login
       │
       ▼
┌─────────────────┐
│ "Create Account"│
│     Button      │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│  Sign Up Screen         │
│  Form Fields:           │
│  • First Name           │
│  • Last Name            │
│  • Email                │
│  • Phone (optional)     │
│  • Password             │
│  • Confirm Password     │
│  • Accept Terms ☑       │
│  • Marketing Opt-in ☐   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│ Validation:     │
│ • Email unique  │
│ • Password      │
│   strength      │
│ • Required      │
│   fields        │
└──────┬──────────┘
       │
       ├──→ Errors? → Show inline validation
       │
       ▼
┌─────────────────┐
│ Submit Form     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│ Backend:                │
│ • Create user record    │
│ • Hash password         │
│ • Generate JWT tokens   │
│ • Send welcome email    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│ Auto-Login      │
│ • Store tokens  │
│ • Update state  │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│ Welcome Screen          │
│ • Success message       │
│ • Quick tour (optional) │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│      END        │
│ Redirect to     │
│ original page   │
└─────────────────┘
```

**Estimated Time:** 2-3 minutes  
**Fields:** 6-8 form fields  
**Validation:** Real-time inline validation

---

### 3. Search Flow

```
┌─────────────┐
│   START     │
│  Any Page   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Tap Search Icon │
│  in App Bar     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│  Search Screen Opens    │
│  • Search bar focused   │
│  • Keyboard appears     │
│  • Recent searches      │
│  • Trending searches    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│ User Types      │
│ Search Query    │
└──────┬──────────┘
       │
       ├──→ Empty? → Show suggestions
       │
       ▼
┌─────────────────────────┐
│ Live Search:            │
│ • After 2+ characters   │
│ • Debounced 300ms       │
│ • Search API call       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Display Results:        │
│ • Product count         │
│ • Product grid          │
│ • Filter button         │
│ • Sort button           │
└──────┬──────────────────┘
       │
       ├──→ No results? → Suggestions
       │
       ▼
┌─────────────────────────┐
│ User Actions:           │
│ • Tap product           │
│ • Apply filters         │
│ • Change sort order     │
│ • Refine search         │
└──────┬──────────────────┘
       │
       ├──→ Tap Product → Product Detail
       │
       ├──→ Refine Search → Back to input
       │
       ▼
┌─────────────────┐
│      END        │
│ Found Product   │
└─────────────────┘
```

**Estimated Time:** 30 seconds - 2 minutes  
**Search Features:**
- Autocomplete
- Spell correction
- Fuzzy matching
- Category filtering
- Price range filtering
- Brand filtering

---

### 4. Order Tracking Flow

```
┌─────────────┐
│   START     │
│  Any Page   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Access Points:          │
│ • Drawer → Orders       │
│ • My Account → Orders   │
│ • Email link            │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Order History Screen    │
│ • List of orders        │
│ • Status badges         │
│ • Order date            │
│ • Total amount          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│ Tap Order       │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────┐
│ Order Detail Screen         │
│ • Order number              │
│ • Status timeline:          │
│   ✓ Pending                 │
│   ✓ Confirmed               │
│   → Shipped (current)       │
│   ○ Delivered               │
│ • Items ordered             │
│ • Shipping address          │
│ • Payment method            │
│ • Tracking number           │
└──────┬──────────────────────┘
       │
       ├──→ Cancel Order (if pending)
       │
       ├──→ Download Invoice
       │
       ├──→ Track Shipment → External carrier site
       │
       ├──→ Reorder → Add all items to cart
       │
       ▼
┌─────────────────┐
│      END        │
│ Order Info      │
│ Displayed       │
└─────────────────┘
```

**Order Statuses:**
1. **Pending** - Order placed, awaiting confirmation
2. **Confirmed** - Order confirmed, preparing shipment
3. **Shipped** - Order shipped, in transit
4. **Delivered** - Order delivered to customer
5. **Cancelled** - Order cancelled (by customer or system)

---

### 5. Favorites/Wishlist Flow

```
┌─────────────┐
│   START     │
│ Product     │
│ Detail or   │
│ List        │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Tap Heart Icon  │
└──────┬──────────┘
       │
       ├──→ Not logged in? → Redirect to login
       │
       ▼
┌─────────────────────────┐
│ Add to Favorites:       │
│ • API call              │
│ • Update state          │
│ • Show snackbar         │
│ • Heart icon fills      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Access Favorites:       │
│ • Tap heart in app bar  │
│ • Drawer → Favorites    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Favorites Screen        │
│ • Grid of saved items   │
│ • Remove button         │
│ • Add to cart button    │
│ • Share button          │
│ • Sort options          │
└──────┬──────────────────┘
       │
       ├──→ Remove from favorites
       │
       ├──→ Add to cart
       │
       ├──→ Tap product → Product Detail
       │
       ▼
┌─────────────────┐
│      END        │
│ Manage          │
│ Favorites       │
└─────────────────┘
```

**Empty State:**
- "No favorites yet"
- "Start browsing to save items"
- [Browse Products] button

---

## Page Relationships

### Parent-Child Hierarchy

```
Home (Parent)
├── Category (Child)
│   └── Product List (Child)
│       └── Product Detail (Child)
├── Search (Child)
│   └── Search Results (Child)
│       └── Product Detail (Child)
├── Cart (Child)
│   └── Checkout (Child)
│       └── Order Confirmation (Child)
├── Favorites (Child)
│   └── Product Detail (Child)
├── My Account (Child)
│   ├── Profile Edit (Child)
│   ├── Order History (Child)
│   │   └── Order Detail (Child)
│   └── Addresses (Child)
│       ├── Add Address (Child)
│       └── Edit Address (Child)
├── About Us (Child)
├── Bulk Orders (Child)
├── Loyalty Program (Child)
└── Sign Up / Login (Child)
```

---

### Cross-linking

**Product Detail Screen** links to:
- Related products (horizontal scroll)
- Same category products
- Same brand products
- Add to cart → Cart Screen
- Add to favorites → Favorites Screen
- Share → Native share sheet

**Cart Screen** links to:
- Product Detail (tap product)
- Continue Shopping → Home
- Checkout → Checkout Screen
- Promo codes → Promo modal

**My Account** links to:
- Edit Profile
- Order History → Order Detail
- Addresses → Add/Edit Address
- Change Password
- Logout → Home (cleared state)

---

## Deep Linking

### URL Structure (Planned)

```
# Home
/

# Categories
/category/:categoryId
/category/:categoryId/:subcategoryId

# Products
/products
/products?search=teapot
/products?category=tea-coffee
/products?brand=eva-solo
/product/:productId
/product/:sku

# Cart & Checkout
/cart
/checkout

# User
/account
/account/profile
/account/orders
/account/orders/:orderId
/account/favorites
/account/addresses

# Static Pages
/about
/contact
/help
/bulk-orders
/loyalty

# Auth
/login
/signup
/forgot-password
/reset-password/:token
```

### Navigation Patterns

**Stack Navigation:**
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => NewScreen(),
  ),
);
```

**Replace Navigation:**
```dart
Navigator.pushReplacement(
  context,
  MaterialPageRoute(
    builder: (context) => NewScreen(),
  ),
);
```

**Pop to Root:**
```dart
Navigator.popUntil(context, (route) => route.isFirst);
```

**Named Routes (Future Implementation):**
```dart
Navigator.pushNamed(context, '/product', arguments: productId);
```

---

## Mobile-Specific Behaviors

### Gestures

**Swipe Actions:**
- Swipe left edge: Open drawer
- Swipe right: Navigate back
- Pull down: Refresh page
- Pinch zoom: Image gallery

**Long Press:**
- Product card: Quick view modal
- Cart item: Delete confirmation

### Bottom Navigation
Currently not implemented, but planned:
```
┌─────┬─────┬─────┬─────┬─────┐
│ Home│ Shop│ Cart│ Fav │ Me  │
└─────┴─────┴─────┴─────┴─────┘
```

---

## User Journey Analytics

### Key Metrics to Track

**Navigation Metrics:**
- Most visited pages
- Average time per page
- Bounce rate per page
- Exit pages

**Conversion Funnel:**
1. Home → 100%
2. Product Detail → 60%
3. Add to Cart → 40%
4. Checkout → 30%
5. Order Placed → 25%

**Drop-off Points:**
- Product Detail (40% leave)
- Cart (25% leave)
- Checkout Address (15% leave)
- Payment (5% leave)

---

## Accessibility Navigation

### Keyboard Navigation
- Tab: Next focusable element
- Shift+Tab: Previous element
- Enter: Activate button/link
- Escape: Close modal/drawer
- Arrow keys: Navigate lists

### Screen Reader
- Proper heading hierarchy
- ARIA labels on interactive elements
- Focus management on navigation
- Announcements for state changes

---

## Error States & Recovery

### Navigation Errors

**404 - Page Not Found:**
- Show friendly error message
- "Return to Home" button
- Search bar to find products
- Popular categories list

**Network Error:**
- Show offline message
- Retry button
- Cached content display
- "Browse offline" mode

**Session Expired:**
- Auto-logout
- Save current page
- Redirect to login
- Return to saved page after login

---

**Document:** SITEMAP_USER_FLOW_DOCUMENTATION.md  
**Generated:** December 27, 2025  
**Total Screens:** 12 primary screens
**Total Flows:** 5+ major user journeys
