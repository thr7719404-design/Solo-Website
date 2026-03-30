# Frontend Architecture Documentation
## Flutter Web Application

**Framework:** Flutter 3.38.4  
**Language:** Dart  
**Pattern:** Provider State Management  
**UI Framework:** Material Design 3

---

## Table of Contents

1. [Application Structure](#application-structure)
2. [Screens & Pages](#screens--pages)
3. [Widgets & Components](#widgets--components)
4. [State Management](#state-management)
5. [Navigation & Routing](#navigation--routing)
6. [Models & Data](#models--data)
7. [Theme & Styling](#theme--styling)
8. [Code Examples](#code-examples)

---

## Application Structure

### Directory Layout

```
frontend/lib/
├── main.dart                    # App entry point
├── app.dart                     # Root app widget (SoloApp)
│
├── screens/                     # All screen widgets (12 screens)
│   ├── home_screen.dart         # Main landing page
│   ├── product_detail_screen.dart
│   ├── category_screen.dart
│   ├── search_screen.dart
│   ├── cart_screen.dart
│   ├── checkout_screen.dart
│   ├── my_account_screen.dart
│   ├── favorites_screen.dart
│   ├── about_us_screen.dart
│   ├── bulk_order_screen.dart
│   ├── loyalty_program_screen.dart
│   └── signup_screen.dart
│
├── widgets/                     # Reusable components
│   ├── modern_drawer.dart       # Navigation drawer
│   ├── hero_banner.dart         # Hero carousel
│   ├── top_banner.dart          # Top promotional banner
│   ├── product_card.dart        # Product display card
│   ├── category_card.dart       # Category display
│   └── footer.dart              # App footer
│
├── models/                      # Data models
│   ├── product.dart             # Product model
│   ├── category.dart            # Category model
│   └── cart_item.dart           # Cart item model
│
├── providers/                   # State management
│   └── cart_provider.dart       # Cart state provider
│
├── theme/                       # App theming
│   └── app_theme.dart           # Theme definitions
│
├── data/                        # Static data
│   └── mock_data.dart           # Mock data for development
│
└── services/                    # API services (future)
    └── api_service.dart         # HTTP client service (planned)
```

### File Organization Philosophy

- **Screens**: Full-page views with their own scaffold
- **Widgets**: Reusable components used across screens
- **Models**: Data structures representing business entities
- **Providers**: State management using Provider pattern
- **Theme**: Centralized styling and design tokens
- **Data**: Mock data for development/testing

---

## Screens & Pages

### 1. Home Screen
**File:** `home_screen.dart`  
**Route:** `/` (default)  
**Purpose:** Main landing page with product discovery

#### Features:
- Top promotional banner
- Logo-based app bar with search, favorites, cart icons
- Hero banner carousel (3 rotating banners)
- Featured category boxes (4 clickable categories)
- "Shop by Category" section with expandable categories
- "Top Sellers" product grid
- "New Arrivals" product grid
- "Special Offers" product grid
- Footer with contact info and social links

#### Key Widgets:
```dart
CustomScrollView with Slivers:
- SliverToBoxAdapter (TopBanner)
- SliverAppBar (Logo, menu, actions)
- SliverToBoxAdapter (HeroBanner)
- SliverToBoxAdapter (Featured categories)
- SliverToBoxAdapter (Category sections)
- SliverGrid (Product grids)
- SliverToBoxAdapter (Footer)
```

#### State Management:
```dart
State<HomeScreen> {
  int _cartItemCount = 0;
  List<Product> _cartItems = [];
  bool _categoriesExpanded = false;
  bool _topSellersExpanded = false;
  bool _newArrivalsExpanded = false;
  bool _specialOffersExpanded = false;
}
```

---

### 2. Product Detail Screen
**File:** `product_detail_screen.dart`  
**Route:** Pushed via Navigator  
**Purpose:** Detailed product information and purchase

#### Features:
- Product image gallery
- Product name and SKU
- Detailed description
- Price display (RRP, VAT inclusive)
- Quantity selector
- Add to cart button
- Product specifications
- Related products section

#### Navigation:
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ProductDetailScreen(product: product),
  ),
);
```

---

### 3. Category Screen
**File:** `category_screen.dart`  
**Route:** Pushed with category parameter  
**Purpose:** Browse products by category

#### Features:
- Category header with name and description
- Filter and sort options
- Product grid view
- Subcategory filtering
- Price range filters
- Brand filters

#### URL Pattern:
```dart
CategoryScreen(
  categoryId: 1,
  categoryName: "Tea & Coffee"
)
```

---

### 4. Search Screen
**File:** `search_screen.dart`  
**Route:** Pushed via Navigator  
**Purpose:** Search products by keyword

#### Features:
- Search bar with autocomplete
- Recent searches
- Search suggestions
- Filtered results
- Quick filters (category, price, brand)
- Result count display

#### Search Flow:
1. User taps search icon
2. SearchScreen opens
3. User types query
4. Results update in real-time
5. User can filter/sort results
6. Tap product to view details

---

### 5. Cart Screen
**File:** `cart_screen.dart`  
**Route:** Pushed via Navigator  
**Purpose:** Review and manage cart items

#### Features:
- List of cart items with images
- Quantity adjustment controls
- Remove item buttons
- Subtotal calculation
- VAT calculation
- Total price display
- Proceed to checkout button
- Empty cart state

#### Cart Item Display:
```dart
ListView.builder(
  itemCount: cartItems.length,
  itemBuilder: (context, index) {
    return CartItemWidget(
      item: cartItems[index],
      onQuantityChanged: _updateQuantity,
      onRemove: _removeItem,
    );
  }
)
```

---

### 6. Checkout Screen
**File:** `checkout_screen.dart`  
**Route:** Pushed from Cart Screen  
**Purpose:** Complete purchase

#### Features:
- Shipping address form
- Billing address (same or different)
- Payment method selection
- Order summary
- Terms acceptance
- Place order button

#### Checkout Steps:
1. Review cart items
2. Enter/select shipping address
3. Enter/select billing address
4. Choose payment method
5. Review order summary
6. Place order

---

### 7. My Account Screen
**File:** `my_account_screen.dart`  
**Route:** Pushed from Drawer  
**Purpose:** User profile and account management

#### Sections:
- **Profile Information**
  - Name, email, phone
  - Edit profile button
  
- **Order History**
  - Past orders list
  - Order status tracking
  
- **Saved Addresses**
  - Shipping addresses
  - Billing addresses
  
- **Account Settings**
  - Password change
  - Email preferences
  - Notifications
  
- **Logout Button**

---

### 8. Favorites Screen
**File:** `favorites_screen.dart`  
**Route:** Pushed from Drawer/Header  
**Purpose:** Saved/wishlist products

#### Features:
- Grid of favorite products
- Remove from favorites button
- Quick add to cart
- Empty state with browse suggestion
- Sort options (date added, price, name)

---

### 9. About Us Screen
**File:** `about_us_screen.dart`  
**Route:** Pushed from Drawer  
**Purpose:** Company information

#### Content:
- Company story and mission
- Brand values
- Team information
- Store locations
- Contact information
- Social media links

---

### 10. Bulk Order Screen
**File:** `bulk_order_screen.dart`  
**Route:** Pushed from Drawer  
**Purpose:** Wholesale/business orders

#### Features:
- Bulk order form
- Company information fields
- Special pricing inquiry
- Minimum order quantities
- Contact sales team button
- Upload requirements document

---

### 11. Loyalty Program Screen
**File:** `loyalty_program_screen.dart`  
**Route:** Pushed from Drawer  
**Purpose:** Customer rewards program

#### Features:
- Program benefits overview
- Points balance display
- Points history
- Rewards catalog
- Tier status
- How to earn points
- Redeem points interface

---

### 12. Sign Up Screen
**File:** `signup_screen.dart`  
**Route:** Pushed from Login/Drawer  
**Purpose:** New user registration

#### Form Fields:
- First name
- Last name
- Email address
- Phone number
- Password (with strength indicator)
- Confirm password
- Terms & conditions checkbox
- Marketing consent checkbox
- Create account button
- Link to login screen

---

## Widgets & Components

### 1. Modern Drawer
**File:** `modern_drawer.dart`  
**Purpose:** Main navigation menu

#### Structure:
```dart
Drawer(
  child: ListView(
    children: [
      _buildModernHeader(),        // Gradient header without tagline
      _buildQuickActions(),        // Search | Favorites | Orders | Cart
      _buildMenuSection(title, items),
      // Sections:
      // - Shop (Categories, New Arrivals, Best Sellers)
      // - My Account (Profile, Orders, Favorites)
      // - More (About Us, Contact, Help, Bulk Orders)
      _buildFooter(),              // Version & social links
    ],
  )
)
```

#### Quick Actions:
- **Search**: Opens search screen
- **Favorites**: Opens favorites screen
- **Orders**: Opens order history
- **Cart**: Opens cart screen (with badge)

#### Design:
- Gradient header (blue to purple)
- Icons with labels
- Organized sections with dividers
- Clean, modern aesthetic

---

### 2. Hero Banner
**File:** `hero_banner.dart`  
**Purpose:** Rotating promotional banners

#### Features:
- Auto-rotating carousel (5 second intervals)
- Manual swipe navigation
- Dot indicators for current slide
- Smooth page transitions
- Responsive image sizing

#### Implementation:
```dart
PageView.builder(
  controller: _pageController,
  itemCount: banners.length,
  itemBuilder: (context, index) {
    return Image.network(
      banners[index].imageUrl,
      fit: BoxFit.cover,
    );
  }
)
```

#### Banner Data:
```dart
class BannerModel {
  final String imageUrl;
  final String title;
  final String? link;
}
```

---

### 3. Product Card
**File:** `product_card.dart`  
**Purpose:** Display product in grid/list

#### Layout:
```
┌─────────────────────┐
│   Product Image     │
├─────────────────────┤
│ Product Name        │
│ Short Description   │
│ ★★★★☆ (4.5)        │
│ AED 99.00          │
│ [Add to Cart]       │
└─────────────────────┘
```

#### Props:
```dart
ProductCard({
  required Product product,
  required VoidCallback onAddToCart,
  VoidCallback? onTap,
  bool showQuickView = false,
})
```

#### Interactions:
- Tap card: Open product detail
- Tap "Add to Cart": Add item with snackbar confirmation
- Tap heart icon: Toggle favorite
- Hover: Show quick view (desktop)

---

### 4. Top Banner
**File:** `top_banner.dart`  
**Purpose:** Promotional message bar

#### Content:
- Free shipping message
- Special offers
- Announcement text
- Dismissible
- Background: Black
- Text: White

```dart
Container(
  height: 40,
  color: Colors.black,
  child: Center(
    child: Text(
      "Free Shipping on Orders Over AED 500",
      style: TextStyle(color: Colors.white),
    ),
  ),
)
```

---

### 5. Category Card
**File:** Used in home_screen.dart  
**Purpose:** Featured category display

#### Layout:
```dart
GestureDetector(
  onTap: () => _openCategory(category),
  child: Container(
    decoration: BoxDecoration(
      color: Colors.grey[100],
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      children: [
        Image.network(category.imageUrl),
        Text(category.name),
        Icon(Icons.arrow_forward),
      ],
    ),
  ),
)
```

#### Featured Categories (4 boxes):
1. **Tea & Coffee** - Brewing essentials
2. **To Go** - Portable drinkware
3. **Liquid Lounge** - Bar accessories
4. **Missing** - New additions

---

### 6. Footer
**File:** Used in home_screen.dart  
**Purpose:** Site-wide footer information

#### Sections:
```dart
Row(
  children: [
    _buildFooterColumn("Shop", links),
    _buildFooterColumn("Support", links),
    _buildFooterColumn("Company", links),
    _buildSocialLinks(),
  ]
)
```

#### Content:
- **Shop**: Categories, New Arrivals, Best Sellers
- **Support**: Contact, FAQ, Shipping, Returns
- **Company**: About Us, Careers, Press
- **Social**: Instagram, Facebook, Twitter, LinkedIn
- **Legal**: Privacy Policy, Terms, Cookies
- **Contact**: Email, Phone, Address

---

## State Management

### Provider Pattern

The application uses the **Provider** package for state management.

#### Cart Provider
**File:** `cart_provider.dart`

```dart
class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];
  
  List<CartItem> get items => _items;
  
  int get itemCount => _items.length;
  
  double get totalPrice => _items.fold(
    0, 
    (sum, item) => sum + (item.price * item.quantity)
  );
  
  void addItem(Product product, int quantity) {
    // Check if item exists
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id
    );
    
    if (existingIndex >= 0) {
      // Update quantity
      _items[existingIndex].quantity += quantity;
    } else {
      // Add new item
      _items.add(CartItem(
        product: product,
        quantity: quantity,
      ));
    }
    
    notifyListeners();
  }
  
  void removeItem(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }
  
  void updateQuantity(String productId, int newQuantity) {
    final index = _items.indexWhere(
      (item) => item.product.id == productId
    );
    
    if (index >= 0) {
      if (newQuantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = newQuantity;
      }
      notifyListeners();
    }
  }
  
  void clear() {
    _items.clear();
    notifyListeners();
  }
}
```

#### Usage in Widgets:

```dart
// Provide at root
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => CartProvider(),
      child: const SoloApp(),
    ),
  );
}

