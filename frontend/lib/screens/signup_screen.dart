import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/favorites_provider.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreeToTerms = false;
  bool _subscribeNewsletter = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  String? _validatePhone(String? value) {
    if (value != null && value.isNotEmpty) {
      final phoneRegex = RegExp(r'^[+]?[\d\s\-\(\)]+$');
      if (!phoneRegex.hasMatch(value)) {
        return 'Please enter a valid phone number';
      }
    }
    return null;
  }

  Future<void> _handleSignUp() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to the Terms and Conditions'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        phone: _phoneController.text.trim().isNotEmpty
            ? _phoneController.text.trim()
            : null,
      );

      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        if (success) {
          // Load user's favorites after successful registration
          context.read<FavoritesProvider>().loadFavoriteIds();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account created successfully!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
          // Navigate back
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(authProvider.error ?? 'Failed to create account'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleGoogleSignUp() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );

      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();

      if (googleUser != null) {
        final GoogleSignInAuthentication googleAuth =
            await googleUser.authentication;

        // TODO: Send googleAuth.accessToken and googleAuth.idToken to your backend
        // to create/authenticate the user account

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Signed in as ${googleUser.displayName ?? googleUser.email}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );

          // Navigate back or to home
          Navigator.pop(context);
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Google sign-in failed: $error'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleFacebookSignUp() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final LoginResult result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );

      if (result.status == LoginStatus.success) {
        final AccessToken? accessToken = result.accessToken;

        // Get user data
        final userData = await FacebookAuth.instance.getUserData();

        // TODO: Send accessToken and userData to your backend
        // to create/authenticate the user account

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text('Signed in as ${userData['name'] ?? userData['email']}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );

          // Navigate back or to home
          Navigator.pop(context);
        }
      } else if (result.status == LoginStatus.cancelled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Facebook sign-in was cancelled'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Facebook sign-in failed: ${result.message}'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Facebook sign-in error: $error'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 500),
            padding: EdgeInsets.all(
                MediaQuery.of(context).size.width < 600 ? 20 : 40),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo or Icon
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFB8860B).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person_add,
                      size: 40,
                      color: Color(0xFFB8860B),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // Title
                  const Text(
                    'Create Account',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 32,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Join us for an exclusive shopping experience',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 14,
                      fontWeight: FontWeight.w300,
                      color: Colors.black.withOpacity(0.6),
                    ),
                  ),
                  const SizedBox(height: 40),

                  // First Name & Last Name Row
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _firstNameController,
                          decoration: InputDecoration(
                            labelText: 'First Name',
                            labelStyle: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 14,
                              color: Colors.black.withOpacity(0.6),
                            ),
                            border: const OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                            focusedBorder: const OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                              borderSide: BorderSide(
                                color: Color(0xFFB8860B),
                                width: 2,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 15),
                      Expanded(
                        child: TextFormField(
                          controller: _lastNameController,
                          decoration: InputDecoration(
                            labelText: 'Last Name',
                            labelStyle: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 14,
                              color: Colors.black.withOpacity(0.6),
                            ),
                            border: const OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                            focusedBorder: const OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                              borderSide: BorderSide(
                                color: Color(0xFFB8860B),
                                width: 2,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Email
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email Address',
                      labelStyle: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        color: Colors.black.withOpacity(0.6),
                      ),
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(
                          color: Color(0xFFB8860B),
                          width: 2,
                        ),
                      ),
                    ),
                    validator: _validateEmail,
                  ),
                  const SizedBox(height: 20),

                  // Phone
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Phone Number (Optional)',
                      labelStyle: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        color: Colors.black.withOpacity(0.6),
                      ),
                      prefixIcon: const Icon(Icons.phone_outlined),
                      border: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(
                          color: Color(0xFFB8860B),
                          width: 2,
                        ),
                      ),
                    ),
                    validator: _validatePhone,
                  ),
                  const SizedBox(height: 20),

                  // Password
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      labelStyle: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        color: Colors.black.withOpacity(0.6),
                      ),
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      border: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(
                          color: Color(0xFFB8860B),
                          width: 2,
                        ),
                      ),
                    ),
                    validator: _validatePassword,
                  ),
                  const SizedBox(height: 10),

                  // Password Requirements
                  Padding(
                    padding: const EdgeInsets.only(left: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Password must contain:',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 12,
                            color: Colors.black.withOpacity(0.5),
                          ),
                        ),
                        const SizedBox(height: 4),
                        _buildPasswordRequirement('At least 8 characters'),
                        _buildPasswordRequirement('One uppercase letter'),
                        _buildPasswordRequirement('One number'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Confirm Password
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: _obscureConfirmPassword,
                    decoration: InputDecoration(
                      labelText: 'Confirm Password',
                      labelStyle: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        color: Colors.black.withOpacity(0.6),
                      ),
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscureConfirmPassword = !_obscureConfirmPassword;
                          });
                        },
                      ),
                      border: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(
                          color: Color(0xFFB8860B),
                          width: 2,
                        ),
                      ),
                    ),
                    validator: _validateConfirmPassword,
                  ),
                  const SizedBox(height: 25),

                  // Terms and Conditions Checkbox
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _agreeToTerms,
                        onChanged: (value) {
                          setState(() {
                            _agreeToTerms = value ?? false;
                          });
                        },
                        activeColor: const Color(0xFFB8860B),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 13,
                                color: Colors.black.withOpacity(0.7),
                                height: 1.5,
                              ),
                              children: [
                                const TextSpan(text: 'I agree to the '),
                                TextSpan(
                                  text: 'Terms and Conditions',
                                  style: const TextStyle(
                                    color: Color(0xFFB8860B),
                                    decoration: TextDecoration.underline,
                                  ),
                                  recognizer: TapGestureRecognizer()
                                    ..onTap = () {
                                      // TODO: Open terms and conditions
                                    },
                                ),
                                const TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  style: const TextStyle(
                                    color: Color(0xFFB8860B),
                                    decoration: TextDecoration.underline,
                                  ),
                                  recognizer: TapGestureRecognizer()
                                    ..onTap = () {
                                      // TODO: Open privacy policy
                                    },
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Newsletter Checkbox
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _subscribeNewsletter,
                        onChanged: (value) {
                          setState(() {
                            _subscribeNewsletter = value ?? false;
                          });
                        },
                        activeColor: const Color(0xFFB8860B),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Text(
                            'Subscribe to our newsletter for exclusive offers and updates',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 13,
                              color: Colors.black.withOpacity(0.7),
                              height: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),

                  // Sign Up Button
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSignUp,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFB8860B),
                        foregroundColor: Colors.white,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.zero,
                        ),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              'CREATE ACCOUNT',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.5,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 25),

                  // Already have account
                  Center(
                    child: RichText(
                      text: TextSpan(
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          color: Colors.black.withOpacity(0.7),
                        ),
                        children: [
                          const TextSpan(text: 'Already have an account? '),
                          TextSpan(
                            text: 'Sign In',
                            style: const TextStyle(
                              color: Color(0xFFB8860B),
                              fontWeight: FontWeight.w600,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () {
                                Navigator.pop(context);
                                // TODO: Navigate to login screen
                              },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // Or divider
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          color: Colors.black.withOpacity(0.2),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        child: Text(
                          'OR',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 12,
                            color: Colors.black.withOpacity(0.5),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          color: Colors.black.withOpacity(0.2),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 25),

                  // Social Sign Up Buttons
                  _buildSocialButton(
                    'Continue with Google',
                    Icons.g_mobiledata,
                    Colors.red,
                    _handleGoogleSignUp,
                  ),
                  const SizedBox(height: 15),
                  _buildSocialButton(
                    'Continue with Facebook',
                    Icons.facebook,
                    const Color(0xFF1877F2),
                    _handleFacebookSignUp,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordRequirement(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 14,
            color: Colors.black.withOpacity(0.4),
          ),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 11,
              color: Colors.black.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialButton(
    String text,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return SizedBox(
      height: 50,
      child: OutlinedButton(
        onPressed: _isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.black,
          side: BorderSide(color: Colors.black.withOpacity(0.2)),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 12),
            Text(
              text,
              style: const TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
