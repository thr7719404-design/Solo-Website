import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/providers/content_provider.dart';

/// Content Provider Unit Tests (GAP-007/008/009/016/017)
/// Tests CMS content state management
void main() {
  group('ContentProvider Unit Tests (GAP-007/008/009/016/017)', () {
    late ContentProvider contentProvider;

    setUp(() {
      contentProvider = ContentProvider();
    });

    group('Initial State', () {
      test('CMS-P01: should have empty banners list initially', () {
        expect(contentProvider.banners, isEmpty);
      });

      test('CMS-P02: should have bannerStatus = idle initially', () {
        expect(contentProvider.bannerStatus, equals(ContentStatus.idle));
      });

      test('CMS-P03: should have isBannersLoading = false initially', () {
        expect(contentProvider.isBannersLoading, isFalse);
      });

      test('CMS-P04: should have bannerError = null initially', () {
        expect(contentProvider.bannerError, isNull);
      });

      test('CMS-P05: should have hasBanners = false initially', () {
        expect(contentProvider.hasBanners, isFalse);
      });
    });

    group('Landing Page State', () {
      test('CMS-P06: should have landingPage = null initially', () {
        expect(contentProvider.landingPage, isNull);
      });

      test('CMS-P07: should have landingPageStatus = idle initially', () {
        expect(contentProvider.landingPageStatus, equals(ContentStatus.idle));
      });

      test('CMS-P08: should have isLandingPageLoading = false initially', () {
        expect(contentProvider.isLandingPageLoading, isFalse);
      });

      test('CMS-P09: should have hasLandingPage = false initially', () {
        expect(contentProvider.hasLandingPage, isFalse);
      });
    });

    group('State Changes', () {
      test('CMS-P10: should notify listeners on state change', () {
        int notifyCount = 0;
        contentProvider.addListener(() => notifyCount++);

        contentProvider.notifyListeners();

        expect(notifyCount, equals(1));
      });
    });
  });
}
