import 'package:flutter/material.dart';
import '../../app/theme/tokens.dart';

class AppShippingStrip extends StatelessWidget {
  const AppShippingStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: AppTokens.shippingStripHeight,
      padding: EdgeInsets.symmetric(
        vertical: AppTokens.spacingS,
        horizontal: AppTokens.spacingM,
      ),
      color: AppTokens.primaryDark,
      child: const Text(
        'Free shipping over \$69 | 30 days free returns | Secure payments',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),
      ),
    );
  }
}
