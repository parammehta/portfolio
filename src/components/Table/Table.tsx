import { type ReactNode } from 'react';
import styles from './Table.module.css';

interface TableChildProps {
  children?: ReactNode;
}

export const Table = ({ children }: TableChildProps) => <table className={styles.table}>{children}</table>;
export const TableRow = ({ children }: TableChildProps) => <tr className={styles.row}>{children}</tr>;
export const TableHead = ({ children }: TableChildProps) => <thead className={styles.head}>{children}</thead>;
export const TableBody = ({ children }: TableChildProps) => <tbody className={styles.body}>{children}</tbody>;
export const TableHeadCell = ({ children }: TableChildProps) => <th className={styles.headCell}>{children}</th>;
export const TableCell = ({ children }: TableChildProps) => <td className={styles.cell}>{children}</td>;
