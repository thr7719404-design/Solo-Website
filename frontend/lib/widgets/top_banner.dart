import 'package:flutter/material.dart';

class TopBanner extends StatelessWidget {
  const TopBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      color: const Color(0xFF1A1A1A),
      child: Center(
        child: Text(
          'Free shipping over \$69 | 30 days free returns | Secure payments',
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.9),
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
