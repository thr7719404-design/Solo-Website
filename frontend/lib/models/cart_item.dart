class CartItem {
  final String id;
  final String productId;
  final String name;
  final String imageUrl;
  final double price;
  final int quantity;
  final String? size;
  final String? color;

  const CartItem({
    required this.id,
    required this.productId,
    required this.name,
    required this.imageUrl,
    required this.price,
    this.quantity = 1,
    this.size,
    this.color,
  });

  double get total => price * quantity;
}
