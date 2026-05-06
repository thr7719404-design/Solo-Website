"""
Solo E-Commerce — Features Checklist Generator
Generates a styled Excel workbook with customer & admin feature test checklists.
"""

from openpyxl import Workbook
from openpyxl.styles import (
    PatternFill, Font, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

wb = Workbook()

# ── Palette ────────────────────────────────────────────────────────────────────
CLR_HEADER_BG   = "1A1A2E"   # dark navy  – sheet header row
CLR_HEADER_FG   = "FFFFFF"   # white text
CLR_SECTION_BG  = "16213E"   # slightly lighter navy – group headings
CLR_SECTION_FG  = "E8C97E"   # golden text for group headings
CLR_ROW_ODD     = "F5F7FA"
CLR_ROW_EVEN    = "FFFFFF"
CLR_BORDER      = "C5C9D6"
CLR_PASS        = "D4EDDA"   # light green
CLR_FAIL        = "F8D7DA"   # light red
CLR_SKIP        = "FFF3CD"   # amber
CLR_TAB_CUST    = "2A9D8F"   # teal  – customer sheet tab
CLR_TAB_ADMIN   = "E76F51"   # orange – admin sheet tab
CLR_TAB_SUMMARY = "264653"   # dark green – summary tab

thin  = Side(style="thin",   color=CLR_BORDER)
med   = Side(style="medium",  color="888888")
BORDER_THIN = Border(left=thin, right=thin, top=thin, bottom=thin)
BORDER_MED  = Border(left=med,  right=med,  top=med,  bottom=med)


def make_fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)


def apply_header_row(ws, row, titles, widths=None):
    """Write a header row with dark background."""
    for col, title in enumerate(titles, 1):
        cell = ws.cell(row=row, column=col, value=title)
        cell.fill   = make_fill(CLR_HEADER_BG)
        cell.font   = Font(name="Calibri", bold=True, color=CLR_HEADER_FG, size=10)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER_MED
    if widths:
        for col, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(col)].width = w


def apply_section_row(ws, row, text, ncols):
    """Write a group/section heading spanning all columns."""
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncols)
    cell = ws.cell(row=row, column=1, value=text)
    cell.fill      = make_fill(CLR_SECTION_BG)
    cell.font      = Font(name="Calibri", bold=True, color=CLR_SECTION_FG, size=10)
    cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    cell.border    = BORDER_MED


def apply_data_row(ws, row, values, odd=True):
    bg = CLR_ROW_ODD if odd else CLR_ROW_EVEN
    for col, val in enumerate(values, 1):
        cell = ws.cell(row=row, column=col, value=val)
        cell.fill      = make_fill(bg)
        cell.font      = Font(name="Calibri", size=10)
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border    = BORDER_THIN


def add_dropdown(ws, col_letter, first_row, last_row, formula):
    dv = DataValidation(
        type="list",
        formula1=formula,
        allow_blank=True,
        showDropDown=False,
    )
    dv.sqref = f"{col_letter}{first_row}:{col_letter}{last_row}"
    ws.add_data_validation(dv)


# ══════════════════════════════════════════════════════════════════════════════
#  FEATURE DATA
# ══════════════════════════════════════════════════════════════════════════════

# Schema for each feature row:
#   (Section, #, Feature Name, Description/Steps, Expected Result, Priority)
# Priority: P1=Critical  P2=High  P3=Medium  P4=Low

