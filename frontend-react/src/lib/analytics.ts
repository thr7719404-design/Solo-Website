/**
 * Google Analytics 4 — typed event helpers
 * Measurement ID: G-33S9C5XBLE
 *
 * GA4 e-commerce events follow the standard GA4 / Google Tag schema so they
 * automatically populate the Monetisation, Engagement, and Exploration reports.
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_ID = 'G-33S9C5XBLE';

function gtag(...args: any[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag(...args);
}

// ─── Page tracking ──────────────────────────────────────────────────────────

export function trackPageView(path: string, title?: string) {
  gtag('config', GA_ID, {
    page_path: path,
    page_title: title || document.title,
  });
}

// ─── E-commerce ─────────────────────────────────────────────────────────────

export interface GaItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  price: number;
  quantity?: number;
  discount?: number;
}

/** Fired when a product detail page loads */
export function trackViewItem(item: GaItem) {
  gtag('event', 'view_item', {
    currency: 'AED',
    value: item.price,
    items: [{ ...item, quantity: item.quantity ?? 1 }],
  });
}

/** Fired when items appear in a list / category page */
export function trackViewItemList(items: GaItem[], listName: string) {
  gtag('event', 'view_item_list', {
    item_list_name: listName,
    items: items.map((it, idx) => ({ ...it, index: idx })),
  });
}

/** Fired when the user adds a product to the cart */
export function trackAddToCart(item: GaItem, quantity = 1) {
  gtag('event', 'add_to_cart', {
    currency: 'AED',
    value: item.price * quantity,
    items: [{ ...item, quantity }],
  });
}

/** Fired when the user removes a product from the cart */
export function trackRemoveFromCart(item: GaItem, quantity = 1) {
  gtag('event', 'remove_from_cart', {
    currency: 'AED',
    value: item.price * quantity,
    items: [{ ...item, quantity }],
  });
}

/** Fired when the user lands on the cart page */
export function trackViewCart(items: GaItem[], total: number) {
  gtag('event', 'view_cart', {
    currency: 'AED',
    value: total,
    items,
  });
}

/** Fired when checkout begins */
export function trackBeginCheckout(items: GaItem[], total: number, coupon?: string) {
  gtag('event', 'begin_checkout', {
    currency: 'AED',
    value: total,
    coupon,
    items,
  });
}

/** Fired when a payment method is selected */
export function trackAddPaymentInfo(
  items: GaItem[],
  total: number,
  paymentType: string,
  coupon?: string,
) {
  gtag('event', 'add_payment_info', {
    currency: 'AED',
    value: total,
    payment_type: paymentType,
    coupon,
    items,
  });
}

/** Fired after a successful order — the most important e-commerce event */
export function trackPurchase(params: {
  orderId: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  coupon?: string;
  items: GaItem[];
}) {
  gtag('event', 'purchase', {
    transaction_id: params.orderId,
    currency: 'AED',
    value: params.total,
    tax: params.tax,
    shipping: params.shipping,
    coupon: params.coupon,
    items: params.items,
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function trackSearch(searchTerm: string) {
  gtag('event', 'search', { search_term: searchTerm });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function trackLogin(method = 'email') {
  gtag('event', 'login', { method });
}

export function trackSignUp(method = 'email') {
  gtag('event', 'sign_up', { method });
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export function trackAddToWishlist(item: GaItem) {
  gtag('event', 'add_to_wishlist', {
    currency: 'AED',
    value: item.price,
    items: [{ ...item, quantity: 1 }],
  });
}

// ─── Engagement ──────────────────────────────────────────────────────────────

export function trackSelectContent(contentType: string, itemId: string) {
  gtag('event', 'select_content', { content_type: contentType, item_id: itemId });
}
