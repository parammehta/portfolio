import { useEffect, useRef, useState } from 'react';
import RouterLink from 'next/link';
import { msToNum } from 'utils/style';
import { tokens } from 'components';
import { useId } from 'react';
import styles from './Navbar.module.css';

export const NavGroup = ({
  label,
  pathname,
  children,
  isActive,
  forceOpen,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const groupRef = useRef();
  const itemRefs = useRef([]);
  const hoverTimeoutRef = useRef();
  const submenuId = useId();

  // Compute open state: show if not dismissed AND (hovered || focusedWithin || forceOpen)
  const open = !dismissed && (hovered || focusedWithin || forceOpen);

  // Handle keyboard navigation
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      setDismissed(true);
      setFocusedIndex(-1);
      setFocusedWithin(false);
      groupRef.current?.querySelector(`[data-navbar-link]`)?.focus();
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
          groupRef.current?.querySelector(`[data-navbar-link]`)?.focus();
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

  // Focus item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  // Reset dismissed when nothing is keeping the menu open
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
  }, [open]);

  // Hover intent
  const handlePointerEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(true);
  };

  const handlePointerLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
    }, msToNum(tokens.base.durationXS));
  };

  const handleNavItemClick = e => {
    onClick?.(e);
    setDismissed(true);
    setFocusedIndex(-1);
    setFocusedWithin(false);
  };

  const handleGroupBlur = e => {
    // Close when focus leaves the group entirely
    if (!groupRef.current?.contains(e.relatedTarget)) {
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

      <div
        className={styles.submenu}
        data-open={open}
        id={submenuId}
      >
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
              ref={el => (itemRefs.current[index] = el)}
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
