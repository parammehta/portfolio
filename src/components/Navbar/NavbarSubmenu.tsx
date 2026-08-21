import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, FocusEvent } from 'react';
import RouterLink from 'next/link';
import { msToNum } from 'utils/style';
import { tokens } from 'refract-ui';
import { useId } from 'react';
import styles from './Navbar.module.css';

interface NavChild {
  label: string;
  pathname: string;
  isActive?: React.AriaAttributes['aria-current'];
}

interface NavGroupProps {
  label: string;
  pathname: string;
  children: NavChild[];
  isActive?: React.AriaAttributes['aria-current'];
  forceOpen?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export const NavGroup = ({
  label,
  pathname,
  children,
  isActive,
  forceOpen,
  onClick,
}: NavGroupProps) => {
  const [hovered, setHovered] = useState(false);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const groupRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const submenuId = useId();

  const open = !dismissed && (hovered || focusedWithin || forceOpen);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDismissed(true);
      setFocusedIndex(-1);
      setFocusedWithin(false);
      groupRef.current?.querySelector<HTMLElement>(`[data-navbar-link]`)?.focus();
      return;
    }

    const isInList = focusedIndex >= 0;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (isInList) {
        setFocusedIndex((focusedIndex + 1) % children.length);
      } else {
        setFocusedIndex(0);
        setFocusedWithin(true);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (isInList) {
        if (focusedIndex === 0) {
          setFocusedIndex(-1);
          setFocusedWithin(false);
          groupRef.current?.querySelector<HTMLElement>(`[data-navbar-link]`)?.focus();
        } else {
          setFocusedIndex((focusedIndex - 1 + children.length) % children.length);
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      setFocusedWithin(true);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(children.length - 1);
      setFocusedWithin(true);
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]!.focus();
    }
  }, [focusedIndex]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
  }, [open]);

  const handlePointerEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(true);
  };

  const handlePointerLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
    }, msToNum(tokens.base.durationXS));
  };

  const handleNavItemClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    setDismissed(true);
    setFocusedIndex(-1);
    setFocusedWithin(false);
  };

  const handleGroupBlur = (e: FocusEvent) => {
    if (!groupRef.current?.contains(e.relatedTarget as Node)) {
      setFocusedWithin(false);
      setFocusedIndex(-1);
    }
  };

  const handleSubmenuFocus = () => {
    setDismissed(false);
    setFocusedWithin(true);
  };

  return (
    <div
      ref={groupRef}
      className={styles.navGroup}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onBlur={handleGroupBlur}
    >
      <RouterLink
        href={pathname}
        scroll={false}
        data-navbar-link
        className={styles.navLink}
        aria-current={isActive}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={submenuId}
        onClick={handleNavItemClick}
      >
        {label}
      </RouterLink>

      <div className={styles.submenu} data-open={open} id={submenuId}>
        <div
          className={styles.submenuInner}
          data-navbar-item
          onFocus={handleSubmenuFocus}
        >
          {children.map((child, index) => (
            <RouterLink
              key={child.label}
              href={child.pathname}
              scroll={false}
              ref={(el: HTMLAnchorElement | null) => {
                itemRefs.current[index] = el;
              }}
              className={styles.subLink}
              tabIndex={focusedIndex === index ? 0 : -1}
              aria-current={child.isActive}
              onClick={handleNavItemClick}
            >
              {child.label}
            </RouterLink>
          ))}
        </div>
      </div>
    </div>
  );
};