// Consume in widgets
class CartScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    
    return Scaffold(
      body: ListView.builder(
        itemCount: cart.items.length,
        itemBuilder: (ctx, i) => CartItemWidget(
          item: cart.items[i],
          onRemove: () => cart.removeItem(cart.items[i].product.id),
        ),
      ),
    );
  }
}

// Add to cart
Consumer<CartProvider>(
  builder: (context, cart, child) {
    return ElevatedButton(
      onPressed: () => cart.addItem(product, 1),
      child: Text('Add to Cart'),
    );
  }
)
```

---

## Navigation & Routing

### Navigation Strategy

The app uses **imperative navigation** with `Navigator.push` and `Navigator.pop`.

#### Basic Navigation:

```dart
// Navigate to screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ProductDetailScreen(product: product),
  ),
);

// Navigate back
Navigator.pop(context);

// Navigate back with data
Navigator.pop(context, result);

// Replace current screen
Navigator.pushReplacement(
  context,
  MaterialPageRoute(builder: (context) => HomeScreen()),
);
```

#### Screen Transitions:

```dart
// Slide transition
Navigator.push(
  context,
  PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) => NextScreen(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: animation.drive(
          Tween(begin: Offset(1.0, 0.0), end: Offset.zero)
            .chain(CurveTween(curve: Curves.easeInOut)),
        ),
        child: child,
      );
    },
  ),
);
```

---

## Models & Data

### Product Model
**File:** `product.dart`

```dart
class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? oldPrice;
  final String imageUrl;
  final List<String> images;
  final String category;
  final String? subcategory;
  final String brand;
  final double rating;
  final int reviewCount;
  final bool inStock;
  final int stockQuantity;
  final List<String> features;
  final Map<String, String> specifications;
  final bool isFeatured;
  final bool isNew;
  final bool isOnSale;
  
  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.oldPrice,
    required this.imageUrl,
    this.images = const [],
    required this.category,
    this.subcategory,
    required this.brand,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.inStock = true,
    this.stockQuantity = 0,
    this.features = const [],
    this.specifications = const {},
    this.isFeatured = false,
    this.isNew = false,
    this.isOnSale = false,
  });
  
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: json['price'].toDouble(),
      oldPrice: json['oldPrice']?.toDouble(),
      imageUrl: json['imageUrl'],
      images: List<String>.from(json['images'] ?? []),
      category: json['category'],
      subcategory: json['subcategory'],
      brand: json['brand'],
      rating: json['rating']?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] ?? 0,
      inStock: json['inStock'] ?? true,
      stockQuantity: json['stockQuantity'] ?? 0,
      features: List<String>.from(json['features'] ?? []),
      specifications: Map<String, String>.from(json['specifications'] ?? {}),
      isFeatured: json['isFeatured'] ?? false,
      isNew: json['isNew'] ?? false,
      isOnSale: json['isOnSale'] ?? false,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'oldPrice': oldPrice,
      'imageUrl': imageUrl,
      'images': images,
      'category': category,
      'subcategory': subcategory,
      'brand': brand,
      'rating': rating,
      'reviewCount': reviewCount,
      'inStock': inStock,
      'stockQuantity': stockQuantity,
      'features': features,
      'specifications': specifications,
      'isFeatured': isFeatured,
      'isNew': isNew,
      'isOnSale': isOnSale,
    };
  }
}
```

### Category Model
**File:** `category.dart`

```dart
class Category {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final String? iconName;
  final int productCount;
  final List<Category>? subcategories;
  