CUSTOMER_FEATURES = [
    # ── AUTHENTICATION ────────────────────────────────────────────────────────
    ("Authentication & Accounts", 1,  "User Registration",
     "Navigate to Sign Up page. Enter first name, last name, email, phone (optional), password & confirm password. Accept terms. Submit.",
     "Account created; user auto-logged in; redirected to home page.", "P1"),

    ("Authentication & Accounts", 2,  "Email Validation on Registration",
     "Attempt to register with an already-used email address.",
     "Error message: email already in use. Form not submitted.", "P1"),

    ("Authentication & Accounts", 3,  "Password Strength Validation",
     "Enter a weak password (e.g. 'abc123') during registration.",
     "Inline error shown; form cannot be submitted until password meets requirements.", "P1"),

    ("Authentication & Accounts", 4,  "User Login",
     "Navigate to Login. Enter valid email & password. Submit.",
     "User authenticated; JWT tokens stored; redirected to home or prior page.", "P1"),

    ("Authentication & Accounts", 5,  "Invalid Login Credentials",
     "Attempt login with wrong password.",
     "401 error message shown; user remains on login screen.", "P1"),

    ("Authentication & Accounts", 6,  "Logout",
     "Click Sign Out in the drawer menu.",
     "Session cleared; tokens removed; user redirected to home as guest.", "P1"),

    ("Authentication & Accounts", 7,  "Forgot Password",
     "On Login screen, click 'Forgot Password'. Enter registered email. Submit.",
     "Success message shown; password-reset email sent.", "P2"),

    ("Authentication & Accounts", 8,  "Reset Password",
     "Open reset-password link from email. Enter new password & confirm. Submit.",
     "Password updated; user can log in with new password.", "P2"),

    ("Authentication & Accounts", 9,  "Email Verification",
     "After registration, open verification link from welcome email.",
     "Email marked as verified; confirmation shown.", "P3"),

    # ── HOMEPAGE ──────────────────────────────────────────────────────────────
    ("Homepage", 10, "Homepage Loads",
     "Open the site URL as a guest.",
     "Homepage renders with hero banner, category tiles, featured products, new arrivals & best sellers.", "P1"),

    ("Homepage", 11, "Hero / Promotional Banners",
     "Observe hero banner area on homepage.",
     "Banner image(s) displayed; if multiple banners, carousel/auto-scroll works.", "P2"),

    ("Homepage", 12, "Category Tiles Navigation",
     "Click a category tile on the homepage (e.g. Tea & Coffee).",
     "Redirected to the corresponding product list filtered by that category.", "P1"),

    ("Homepage", 13, "Featured Products Display",
     "Scroll to Featured Products section.",
     "Products displayed with image, name, price and (where applicable) compare-at strikethrough price.", "P1"),

    ("Homepage", 14, "New Arrivals Section",
     "Scroll to New Arrivals section.",
     "Products tagged as new are listed.", "P2"),

    ("Homepage", 15, "Best Sellers Section",
     "Scroll to Best Sellers section.",
     "Products tagged as best seller are listed.", "P2"),

    ("Homepage", 16, "Announcements / Top Banner",
     "Check for announcement bar at top of page.",
     "Active announcements displayed (e.g. free-shipping threshold).", "P3"),

    # ── PRODUCT CATALOG ───────────────────────────────────────────────────────
    ("Product Catalog & Search", 17, "Browse by Category",
     "Click a top-level category from nav/drawer.",
     "Product list page loads showing products in that category with correct category name.", "P1"),

    ("Product Catalog & Search", 18, "Browse by Subcategory",
     "Click a subcategory link.",
     "Product list filtered to that subcategory; breadcrumb reflects subcategory.", "P1"),

    ("Product Catalog & Search", 19, "Pagination / Infinite Scroll",
     "Scroll to bottom of product list with more than one page of results.",
     "Next page of products loads automatically or via pagination controls.", "P2"),

    ("Product Catalog & Search", 20, "Sort Products",
     "On product list, open Sort and select 'Price: Low to High'.",
     "Product order updates accordingly.", "P2"),

    ("Product Catalog & Search", 21, "Filter by Brand",
     "On product list, open Filters and select a brand.",
     "Only products from that brand are shown.", "P2"),

    ("Product Catalog & Search", 22, "Filter by Price Range",
     "On product list, set a min and max price filter.",
     "Only products within that price range are shown.", "P2"),

    ("Product Catalog & Search", 23, "Filter: In Stock Only",
     "Toggle 'In Stock' filter.",
     "Out-of-stock products are hidden from results.", "P3"),

    ("Product Catalog & Search", 24, "Search — Basic Query",
     "Click search icon; type a product name (e.g. 'teapot'); submit.",
     "Search results page loads with matching products.", "P1"),

    ("Product Catalog & Search", 25, "Search — No Results",
     "Search for a term with no matches (e.g. 'xyzabc123').",
     "Empty-state message shown with suggestions or alternative actions.", "P2"),

    ("Product Catalog & Search", 26, "Search — Live / Debounced Results",
     "Type 3+ characters in search bar and wait.",
     "Results update in real time (debounced ≈300 ms) without page reload.", "P3"),

    # ── PRODUCT DETAIL ────────────────────────────────────────────────────────
    ("Product Detail", 27, "Product Detail Page Loads",
     "Click any product from a listing.",
     "Product detail page loads with name, images, description, price, brand and category.", "P1"),

    ("Product Detail", 28, "Image Gallery",
     "On product detail, click or swipe through product images.",
     "All product images cycle; main image updates on thumbnail click.", "P2"),

    ("Product Detail", 29, "Compare-at / Strikethrough Price",
     "Open a product that has a sale price (oldPrice set).",
     "Original price shown struck through; sale price displayed in accent colour.", "P1"),

    ("Product Detail", 30, "VAT Inclusive Price Display",
     "Check any product price display.",
     "Price shown includes 5% VAT; label indicates 'incl. VAT'.", "P1"),

    ("Product Detail", 31, "Add to Cart from Product Detail",
     "Click 'Add to Cart' on a product detail page.",
     "Item added to cart; cart badge count increments; confirmation shown.", "P1"),

    ("Product Detail", 32, "Quantity Selector",
     "Increase quantity to 3 before adding to cart.",
     "Correct quantity (3) added to cart.", "P2"),

    ("Product Detail", 33, "Add to Favourites from Product Detail",
     "Click the heart/favourite icon on a product detail page.",
     "Product saved to favourites; icon changes to filled/active state.", "P2"),

    ("Product Detail", 34, "Out-of-Stock Product",
     "Open a product with stock = 0.",
     "'Out of Stock' label shown; 'Add to Cart' button disabled.", "P2"),

    # ── CART ──────────────────────────────────────────────────────────────────
    ("Shopping Cart", 35, "View Cart",
     "Click cart icon in app bar.",
     "Cart page loads listing all added items with image, name, qty and price.", "P1"),

    ("Shopping Cart", 36, "Update Item Quantity in Cart",
     "In cart, increase quantity of an item using '+' button.",
     "Quantity and line total update immediately; order total recalculates.", "P1"),

    ("Shopping Cart", 37, "Remove Item from Cart",
     "In cart, click remove/delete on an item.",
     "Item removed; totals recalculate; empty-state shown if cart becomes empty.", "P1"),

    ("Shopping Cart", 38, "Apply Valid Promo Code",
     "Enter a valid promo code in the coupon field.",
     "Discount applied; discounted amount shown; order total reduced.", "P2"),

    ("Shopping Cart", 39, "Apply Invalid Promo Code",
     "Enter an invalid or expired promo code.",
     "Error message shown; no discount applied.", "P2"),

    ("Shopping Cart", 40, "Cart Persists Across Sessions",
     "Add items to cart, log out, log back in.",
     "Cart items still present after re-login.", "P2"),

    ("Shopping Cart", 41, "VAT Breakdown in Cart",
     "View cart total section.",
     "Subtotal, VAT (5%) amount and grand total displayed separately.", "P2"),

    # ── CHECKOUT ──────────────────────────────────────────────────────────────
    ("Checkout & Orders", 42, "Proceed to Checkout (logged in)",
     "With items in cart and user logged in, click Checkout.",
     "Checkout page loads with shipping address step.", "P1"),

    ("Checkout & Orders", 43, "Checkout Redirects to Login (guest)",
     "With items in cart as a guest, click Checkout.",
     "User redirected to Login; returned to checkout after login.", "P1"),

    ("Checkout & Orders", 44, "Enter New Shipping Address",
     "On checkout, enter a new shipping address and proceed.",
     "Address saved and used for the order.", "P1"),

    ("Checkout & Orders", 45, "Select Saved Shipping Address",
     "On checkout, select a previously saved address.",
     "Saved address pre-populated and order uses it.", "P2"),

    ("Checkout & Orders", 46, "Same as Shipping for Billing",
     "Toggle 'Same as shipping address' for billing.",
     "Billing address auto-filled from shipping; not shown as a separate input.", "P2"),

    ("Checkout & Orders", 47, "Payment Method Selection",
     "On checkout, view available payment methods.",
     "At least one payment method shown (credit card / COD / etc.).", "P1"),

    ("Checkout & Orders", 48, "Place Order",
     "Complete all checkout steps and click Place Order.",
     "Order created; Order Confirmation page shown with order number.", "P1"),

    ("Checkout & Orders", 49, "Order Confirmation Page",
     "After placing an order, view the confirmation screen.",
     "Order #, items summary, total and estimated delivery shown.", "P1"),

    ("Checkout & Orders", 50, "Promo Code Applied at Checkout",
     "Apply a promo code on the cart and verify it carries through to checkout.",
     "Discount line shows in checkout order summary.", "P2"),

    # ── ACCOUNT ───────────────────────────────────────────────────────────────
    ("My Account", 51, "View Profile",
     "Navigate to My Account → Profile.",
     "User's name, email and phone displayed.", "P1"),

    ("My Account", 52, "Edit Profile",
     "On Profile page, update first name and save.",
     "Profile updated; success toast shown; new name reflected.", "P2"),

    ("My Account", 53, "Change Password",
     "Navigate to Security settings. Enter current password, new password and confirm. Save.",
     "Password changed; user can log in with new password.", "P2"),

    ("My Account", 54, "Manage Addresses — Add",
     "Go to Addresses. Click Add. Fill in address form. Save.",
     "New address saved and listed.", "P2"),

    ("My Account", 55, "Manage Addresses — Delete",
     "Delete a saved address.",
     "Address removed from the list.", "P3"),

    ("My Account", 56, "View Order History",
     "Navigate to My Orders.",
     "List of past orders shown with order #, date, status and total.", "P1"),

    ("My Account", 57, "View Order Detail",
     "Click an order in the order history.",
     "Order detail shows items, quantities, prices, shipping address and status.", "P1"),

    ("My Account", 58, "Submit Return Request",
     "On a delivered order, click Request Return. Fill in reason. Submit.",
     "Return request submitted; status shown as 'Pending'.", "P2"),

    ("My Account", 59, "Loyalty Points Balance",
     "Navigate to Loyalty Program page.",
     "Current points balance and tier displayed.", "P3"),

    # ── FAVOURITES ────────────────────────────────────────────────────────────
    ("Favourites / Wishlist", 60, "Add Product to Favourites",
     "Click heart icon on any product card or detail page.",
     "Product added; icon turns filled/active; favourites count updates.", "P2"),

    ("Favourites / Wishlist", 61, "View Favourites List",
     "Navigate to Favourites page.",
     "All saved products listed with image, name and price.", "P2"),

    ("Favourites / Wishlist", 62, "Remove from Favourites",
     "On Favourites page, remove a product.",
     "Product removed from list immediately.", "P2"),

    ("Favourites / Wishlist", 63, "Add to Cart from Favourites",
     "On Favourites page, click Add to Cart on a product.",
     "Product added to cart; cart badge increments.", "P2"),

    # ── BULK ORDERS ───────────────────────────────────────────────────────────
    ("Bulk / Wholesale Orders", 64, "Submit Bulk Order Enquiry",
     "Navigate to Bulk Orders page. Fill in company name, contact, product details and quantity. Submit.",
     "Enquiry submitted; confirmation message displayed.", "P3"),
]

