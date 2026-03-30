class LoyaltyPageConfig {
  final String title;
  final String subtitle;
  final String ctaText;
  final String ctaUrl;
  final int spendAedThreshold;
  final int rewardAed;
  final List<LoyaltyHowItWorksItem> howItWorks;
  final List<LoyaltyFaqItem> faqs;

  const LoyaltyPageConfig({
    required this.title,
    required this.subtitle,
    required this.ctaText,
    required this.ctaUrl,
    required this.spendAedThreshold,
    required this.rewardAed,
    required this.howItWorks,
    required this.faqs,
  });

  factory LoyaltyPageConfig.fromJson(Map<String, dynamic> json) {
    return LoyaltyPageConfig(
      title: json['title'] as String,
      subtitle: json['subtitle'] as String,
      ctaText: json['ctaText'] as String,
      ctaUrl: json['ctaUrl'] as String,
      spendAedThreshold: json['spendAedThreshold'] as int,
      rewardAed: json['rewardAed'] as int,
      howItWorks: (json['howItWorks'] as List<dynamic>)
          .map((item) => LoyaltyHowItWorksItem.fromJson(item))
          .toList(),
      faqs: (json['faqs'] as List<dynamic>)
          .map((item) => LoyaltyFaqItem.fromJson(item))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'subtitle': subtitle,
      'ctaText': ctaText,
      'ctaUrl': ctaUrl,
      'spendAedThreshold': spendAedThreshold,
      'rewardAed': rewardAed,
      'howItWorks': howItWorks.map((item) => item.toJson()).toList(),
      'faqs': faqs.map((item) => item.toJson()).toList(),
    };
  }
}

class LoyaltyHowItWorksItem {
  final String icon;
  final String title;
  final String description;

  const LoyaltyHowItWorksItem({
    required this.icon,
    required this.title,
    required this.description,
  });

  factory LoyaltyHowItWorksItem.fromJson(Map<String, dynamic> json) {
    return LoyaltyHowItWorksItem(
      icon: json['icon'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'icon': icon,
      'title': title,
      'description': description,
    };
  }
}

class LoyaltyFaqItem {
  final String question;
  final String answer;

  const LoyaltyFaqItem({
    required this.question,
    required this.answer,
  });

  factory LoyaltyFaqItem.fromJson(Map<String, dynamic> json) {
    return LoyaltyFaqItem(
      question: json['question'] as String,
      answer: json['answer'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'answer': answer,
    };
  }
}
