import styles from './HamburgerButton.module.css';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function HamburgerButton({ isOpen, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`${styles.button} ${isOpen ? styles.isOpen : ''}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <span className={styles.hover} aria-hidden="true" />
      <span className={styles.lines} aria-hidden="true">
        <span className={styles.line} />
        <span className={styles.line} />
        <span className={styles.line} />
      </span>
    </button>
  );
}
