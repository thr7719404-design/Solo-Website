/// Stub implementation for non-web platforms
/// These methods do nothing when not running on web
library;

void setPageTitle(String title) {
  // No-op on non-web platforms
}

void setMetaDescription(String description) {
  // No-op on non-web platforms
}

void setMetaTags({String? title, String? description, String? keywords}) {
  // No-op on non-web platforms
}