ADMIN_FEATURES = [
    # ── DASHBOARD ─────────────────────────────────────────────────────────────
    ("Dashboard & Analytics", 1, "Admin Login",
     "Navigate to /admin. Enter admin credentials. Submit.",
     "Admin authenticated; redirected to Admin Dashboard.", "P1"),

    ("Dashboard & Analytics", 2, "Dashboard KPI Cards",
     "Open Admin Dashboard.",
     "KPI cards shown: total revenue, total orders, new customers, pending orders.", "P1"),

    ("Dashboard & Analytics", 3, "Recent Orders Widget",
     "On Dashboard, check recent orders panel.",
     "Latest orders listed with order #, customer name, status and amount.", "P1"),

    ("Dashboard & Analytics", 4, "Analytics Page",
     "Navigate to Admin → Analytics.",
     "Charts/graphs load for sales, orders and traffic metrics.", "P2"),

    # ── PRODUCTS ──────────────────────────────────────────────────────────────
    ("Products Management", 5, "View All Products",
     "Navigate to Admin → Products.",
     "Paginated product list with name, SKU, price, stock and status.", "P1"),

    ("Products Management", 6, "Search Products in Admin",
     "Use search box on Admin Products page.",
     "List filters to matching products.", "P2"),

    ("Products Management", 7, "Create New Product",
     "Click 'Add Product'. Fill in name, SKU, description, price, category, brand, stock. Save.",
     "Product created; appears in product list.", "P1"),

    ("Products Management", 8, "Edit Product Details",
     "Click Edit on any product. Change the name/price. Save.",
     "Product updated; changes reflected in list and on storefront.", "P1"),

    ("Products Management", 9, "Delete Product",
     "Click Delete on a product. Confirm.",
     "Product removed from the list and from the storefront.", "P2"),

    ("Products Management", 10, "Set Product as Featured",
     "Edit a product. Toggle 'Featured' flag on. Save.",
     "Product appears in Featured section on homepage.", "P2"),

    ("Products Management", 11, "Set Product as New Arrival",
     "Edit a product. Toggle 'New Arrival' flag on. Save.",
     "Product appears in New Arrivals section.", "P2"),

    ("Products Management", 12, "Set Product as Best Seller",
     "Edit a product. Toggle 'Best Seller' flag on. Save.",
     "Product appears in Best Sellers section.", "P2"),

    ("Products Management", 13, "Set Compare-at Price (Sale)",
     "Edit a product. Set a compareAtPrice higher than the regular price. Save.",
     "Storefront shows original price struck through with sale price highlighted.", "P1"),

    ("Products Management", 14, "Product Active / Inactive Toggle",
     "Edit a product. Toggle active status to inactive. Save.",
     "Product hidden from storefront while inactive.", "P2"),

    ("Products Management", 15, "Product Groups (Variants)",
     "Navigate to Admin → Product Groups. Open a group.",
     "Group detail shows linked products/variants.", "P3"),

    # ── CATEGORIES ────────────────────────────────────────────────────────────
    ("Categories Management", 16, "View Categories",
     "Navigate to Admin → Categories.",
     "List of top-level categories with name, slug and status.", "P1"),

    ("Categories Management", 17, "Create Category",
     "Click 'Add Category'. Enter name and slug. Save.",
     "New category appears in the list.", "P1"),

    ("Categories Management", 18, "Edit Category Name",
     "Click Edit on a category. Change the name. Save.",
     "Updated name reflected immediately in the list and on the storefront.", "P1"),

    ("Categories Management", 19, "Delete Category",
     "Click Delete on a category with no active products. Confirm.",
     "Category removed.", "P2"),

    ("Categories Management", 20, "View Subcategories",
     "Navigate to Admin → Subcategories.",
     "List of subcategories showing name, parent category and status.", "P1"),

    ("Categories Management", 21, "Create Subcategory",
     "Click 'Add Subcategory'. Enter name, slug and select parent category. Save.",
     "New subcategory appears in list under correct parent.", "P1"),

    ("Categories Management", 22, "Edit Subcategory — Change Parent Category",
     "Click Edit on a subcategory. Change the parent category dropdown to a different category. Save.",
     "Subcategory now listed under the new parent category.", "P1"),

    ("Categories Management", 23, "Delete Subcategory",
     "Click Delete on a subcategory with no active products. Confirm.",
     "Subcategory removed.", "P2"),

    # ── ORDERS ────────────────────────────────────────────────────────────────
    ("Orders Management", 24, "View All Orders",
     "Navigate to Admin → Orders.",
     "All customer orders listed with order #, date, customer, total and status.", "P1"),

    ("Orders Management", 25, "Filter Orders by Status",
     "Use status filter on Admin Orders page.",
     "List updates to show only orders matching selected status.", "P2"),

    ("Orders Management", 26, "View Order Detail",
     "Click an order in admin order list.",
     "Order detail shows customer info, items, quantities, totals, shipping address and timeline.", "P1"),

    ("Orders Management", 27, "Update Order Status",
     "On order detail, change status (e.g. Pending → Processing). Save.",
     "Status updated; customer order history reflects new status.", "P1"),

    # ── CUSTOMERS ─────────────────────────────────────────────────────────────
    ("Customer Management", 28, "View All Customers",
     "Navigate to Admin → Customers.",
     "Customer list with name, email, registration date and order count.", "P1"),

    ("Customer Management", 29, "Search Customers",
     "Use search on Admin Customers page.",
     "List filters to matching customers.", "P2"),

    ("Customer Management", 30, "View Customer Detail",
     "Click a customer in admin customer list.",
     "Customer profile showing personal info, order history and loyalty status.", "P2"),

    ("Customer Management", 31, "Deactivate Customer Account",
     "On customer detail, toggle account status to inactive.",
     "Customer can no longer log in; existing sessions invalidated.", "P3"),

    # ── PROMOTIONS ────────────────────────────────────────────────────────────
    ("Promotions & Discounts", 32, "View Promo Codes",
     "Navigate to Admin → Promo Codes.",
     "List of existing promo codes with code, discount type, value, usage and expiry.", "P1"),

    ("Promotions & Discounts", 33, "Create Promo Code",
     "Click 'Add Promo Code'. Enter code, discount % or fixed amount, usage limit, expiry date. Save.",
     "Promo code created and usable at checkout.", "P1"),

    ("Promotions & Discounts", 34, "Edit Promo Code",
     "Click Edit on a promo code. Change expiry date. Save.",
     "Changes saved; promo code updated.", "P2"),

    ("Promotions & Discounts", 35, "Deactivate Promo Code",
     "Toggle a promo code to inactive.",
     "Code no longer accepted at checkout.", "P2"),

    ("Promotions & Discounts", 36, "Collections",
     "Navigate to Admin → Collections. Create a new collection with selected products.",
     "Collection saved; products associated with collection.", "P3"),

    # ── CONTENT / CMS ─────────────────────────────────────────────────────────
    ("Content Management (CMS)", 37, "Manage Banners — View",
     "Navigate to Admin → Banners.",
     "List of homepage and promotional banners with image preview.", "P1"),

    ("Content Management (CMS)", 38, "Create Banner",
     "Click 'Add Banner'. Upload image, set link URL, set position/order. Save.",
     "Banner appears on homepage in correct position.", "P1"),

    ("Content Management (CMS)", 39, "Edit / Reorder Banners",
     "Change the display order of banners via drag or order field. Save.",
     "Banners display in new order on storefront.", "P2"),

    ("Content Management (CMS)", 40, "Delete Banner",
     "Delete a banner. Confirm.",
     "Banner removed from homepage.", "P2"),

    ("Content Management (CMS)", 41, "Manage Announcements",
     "Navigate to Admin → Announcements. Create a new announcement with text. Save.",
     "Announcement bar appears at top of storefront.", "P2"),

    ("Content Management (CMS)", 42, "CMS Pages",
     "Navigate to Admin → CMS Pages. Edit the About Us page content. Save.",
     "Updated content visible on the corresponding storefront page.", "P3"),

    ("Content Management (CMS)", 43, "Navigation Management",
     "Navigate to Admin → Navigation. Add or reorder a nav item. Save.",
     "Navigation menu on storefront reflects the change.", "P3"),

    # ── BRANDS ────────────────────────────────────────────────────────────────
    ("Brands Management", 44, "View Brands",
     "Navigate to Admin → Brands.",
     "List of brands with name and product count.", "P2"),

    ("Brands Management", 45, "Create Brand",
     "Click 'Add Brand'. Enter name and optional logo. Save.",
     "Brand appears in list and is selectable when creating products.", "P2"),

    ("Brands Management", 46, "Edit Brand",
     "Click Edit on a brand. Change the name. Save.",
     "Brand name updated in list and on affected product pages.", "P2"),

    # ── SETTINGS ──────────────────────────────────────────────────────────────
    ("Settings", 47, "VAT Configuration",
     "Navigate to Admin → VAT. View current VAT rate.",
     "Current VAT rate displayed (5%).", "P1"),

    ("Settings", 48, "Shipping Rates",
     "Navigate to Admin → Shipping. View or update shipping rules.",
     "Shipping rates/rules displayed; changes save correctly.", "P2"),

    ("Settings", 49, "Loyalty Program Settings",
     "Navigate to Admin → Loyalty. View points rules.",
     "Loyalty points earn/redeem rules displayed.", "P3"),

    ("Settings", 50, "Returns Management",
     "Navigate to Admin → Returns. View open return requests.",
     "Return requests listed; admin can update return status.", "P2"),

    ("Settings", 51, "Payments Configuration",
     "Navigate to Admin → Payments.",
     "Payment gateway settings viewable (masked sensitive keys).", "P2"),

    ("Settings", 52, "Bulk Orders Review",
     "Navigate to Admin → Bulk Orders. View submitted bulk order enquiries.",
     "Bulk order enquiry list shown with contact info and product details.", "P3"),
]


