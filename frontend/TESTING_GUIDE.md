# Provider Testing Guide

## Quick Start

### 1. Start Backend
```bash
cd backend
npm run start:dev
```

Backend should be running on `http://localhost:3000`

### 2. Start Frontend
```bash
cd frontend
flutter run -d chrome
```

---

## Testing the Home Screen

### Expected Behavior

**On Initial Load:**
1. Three sections load in parallel:
   - Featured Products (8 items)
   - Best Sellers (8 items)  
   - New Arrivals (8 items)

2. **Loading State**: Each section shows a centered `CircularProgressIndicator` in black

3. **Success State**: Products display in responsive grid
   - Mobile (< 600px): 2 columns
   - Tablet (600-900px): 3 columns
   - Desktop (> 900px): 4 columns

4. **Error State**: Shows error icon, message, and "Try Again" button

5. **Empty State**: Shows "No [section] available" message

### Manual Testing Steps

1. **Test Normal Load:**
   - Open app
   - Verify all three sections load and display products
   - Check that products have images, names, prices
   - Verify "Add to Cart" buttons work

2. **Test Loading States:**
   - Throttle network in Chrome DevTools (Slow 3G)
   - Reload page
   - Verify loading spinners appear

3. **Test Error States:**
   - Stop backend server
   - Reload frontend
   - Verify error messages appear
   - Click "Try Again" buttons
   - Restart backend
   - Verify products load after retry

4. **Test Product Cards:**
   - Click on a product card
   - Verify navigation to product detail page
   - Click "Add to Cart" on a product
   - Verify toast/snackbar appears

5. **Test Responsive Layout:**
   - Resize browser window
   - Verify grid adjusts columns correctly
   - Test on mobile device emulator

---

## Testing ProductListProvider

### Create Test Screen

```dart
// lib/screens/test_product_list_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/product_list_provider.dart';
import '../models/product_dto_extension.dart';
import '../widgets/product_card.dart';

class TestProductListScreen extends StatefulWidget {
  const TestProductListScreen({super.key});

  @override
  State<TestProductListScreen> createState() => _TestProductListScreenState();
}

class _TestProductListScreenState extends State<TestProductListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductListProvider>().loadProducts(
            page: 1,
            limit: 20,
            sortBy: 'newest',
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Test Product List'),
        actions: [
          // Sort dropdown
          Consumer<ProductListProvider>(
            builder: (context, provider, child) {
              return DropdownButton<String>(
                value: provider.sortBy ?? 'newest',
                items: const [
                  DropdownMenuItem(value: 'newest', child: Text('Newest')),
                  DropdownMenuItem(value: 'price_low', child: Text('Price: Low')),
                  DropdownMenuItem(value: 'price_high', child: Text('Price: High')),
                ],
                onChanged: (value) {
                  provider.loadProducts(sortBy: value, refresh: true);
                },
              );
            },
          ),
        ],
      ),
      body: Consumer<ProductListProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.products.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64),
                  const SizedBox(height: 16),
                  Text(provider.errorMessage ?? 'Unknown error'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadProducts(refresh: true),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (provider.isEmpty) {
            return const Center(child: Text('No products found'));
          }

          final products = provider.products.toProducts();

          return Column(
            children: [
              // Pagination info
              if (provider.pagination != null)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    'Page ${provider.currentPage} of ${provider.pagination!.totalPages} '
                    '(${provider.pagination!.total} total)',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),

              // Product grid
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    return ProductCard(
                      product: products[index],
                      onTap: () {},
                      onAddToCart: () {},
                    );
                  },
                ),
              ),

              // Load more button
              if (provider.pagination != null &&
                  provider.currentPage < provider.pagination!.totalPages)
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: ElevatedButton(
                    onPressed: provider.isLoading ? null : () => provider.loadNextPage(),
                    child: provider.isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Load More'),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
```

### Testing Steps

1. **Test Initial Load:**
   - Navigate to test screen
   - Verify 20 products load
   - Check pagination info shows correctly

2. **Test Sorting:**
   - Change sort to "Price: Low"
   - Verify products reload and reorder
   - Change to "Price: High"
   - Verify products reorder

3. **Test Pagination:**
   - Scroll to bottom
   - Click "Load More"
   - Verify next 20 products append
   - Check pagination info updates

4. **Test Filtering:** (Add filter UI)
   ```dart
   // Add price filter
   provider.loadProducts(
     minPrice: 100,
     maxPrice: 500,
     refresh: true,
   );
   ```

---

## Testing ProductDetailsProvider

### Create Test Screen