  Category({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    this.iconName,
    this.productCount = 0,
    this.subcategories,
  });
}
```

### Cart Item Model
**File:** `cart_item.dart`

```dart
class CartItem {
  final String id;
  final Product product;
  int quantity;
  final DateTime addedAt;
  
  CartItem({
    String? id,
    required this.product,
    this.quantity = 1,
    DateTime? addedAt,
  })  : id = id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        addedAt = addedAt ?? DateTime.now();
  
  double get totalPrice => product.price * quantity;
  
  CartItem copyWith({
    String? id,
    Product? product,
    int? quantity,
    DateTime? addedAt,
  }) {
    return CartItem(
      id: id ?? this.id,
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      addedAt: addedAt ?? this.addedAt,
    );
  }
}
```

---

## Theme & Styling

### Theme Configuration
**File:** `theme/app_theme.dart`

See **DESIGN_SYSTEM.md** for comprehensive theming documentation.

#### Quick Reference:

```dart
// Colors
AppTheme.primaryColor      // #1A1A1A (Black)
AppTheme.accentColor       // #B8860B (Dark Goldenrod)
AppTheme.backgroundColor   // White
AppTheme.textPrimary       // #1A1A1A
AppTheme.textSecondary     // #666666

// Typography (Work Sans font family)
theme.textTheme.displayLarge   // 48px, light
theme.textTheme.headlineLarge  // 28px, regular
theme.textTheme.titleLarge     // 16px, medium
theme.textTheme.bodyLarge      // 15px, regular