# ══════════════════════════════════════════════════════════════════════════════
#  BUILD WORKSHEET HELPER
# ══════════════════════════════════════════════════════════════════════════════

COLUMNS = ["#", "Section", "Feature / Test Case", "Steps / Description",
           "Expected Result", "Priority", "Status", "Notes / Defect ID"]
WIDTHS   = [5, 22, 30, 50, 40, 10, 14, 28]

STATUS_OPTIONS = '"Pass,Fail,Skip,Not Tested"'

PRIORITY_COLOR = {
    "P1": "C0392B",   # red
    "P2": "E67E22",   # orange
    "P3": "27AE60",   # green
    "P4": "7F8C8D",   # grey
}


def build_sheet(ws, features, title, tab_color):
    ws.title = title
    ws.sheet_properties.tabColor = tab_color
    ws.freeze_panes = "A3"
    ws.row_dimensions[1].height = 30
    ws.row_dimensions[2].height = 22

    # ── Title row (row 1) ────────────────────────────────────────────────────
    ws.merge_cells("A1:H1")
    title_cell = ws["A1"]
    title_cell.value = f"Solo E-Commerce — {title} Checklist"
    title_cell.fill  = make_fill(CLR_HEADER_BG)
    title_cell.font  = Font(name="Calibri", bold=True, color=CLR_SECTION_FG, size=14)
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    title_cell.border = BORDER_MED

    # ── Column headers (row 2) ───────────────────────────────────────────────
    apply_header_row(ws, 2, COLUMNS, WIDTHS)

    current_row = 3
    odd = True
    last_section = None
    data_start = 3

    for (section, num, feature, steps, expected, priority) in features:
        # Section heading row
        if section != last_section:
            apply_section_row(ws, current_row, f"  {section}", len(COLUMNS))
            ws.row_dimensions[current_row].height = 18
            current_row += 1
            last_section = section

        apply_data_row(ws, current_row,
                       [num, section, feature, steps, expected, priority, "", ""],
                       odd)

        # Priority cell coloring
        p_cell = ws.cell(row=current_row, column=6)
        hex_c = PRIORITY_COLOR.get(priority, "555555")
        p_cell.font = Font(name="Calibri", bold=True, color=hex_c, size=10)
        p_cell.alignment = Alignment(horizontal="center", vertical="center")

        # Status cell — drop-down validation added after loop
        ws.cell(row=current_row, column=7).alignment = Alignment(horizontal="center", vertical="center")

        ws.row_dimensions[current_row].height = 40
        current_row += 1
        odd = not odd

    data_end = current_row - 1

    # ── Drop-down for Status column ──────────────────────────────────────────
    add_dropdown(ws, "G", data_start, data_end, STATUS_OPTIONS)

    # ── Conditional colour for Status (manual fill — openpyxl ConditionalFmt) 
    from openpyxl.formatting.rule import CellIsRule
    ws.conditional_formatting.add(
        f"G{data_start}:G{data_end}",
        CellIsRule(operator="equal", formula=['"Pass"'],  fill=make_fill(CLR_PASS))
    )
    ws.conditional_formatting.add(
        f"G{data_start}:G{data_end}",
        CellIsRule(operator="equal", formula=['"Fail"'],  fill=make_fill(CLR_FAIL))
    )
    ws.conditional_formatting.add(
        f"G{data_start}:G{data_end}",
        CellIsRule(operator="equal", formula=['"Skip"'],  fill=make_fill(CLR_SKIP))
    )

    # ── Wrap text for description / expected columns ─────────────────────────
    for row in ws.iter_rows(min_row=data_start, max_row=data_end, min_col=4, max_col=5):
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical="top")

    return data_start, data_end


