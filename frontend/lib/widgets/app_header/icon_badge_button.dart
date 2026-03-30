import 'package:flutter/material.dart';
import '../../app/theme/tokens.dart';

class IconBadgeButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final int badgeCount;
  final String? tooltip;

  const IconBadgeButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.badgeCount = 0,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final button = Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: Icon(icon, color: Colors.black),
          onPressed: onPressed,
          tooltip: tooltip,
        ),
        if (badgeCount > 0)
          Positioned(
            right: AppTokens.spacingS,
            top: AppTokens.spacingS,
            child: Container(
              padding: EdgeInsets.all(AppTokens.badgePadding),
              decoration: const BoxDecoration(
                color: Colors.black,
                shape: BoxShape.circle,
              ),
              constraints: BoxConstraints(
                minWidth: AppTokens.badgeSize,
                minHeight: AppTokens.badgeSize,
              ),
              child: Text(
                badgeCount > 99 ? '99+' : '$badgeCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );

    return Semantics(
      label: tooltip ?? '',
      button: true,
      enabled: onPressed != null,
      child: button,
    );
  }
}
