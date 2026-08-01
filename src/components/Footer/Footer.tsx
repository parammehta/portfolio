import { Link, Text } from 'components';
import { classes } from 'utils/style';
import styles from './Footer.module.css';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => (
  <footer className={classes(styles.footer, className)}>
    <Text size="s" align="center">
      <span className={styles.date}>{`© ${new Date().getFullYear()} Param Mehta.`}</span>
      <Link secondary className={styles.link} href="/humans.txt" target="_self">
        Crafted by yours truly
      </Link>
    </Text>
  </footer>
);
