import { Icon } from 'components/Icon';
import { Link } from 'components/Link';
import { classes } from 'utils/style';
import styles from './Breadcrumbs.module.css';

export const Breadcrumbs = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={classes(styles.breadcrumbs, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className={styles.item}>
              {index > 0 && (
                <Icon
                  className={styles.separator}
                  icon="chevronRight"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
