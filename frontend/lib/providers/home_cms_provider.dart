import 'package:flutter/foundation.dart';
import '../services/api/cms_api.dart'; // adjust if your path is different

class HomeCmsProvider extends ChangeNotifier {
  final CmsApi cmsApi;

  HomeCmsProvider({required this.cmsApi});

  bool isLoading = false;
  String? error;

  Map<String, dynamic>? homeConfig;
  List<dynamic> sections = [];

  Future<void> loadHomeCms() async {
    // Guard against concurrent/duplicate loads
    if (isLoading) return;

    isLoading = true;
    error = null;
    _safeNotify();

    try {
      final data = await cmsApi.getHomePage();
      homeConfig = data;
      sections = (data['sections'] as List?) ?? [];
    } catch (e) {
      debugPrint('[HomeCmsProvider] Error: $e');
      error = e.toString();
    } finally {
      isLoading = false;
      _safeNotify();
    }
  }

  void _safeNotify() {
    try {
      notifyListeners();
    } catch (_) {
      // avoids crash if widget disposed during async call
    }
  }
}