// Spacing
8px, 16px, 24px, 32px, 48px (consistent increments)

// Buttons
ElevatedButton - Black background, white text
OutlinedButton - Black border, transparent background
TextButton - Text only, black color
```

---

## Code Examples

### Screen Template

```dart
import 'package:flutter/material.dart';

class ExampleScreen extends StatefulWidget {
  const ExampleScreen({super.key});

  @override
  State<ExampleScreen> createState() => _ExampleScreenState();
}

class _ExampleScreenState extends State<ExampleScreen> {
  // State variables
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    // Load data
    setState(() => _isLoading = false);
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Example Screen'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildContent(),
    );
  }
  
  Widget _buildContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Content widgets
        ],
      ),
    );
  }
}
```

### Product Grid

```dart
Widget _buildProductGrid(List<Product> products) {
  return GridView.builder(
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 4 : 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 0.7,
    ),
    itemCount: products.length,
    itemBuilder: (context, index) {
      return ProductCard(
        product: products[index],
        onAddToCart: () => _addToCart(products[index]),
        onTap: () => _openProduct(products[index]),
      );
    },
  );
}
```

### Responsive Layout

```dart
Widget _buildResponsiveLayout() {
  return LayoutBuilder(
    builder: (context, constraints) {
      if (constraints.maxWidth > 1200) {
        // Desktop layout
        return _buildDesktopLayout();
      } else if (constraints.maxWidth > 600) {
        // Tablet layout
        return _buildTabletLayout();
      } else {
        // Mobile layout
        return _buildMobileLayout();
      }
    },
  );
}
```

---

**Document:** FRONTEND_ARCHITECTURE.md  
**Generated:** December 27, 2025  
**Framework:** Flutter 3.38.4 Web
