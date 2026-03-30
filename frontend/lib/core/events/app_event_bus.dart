/// Application Event Bus for in-app synchronization
/// Allows admin changes to propagate to storefront in the same session
library;

import 'dart:async';
import 'package:flutter/foundation.dart';

/// Event types that can be emitted
enum AppEvent {
  /// Catalog data changed (products, featured, best sellers, etc.)
  catalogChanged,

  /// Products data changed
  productsChanged,

  /// Categories data changed
  categoriesChanged,

  /// Brands data changed
  brandsChanged,

  /// Content/CMS data changed (banners, pages)
  contentChanged,

  /// Banners specifically changed
  bannersChanged,

  /// Landing pages changed
  landingPagesChanged,

  /// User authenticated
  userLoggedIn,

  /// User logged out
  userLoggedOut,

  /// Cart updated
  cartUpdated,
}

/// Event data payload
class AppEventData {
  final AppEvent event;
  final String? entityId;
  final String? action; // 'create', 'update', 'delete'
  final Map<String, dynamic>? metadata;
  final DateTime timestamp;

  AppEventData({
    required this.event,
    this.entityId,
    this.action,
    this.metadata,
  }) : timestamp = DateTime.now();

  @override
  String toString() => 'AppEventData(${event.name}, $action, $entityId)';
}

/// Singleton event bus for app-wide event propagation
class AppEventBus extends ChangeNotifier {
  static final AppEventBus _instance = AppEventBus._internal();

  factory AppEventBus() => _instance;

  AppEventBus._internal();

  /// Stream controller for events
  final _eventController = StreamController<AppEventData>.broadcast();

  /// Get the event stream
  Stream<AppEventData> get stream => _eventController.stream;

  /// Last event of each type for quick access
  final Map<AppEvent, AppEventData> _lastEvents = {};

  /// Get last event of a specific type
  AppEventData? getLastEvent(AppEvent type) => _lastEvents[type];

  /// Emit an event
  void emit(AppEvent event,
      {String? entityId, String? action, Map<String, dynamic>? metadata}) {
    final eventData = AppEventData(
      event: event,
      entityId: entityId,
      action: action,
      metadata: metadata,
    );

    _lastEvents[event] = eventData;
    _eventController.add(eventData);
    notifyListeners();
  }

  /// Emit catalog changed event
  void emitCatalogChanged({String? productId, String? action}) {
    emit(AppEvent.catalogChanged, entityId: productId, action: action);
  }

  /// Emit products changed event
  void emitProductsChanged({String? productId, String? action}) {
    emit(AppEvent.productsChanged, entityId: productId, action: action);
    emitCatalogChanged(productId: productId, action: action);
  }

  /// Emit categories changed event
  void emitCategoriesChanged({String? categoryId, String? action}) {
    emit(AppEvent.categoriesChanged, entityId: categoryId, action: action);
  }

  /// Emit brands changed event
  void emitBrandsChanged({String? brandId, String? action}) {
    emit(AppEvent.brandsChanged, entityId: brandId, action: action);
  }

  /// Emit content changed event
  void emitContentChanged({String? action}) {
    emit(AppEvent.contentChanged, action: action);
  }

  /// Emit banners changed event
  void emitBannersChanged({String? bannerId, String? action}) {
    emit(AppEvent.bannersChanged, entityId: bannerId, action: action);
    emit(AppEvent.contentChanged, action: action);
  }

  /// Emit landing pages changed event
  void emitLandingPagesChanged({String? pageId, String? action}) {
    emit(AppEvent.landingPagesChanged, entityId: pageId, action: action);
    emit(AppEvent.contentChanged, action: action);
  }

  /// Emit user logged in event
  void emitUserLoggedIn({String? userId}) {
    emit(AppEvent.userLoggedIn, entityId: userId, action: 'login');
  }

  /// Emit user logged out event
  void emitUserLoggedOut() {
    emit(AppEvent.userLoggedOut, action: 'logout');
  }

  /// Emit cart updated event
  void emitCartUpdated({String? action}) {
    emit(AppEvent.cartUpdated, action: action);
  }

  /// Subscribe to specific event types
  StreamSubscription<AppEventData> subscribe(
    List<AppEvent> events,
    void Function(AppEventData) handler,
  ) {
    return stream.where((e) => events.contains(e.event)).listen(handler);
  }

  /// Subscribe to all events
  StreamSubscription<AppEventData> subscribeAll(
      void Function(AppEventData) handler) {
    return stream.listen(handler);
  }

  /// Subscribe to a single event type (convenience method)
  StreamSubscription<AppEventData> on(
      AppEvent event, void Function(AppEventData) handler) {
    return stream.where((e) => e.event == event).listen(handler);
  }

  /// Dispose resources
  @override
  void dispose() {
    _eventController.close();
    super.dispose();
  }
}

/// Global event bus instance
final appEventBus = AppEventBus();
