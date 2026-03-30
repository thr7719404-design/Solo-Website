/// Web-specific implementation for SEO meta tags
library;

import 'dart:html' as html;

void setPageTitle(String title) {
  html.document.title = title;
}

void setMetaDescription(String description) {
  _setMetaTag('description', description);
}

void setMetaTags({String? title, String? description, String? keywords}) {
  if (title != null && title.isNotEmpty) {
    html.document.title = title;
    _setMetaTag('og:title', title);
    _setMetaTag('twitter:title', title);
  }

  if (description != null && description.isNotEmpty) {
    _setMetaTag('description', description);
    _setMetaTag('og:description', description);
    _setMetaTag('twitter:description', description);
  }

  if (keywords != null && keywords.isNotEmpty) {
    _setMetaTag('keywords', keywords);
  }
}

void _setMetaTag(String name, String content) {
  // Try to find existing meta tag
  html.MetaElement? meta;

  // Check by name attribute
  meta = html.document.querySelector('meta[name="$name"]') as html.MetaElement?;

  // Check by property attribute (for og: tags)
  if (meta == null && name.startsWith('og:')) {
    meta = html.document.querySelector('meta[property="$name"]')
        as html.MetaElement?;
  }

  if (meta != null) {
    meta.content = content;
  } else {
    // Create new meta tag
    meta = html.MetaElement();
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name);
    } else {
      meta.name = name;
    }
    meta.content = content;
    html.document.head?.append(meta);
  }
}
