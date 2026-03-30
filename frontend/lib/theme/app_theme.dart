import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF1A1A1A);
  static const Color accentColor = Color(0xFFB8860B);
  static const Color backgroundColor = Colors.white;
  static const Color cardColor = Color(0xFFFAFAFA);
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF666666);
  static const Color successColor = Color(0xFF10B981);
  static const Color errorColor = Color(0xFFDC2626);
  static const Color borderColor = Color(0xFFE5E5E5);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: accentColor,
        surface: cardColor,
        background: backgroundColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      textTheme: GoogleFonts.workSansTextTheme().copyWith(
        displayLarge: GoogleFonts.workSans(
          fontSize: 48,
          fontWeight: FontWeight.w300,
          color: textPrimary,
          letterSpacing: -1,
        ),
        displayMedium: GoogleFonts.workSans(
          fontSize: 36,
          fontWeight: FontWeight.w300,
          color: textPrimary,
          letterSpacing: -0.5,
        ),
        headlineLarge: GoogleFonts.workSans(
          fontSize: 28,
          fontWeight: FontWeight.w400,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.workSans(
          fontSize: 22,
          fontWeight: FontWeight.w400,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.workSans(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textPrimary,
          letterSpacing: 0.5,
        ),
        titleMedium: GoogleFonts.workSans(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
          letterSpacing: 0.3,
        ),
        bodyLarge: GoogleFonts.workSans(
          fontSize: 15,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.workSans(
          fontSize: 13,
          color: textSecondary,
        ),
        labelLarge: GoogleFonts.workSans(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: textPrimary, size: 22),
        titleTextStyle: GoogleFonts.workSans(
          fontSize: 20,
          fontWeight: FontWeight.w400,
          color: textPrimary,
          letterSpacing: 2,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(0),
          ),
          textStyle: GoogleFonts.workSans(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(0),
          ),
          textStyle: GoogleFonts.workSans(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
      ),
      cardTheme: const CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(0)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(0),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(0),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(0),
          borderSide: const BorderSide(color: primaryColor, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}
