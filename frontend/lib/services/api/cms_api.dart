import 'dart:convert';
import 'package:http/http.dart' as http;

class CmsApi {
  final String baseUrl;
  CmsApi({required this.baseUrl});

  Future<Map<String, dynamic>> getHomePage() async {
    final uri = Uri.parse('$baseUrl/cms/home-page');
    final res = await http.get(uri);

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load home page CMS: ${res.statusCode} ${res.body}');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data;
  }

  Future<Map<String, dynamic>> getCategoryLanding(String categoryId) async {
    final uri = Uri.parse('$baseUrl/cms/category/$categoryId');
    final res = await http.get(uri);

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load category landing: ${res.statusCode} ${res.body}');
    }

    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
