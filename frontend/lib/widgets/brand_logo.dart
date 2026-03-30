import 'package:flutter/material.dart';

class BrandLogo extends StatelessWidget {
  final double height;
  final VoidCallback? onTap;
  final bool center;

  const BrandLogo({
    super.key,
    this.height = 28,
    this.onTap,
    this.center = false,
  });

  @override
  Widget build(BuildContext context) {
    final logo = Image.asset(
      "assets/branding/collection_logo.jpg",
      height: height,
      fit: BoxFit.contain,
    );

    final wrapped = onTap == null
        ? logo
        : InkWell(
            onTap: onTap,
            child: logo,
          );

    return center ? Center(child: wrapped) : wrapped;
  }
}
