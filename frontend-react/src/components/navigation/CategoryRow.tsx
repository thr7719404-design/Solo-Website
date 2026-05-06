import { CategoryIcon } from './CategoryIcons';
import styles from './CategoryRow.module.css';

interface Props {
  name: string;
  isActive: boolean;
  hasChildren: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  index: number;
}

export default function CategoryRow({
  name,
  isActive,
  hasChildren,
  onClick,
  onMouseEnter,
  onMouseLeave,
  index,
}: Props) {
  return (
    <button
      type="button"
      className={`${styles.row} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-expanded={hasChildren ? isActive : undefined}
      style={{ ['--row-index' as string]: index }}
    >
      <span className={styles.iconBox} aria-hidden="true">
        <CategoryIcon name={name} />
      </span>
      <span className={styles.name}>{name}</span>
      {hasChildren && (
        <svg
          className={styles.chevron}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      )}
    </button>
  );
}