```dart
// lib/screens/test_product_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/product_details_provider.dart';
import '../models/product_dto_extension.dart';

class TestProductDetailScreen extends StatefulWidget {
  final String productId;

  const TestProductDetailScreen({
    super.key,
    required this.productId,
  });

  @override
  State<TestProductDetailScreen> createState() => _TestProductDetailScreenState();
}

class _TestProductDetailScreenState extends State<TestProductDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductDetailsProvider>().loadProduct(widget.productId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Test Product Details')),
      body: Consumer<ProductDetailsProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64),
                  const SizedBox(height: 16),
                  Text(provider.errorMessage ?? 'Unknown error'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadProduct(widget.productId),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (!provider.hasProduct) {
            return const Center(child: Text('Product not found'));
          }

          final product = provider.product!.toProduct();
          final relatedProducts = provider.relatedProducts.toProducts();

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product image
                if (product.imageUrl.isNotEmpty)
                  Image.network(
                    product.imageUrl,
                    height: 300,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),

                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'AED ${product.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(product.description),
                    ],
                  ),
                ),

                // Related products
                if (relatedProducts.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text(
                      'Related Products',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ),
                  SizedBox(
                    height: 200,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: relatedProducts.length,
                      itemBuilder: (context, index) {
                        final related = relatedProducts[index];
                        return Container(
                          width: 150,
                          margin: const EdgeInsets.symmetric(horizontal: 8),
                          child: Column(
                            children: [
                              Image.network(
                                related.imageUrl,
                                height: 120,
                                width: 150,
                                fit: BoxFit.cover,
                              ),
                              Text(
                                related.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
```

### Testing Steps

1. **Test Product Load:**
   - Navigate with valid product ID
   - Verify product details load
   - Check image, name, price, description display

2. **Test Related Products:**
   - Verify related products section appears
   - Check up to 6 related products shown
   - Verify related products are different from main product

3. **Test Invalid Product:**
   - Navigate with invalid product ID
   - Verify error state appears
   - Check error message is clear

---

## Console Debugging

### Enable Debug Logging

All providers log errors to console:

```dart
debugPrint('HomeProvider: Error loading featured products: $e');
```

### Check Network Requests

In Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for requests to `http://localhost:3000/api/products/...`
5. Check request/response

### Expected API Calls

**Home Screen:**
- `GET /api/products/featured?limit=8`
- `GET /api/products/best-sellers?limit=8`
- `GET /api/products/new-arrivals?limit=8`

**Product List:**
- `GET /api/products?page=1&limit=20&sortBy=newest`

**Product Details:**
- `GET /api/products/:id`
- `GET /api/products/:id/related?limit=6`

---

## Common Issues

### Issue: "No products available"

**Possible Causes:**
1. Backend not running
2. Backend database empty
3. API endpoint returning empty array

**Debug:**
```bash
# Check backend is running
curl http://localhost:3000/api/products/featured

# Should return JSON with products array
```

### Issue: Loading spinners never stop

**Possible Causes:**
1. API request hangs
2. Error thrown before status update
3. Network timeout

**Debug:**
- Check Network tab in DevTools
- Look for failed/pending requests
- Check console for error messages

### Issue: "Failed to load" error

**Possible Causes:**
1. Backend not running
2. CORS error
3. Network error
4. API returning 500 error

**Debug:**
- Check backend console for errors
- Check browser console for CORS errors
- Verify backend CORS allows `http://localhost:*`

---

## Performance Testing

### Test Parallel Loading

Home screen loads 3 endpoints in parallel:

```dart
await Future.wait([
  loadFeatured(limit: 8),
  loadBestSellers(limit: 8),
  loadNewArrivals(limit: 8),
]);
```

**Expected:**
- All 3 requests fire simultaneously
- Total time ≈ slowest individual request
- Not 3x individual request time

**Verify:**
1. Open Network tab
2. Reload page
3. Check timestamps of 3 product API calls
4. They should all start within ~10ms of each other

### Test Pagination Performance

**Expected:**
- "Load More" button appends products
- No page flicker or flash
- Smooth scroll after load

**Test:**
1. Load initial 20 products
2. Scroll to bottom
3. Click "Load More"
4. Verify products append without scroll jump

---

## API Response Debugging

### Successful Response Structure

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 145.00,
      "imageUrl": "https://...",
      ...
    }
  ],
  "meta": {
    "total": 805,
    "page": 1,
    "limit": 20,
    "totalPages": 41
  }
}
```

### Error Response Structure

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

## Next Steps After Testing

1. ✅ Verify home screen loads successfully
2. ✅ Test error states work correctly
3. ✅ Test sorting and filtering
4. ✅ Test pagination
5. ✅ Test product details page
6. ⬜ Add loading skeletons (instead of spinners)
7. ⬜ Add pull-to-refresh on home screen
8. ⬜ Add product search screen
9. ⬜ Add category products screen
10. ⬜ Optimize image loading with caching

---

**Testing Date:** December 28, 2025  
**Backend API:** http://localhost:3000  
**Frontend:** http://localhost:5000 (or Flutter port)
