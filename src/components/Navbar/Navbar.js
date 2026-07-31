import { useEffect, useRef, useState } from 'react';
import { Icon, Monogram, tokens, Transition } from 'components';
import { useTheme } from 'components/ThemeProvider';
import { useAppContext, useScrollToHash, useWindowSize } from 'hooks';
import RouterLink from 'next/link';
import { useRouter } from 'next/router';
import { cssProps, media, msToNum, numToMs, classes } from 'utils/style';
import { NavToggle } from './NavToggle';
import { NavGroup } from './NavbarSubmenu';
import styles from './Navbar.module.css';
import { ThemeToggle } from './ThemeToggle';
import { navLinks, socialLinks, hashIds } from './navData';

export const Navbar = () => {
  const [current, setCurrent] = useState();
  const [target, setTarget] = useState();
  const [scrollActive, setScrollActive] = useState(null);
  const { themeId } = useTheme();
  const { menuOpen, dispatch } = useAppContext();
  const { route, asPath } = useRouter();
  const windowSize = useWindowSize();
  const headerRef = useRef();
  const isMobile = windowSize.width <= media.mobile || windowSize.height <= 696;
  const scrollToHash = useScrollToHash();

  useEffect(() => {
    // Prevent ssr mismatch by storing this in state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(asPath);
  }, [asPath]);

  // Handle smooth scroll nav items
  useEffect(() => {
    if (!target || route !== '/') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(`${route}${target}`);
    scrollToHash(target, () => setTarget(null));
  }, [route, scrollToHash, target]);

  // Scroll-spy: highlight nav link for the section currently in view
  useEffect(() => {
    if (route !== '/') return;

    const intersecting = new Set();

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });
        const active = hashIds.find(id => intersecting.has(id)) ?? null;
        setScrollActive(active);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    hashIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [route]);

  // Handle swapping the theme when intersecting with inverse themed elements
  useEffect(() => {
    const navItems = document.querySelectorAll('[data-navbar-item]');
    const inverseTheme = themeId === 'dark' ? 'light' : 'dark';
    const { innerHeight } = window;

    let inverseMeasurements = [];
    let navItemMeasurements = [];

    const isOverlap = (rect1, rect2, scrollY) => {
      return !(rect1.bottom - scrollY < rect2.top || rect1.top - scrollY > rect2.bottom);
    };

    const resetNavTheme = () => {
      for (const measurement of navItemMeasurements) {
        measurement.element.dataset.theme = '';
      }
    };

    const handleInversion = () => {
      const invertedElements = document.querySelectorAll(
        `[data-theme='${inverseTheme}'][data-invert]`
      );

      if (!invertedElements) return;

      inverseMeasurements = Array.from(invertedElements).map(item => ({
        element: item,
        top: item.offsetTop,
        bottom: item.offsetTop + item.offsetHeight,
      }));

      const { scrollY } = window;

      resetNavTheme();

      for (const inverseMeasurement of inverseMeasurements) {
        if (
          inverseMeasurement.top - scrollY > innerHeight ||
          inverseMeasurement.bottom - scrollY < 0
        ) {
          continue;
        }

        for (const measurement of navItemMeasurements) {
          if (isOverlap(inverseMeasurement, measurement, scrollY)) {
            measurement.element.dataset.theme = inverseTheme;
          } else {
            measurement.element.dataset.theme = '';
          }
        }
      }
    };

    // Currently only the light theme has dark full-width elements
    if (themeId === 'light') {
      navItemMeasurements = Array.from(navItems).map(item => {
        const rect = item.getBoundingClientRect();

        return {
          element: item,
          top: rect.top,
          bottom: rect.bottom,
        };
      });

      document.addEventListener('scroll', handleInversion);
      handleInversion();
    }

    return () => {
      document.removeEventListener('scroll', handleInversion);
      resetNavTheme();
    };
  }, [themeId, windowSize, asPath]);

  // Check if a nav item should be active
  const getCurrent = (url = '') => {
    const nonTrailing = current?.endsWith('/') ? current.slice(0, -1) : current;

    if (!nonTrailing) return '';
    if (url === nonTrailing) return 'page';
    if (url !== '/' && nonTrailing.startsWith(`${url}/`)) return 'true';
    return '';
  };

  // Store the current hash to scroll to
  const handleNavItemClick = event => {
    const hash = event.currentTarget.href.split('#')[1];
    setTarget(null);

    if (hash && route === '/') {
      setTarget(`#${hash}`);
      event.preventDefault();
    }
  };

  const handleMobileNavClick = event => {
    handleNavItemClick(event);
    if (menuOpen) dispatch({ type: 'toggleMenu' });
  };

  const getIsActive = ({ pathname, match }) => {
    if (pathname.startsWith('/#')) {
      if (route === '/' && scrollActive === pathname.slice(2)) return 'page';
      return undefined;
    }
    if (match) {
      const result = getCurrent(match);
      return result || undefined;
    }
    const result = getCurrent(pathname);
    return result || undefined;
  };

  // Check if Experience section is in view for forceOpen
  const experienceIds = ['experience', 'experience-intuit', 'experience-rivian', 'experience-walmart'];
  const inExperience = route === '/' && experienceIds.includes(scrollActive);

  // Flatten mobile items to keep stagger indices consistent
  const mobileItems = navLinks.flatMap(link => [
    { ...link, nested: false },
    ...(link.children ?? []).map(child => ({ ...child, nested: true })),
  ]);

  return (
    <header className={styles.navbar} ref={headerRef}>
      <RouterLink
        href={route === '/' ? '/#intro' : '/'}
        scroll={false}
        data-navbar-item
        className={styles.logo}
        aria-label="Param Mehta, Developer"
        onClick={handleMobileNavClick}
      >
        <Monogram highlight />
      </RouterLink>
      <NavToggle onClick={() => dispatch({ type: 'toggleMenu' })} menuOpen={menuOpen} />
      <nav className={styles.nav}>
        <div className={styles.navList}>
          {navLinks.map(link => {
            const isActive = getIsActive(link);

            if (link.children) {
              return (
                <NavGroup
                  key={link.label}
                  label={link.label}
                  pathname={link.pathname}
                  isActive={isActive}
                  forceOpen={inExperience}
                  // eslint-disable-next-line react/no-children-prop
                  children={link.children.map(child => ({
                    ...child,
                    isActive: getIsActive(child),
                  }))}
                  onClick={handleNavItemClick}
                />
              );
            }

            return (
              <RouterLink
                href={link.pathname}
                scroll={false}
                key={link.label}
                data-navbar-item
                className={styles.navLink}
                aria-current={isActive}
                onClick={handleNavItemClick}
              >
                {link.label}
              </RouterLink>
            );
          })}
        </div>
        <NavbarIcons desktop />
      </nav>
      <Transition unmount in={menuOpen} timeout={msToNum(tokens.base.durationL)}>
        {visible => (
          <nav className={styles.mobileNav} data-visible={visible}>
            {mobileItems.map((item, index) => (
              <RouterLink
                href={item.pathname}
                scroll={false}
                key={`${item.label}-${index}`}
                className={classes(styles.mobileNavLink, item.nested && styles.mobileNavSubLink)}
                data-visible={visible}
                aria-current={getIsActive(item)}
                onClick={handleMobileNavClick}
                style={cssProps({
                  transitionDelay: numToMs(
                    Number(msToNum(tokens.base.durationS)) + index * 50
                  ),
                })}
              >
                {item.label}
              </RouterLink>
            ))}
            <NavbarIcons />
            <ThemeToggle isMobile />
          </nav>
        )}
      </Transition>
      {!isMobile && <ThemeToggle data-navbar-item />}
    </header>
  );
};

const NavbarIcons = ({ desktop }) => (
  <div className={styles.navIcons}>
    {socialLinks.map(({ label, url, icon }) => (
      <a
        key={label}
        data-navbar-item={desktop || undefined}
        className={styles.navIconLink}
        aria-label={label}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon className={styles.navIcon} icon={icon} />
      </a>
    ))}
  </div>
);
