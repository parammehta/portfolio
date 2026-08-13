import { classes } from 'utils/style';
import styles from './Icon.module.css';
import ArrowLeft from './svg/arrow-left.svg';
import ArrowRight from './svg/arrow-right.svg';
import Article from './svg/articles.svg';
import Check from './svg/check.svg';
import ChevronRight from './svg/chevron-right.svg';
import Close from './svg/close.svg';
import Company from './svg/company.svg';
import Copy from './svg/copy.svg';
import Error from './svg/error.svg';
import Figma from './svg/figma.svg';
import Github from './svg/github.svg';
import Link from './svg/link.svg';
import Linkedin from './svg/linkedin.svg';
import Menu from './svg/menu.svg';
import Pause from './svg/pause.svg';
import Play from './svg/play.svg';
import Send from './svg/send.svg';
import Skills from './svg/skills.svg';
import Storybook from './svg/storybook.svg';
import Twitter from './svg/twitter.svg';

export const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  articles: Article,
  company: Company,
  check: Check,
  chevronRight: ChevronRight,
  close: Close,
  copy: Copy,
  error: Error,
  figma: Figma,
  github: Github,
  link: Link,
  linkedin: Linkedin,
  menu: Menu,
  pause: Pause,
  play: Play,
  send: Send,
  skills: Skills,
  storybook: Storybook,
  twitter: Twitter,
};

export type IconName = keyof typeof icons;

export interface IconProps {
  icon: IconName;
  className?: string;
  [key: string]: unknown;
}

export const Icon = ({ icon, className, ...rest }: IconProps) => {
  const IconComponent = icons[icon];

  return (
    <IconComponent aria-hidden className={classes(styles.icon, className)} {...rest} />
  );
};
