import 'package:flutter/material.dart';

class SectionEditorShell extends StatelessWidget {
  final Widget icon;
  final String title;
  final String subtitle;

  final bool isActive;
  final ValueChanged<bool> onActiveChanged;

  final Widget body;
  final Widget? rightPanel;

  final bool isSaving;
  final bool canSave;
  final VoidCallback onCancel;
  final VoidCallback onSave;

  const SectionEditorShell({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isActive,
    required this.onActiveChanged,
    required this.body,
    this.rightPanel,
    required this.isSaving,
    required this.canSave,
    required this.onCancel,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dialog(
      insetPadding: const EdgeInsets.all(18),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1120, maxHeight: 760),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Column(
            children: [
              _Header(
                icon: icon,
                title: title,
                subtitle: subtitle,
                isActive: isActive,
                onActiveChanged: onActiveChanged,
                onClose: () => Navigator.of(context).pop(),
              ),
              const Divider(height: 1),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, c) {
                    final wide = c.maxWidth >= 1100 && rightPanel != null;

                    final content = Scrollbar(
                      thumbVisibility: true,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(18),
                        child: body,
                      ),
                    );

                    if (!wide) return content;

                    return Row(
                      children: [
                        Expanded(child: content),
                        const VerticalDivider(width: 1),
                        SizedBox(
                          width: 340,
                          child: Scrollbar(
                            thumbVisibility: true,
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(18),
                              child: rightPanel!,
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              const Divider(height: 1),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                color: theme.colorScheme.surface,
                child: Row(
                  children: [
                    Text(
                      isSaving
                          ? "Saving..."
                          : (canSave ? "Unsaved changes" : "No changes"),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isSaving
                            ? theme.colorScheme.primary
                            : (canSave ? Colors.orange[800] : Colors.grey[600]),
                      ),
                    ),
                    const Spacer(),
                    OutlinedButton(
                      onPressed: isSaving ? null : onCancel,
                      child: const Text("Cancel"),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: (!canSave || isSaving) ? null : onSave,
                      icon: isSaving
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check),
                      label: Text(isSaving ? "Saving" : "Save Changes"),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final Widget icon;
  final String title;
  final String subtitle;
  final bool isActive;
  final ValueChanged<bool> onActiveChanged;
  final VoidCallback onClose;

  const _Header({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isActive,
    required this.onActiveChanged,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 14, 10, 14),
      color: theme.colorScheme.surface,
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.10),
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: icon,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: Colors.grey[600])),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isActive
                  ? Colors.green.withOpacity(0.12)
                  : Colors.grey.withOpacity(0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              children: [
                Text(
                  isActive ? "Active" : "Draft",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isActive ? Colors.green[800] : Colors.grey[700],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 8),
                Switch(
                  value: isActive,
                  onChanged: onActiveChanged,
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.close),
            tooltip: "Close",
          ),
        ],
      ),
    );
  }
}