# ══════════════════════════════════════════════════════════════════════════════
#  SUMMARY SHEET
# ══════════════════════════════════════════════════════════════════════════════

def build_summary(wb, cust_data_range, admin_data_range):
    ws = wb.create_sheet("Summary", 0)
    ws.title = "Summary"
    ws.sheet_properties.tabColor = CLR_TAB_SUMMARY
    ws.freeze_panes = "A2"

    # Title
    ws.merge_cells("A1:F1")
    t = ws["A1"]
    t.value = "Solo E-Commerce — Test Execution Summary"
    t.fill  = make_fill(CLR_HEADER_BG)
    t.font  = Font(name="Calibri", bold=True, color=CLR_SECTION_FG, size=14)
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    headers = ["Sheet", "Total Tests", "Pass", "Fail", "Skip", "Not Tested"]
    widths2  = [28, 14, 10, 10, 10, 14]
    apply_header_row(ws, 2, headers, widths2)
    ws.row_dimensions[2].height = 22

    c_sheet = "Customer Features"
    a_sheet = "Admin Features"
    c_s, c_e = cust_data_range
    a_s, a_e = admin_data_range

    def countif_formula(sheet, col, start, end, val):
        return f'=COUNTIF(\'{sheet}\'!{col}{start}:{col}{end},"{val}")'

    def total_data_rows(sheet, col, start, end):
        # Count rows that have a feature # (numeric)
        return f'=COUNTA(\'{sheet}\'!A{start}:A{end})-COUNTIF(\'{sheet}\'!A{start}:A{end},"")'

    rows_data = [
        (c_sheet, c_s, c_e, CLR_TAB_CUST),
        (a_sheet, a_s, a_e, CLR_TAB_ADMIN),
    ]

    for i, (sheet_name, ds, de, color) in enumerate(rows_data, 3):
        row_values = [
            sheet_name,
            f'=COUNTA(\'{sheet_name}\'!A{ds}:A{de})-COUNTIF(\'{sheet_name}\'!A{ds}:A{de},"")',
            countif_formula(sheet_name, "G", ds, de, "Pass"),
            countif_formula(sheet_name, "G", ds, de, "Fail"),
            countif_formula(sheet_name, "G", ds, de, "Skip"),
            countif_formula(sheet_name, "G", ds, de, "Not Tested"),
        ]
        for col, val in enumerate(row_values, 1):
            cell = ws.cell(row=i, column=col, value=val)
            cell.fill   = make_fill(CLR_ROW_ODD if i % 2 == 1 else CLR_ROW_EVEN)
            cell.font   = Font(name="Calibri", size=10)
            cell.border = BORDER_THIN
            cell.alignment = Alignment(horizontal="center" if col > 1 else "left",
                                        vertical="center")
        ws.row_dimensions[i].height = 20

    # Totals row
    for col in range(1, 7):
        cell = ws.cell(row=5, column=col)
        if col == 1:
            cell.value = "TOTAL"
        else:
            cell.value = f"=SUM({get_column_letter(col)}3:{get_column_letter(col)}4)"
        cell.fill   = make_fill(CLR_HEADER_BG)
        cell.font   = Font(name="Calibri", bold=True, color=CLR_HEADER_FG, size=10)
        cell.border = BORDER_MED
        cell.alignment = Alignment(horizontal="center" if col > 1 else "left",
                                    vertical="center")
    ws.row_dimensions[5].height = 22

    # ── Legend ────────────────────────────────────────────────────────────────
    legend_row = 7
    ws.merge_cells(f"A{legend_row}:F{legend_row}")
    lh = ws.cell(row=legend_row, column=1, value="Legend")
    lh.fill  = make_fill(CLR_SECTION_BG)
    lh.font  = Font(name="Calibri", bold=True, color=CLR_SECTION_FG, size=10)
    lh.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    lh.border = BORDER_MED
    ws.row_dimensions[legend_row].height = 18

    legend_items = [
        ("Pass",       CLR_PASS,  "Test case passed successfully"),
        ("Fail",       CLR_FAIL,  "Test case failed — log defect ID in Notes column"),
        ("Skip",       CLR_SKIP,  "Test case intentionally skipped (not applicable)"),
        ("Not Tested", CLR_ROW_ODD, "Test case not yet executed"),
        ("P1 — Critical", None,   "Must pass before release"),
        ("P2 — High",     None,   "Should pass before release"),
        ("P3 — Medium",   None,   "Nice to have; minor risk if delayed"),
    ]

    for j, (label, bg, desc) in enumerate(legend_items, legend_row + 1):
        c1 = ws.cell(row=j, column=1, value=label)
        c1.font   = Font(name="Calibri", bold=True, size=10)
        c1.border = BORDER_THIN
        c1.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        if bg:
            c1.fill = make_fill(bg)

        ws.merge_cells(f"B{j}:F{j}")
        c2 = ws.cell(row=j, column=2, value=desc)
        c2.font   = Font(name="Calibri", size=10)
        c2.border = BORDER_THIN
        if bg:
            c2.fill = make_fill(bg)
        ws.row_dimensions[j].height = 16

    ws.column_dimensions["A"].width = 28
    for col_letter, width in zip(["B", "C", "D", "E", "F"], [14, 10, 10, 10, 14]):
        ws.column_dimensions[col_letter].width = width


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

# Remove default blank sheet
default_sheet = wb.active
wb.remove(default_sheet)

# Customer sheet
ws_cust = wb.create_sheet("Customer Features")
cust_start, cust_end = build_sheet(ws_cust, CUSTOMER_FEATURES,
                                   "Customer Features", CLR_TAB_CUST)

# Admin sheet
ws_admin = wb.create_sheet("Admin Features")
admin_start, admin_end = build_sheet(ws_admin, ADMIN_FEATURES,
                                     "Admin Features", CLR_TAB_ADMIN)

# Summary sheet (inserted at position 0)
build_summary(wb, (cust_start, cust_end), (admin_start, admin_end))

OUTPUT = r"D:\Solo Website\Solo_Features_Checklist.xlsx"
wb.save(OUTPUT)
print(f"Saved: {OUTPUT}")
print(f"  Customer features : {len(CUSTOMER_FEATURES)}")
print(f"  Admin features    : {len(ADMIN_FEATURES)}")
print(f"  Total             : {len(CUSTOMER_FEATURES) + len(ADMIN_FEATURES)}")
