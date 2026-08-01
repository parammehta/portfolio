import { Children, type ComponentType, type HTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react';
import { Code, Heading, Icon, Link, List, ListItem, Text } from 'components';
import styles from './PostMarkdown.module.css';

interface PostHeadingLinkProps {
  id: string;
}

const PostHeadingLink = ({ id }: PostHeadingLinkProps) => {
  return (
    <a className={styles.headingLink} href={`#${id}`} aria-label="Link to heading">
      <Icon icon="link" />
    </a>
  );
};

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
  id?: string;
}

const PostH1 = ({ children, id, ...rest }: HeadingProps) => (
  <Heading className={styles.heading} id={id} level={2} as="h1" {...rest}>
    <PostHeadingLink id={id!} />
    {children}
  </Heading>
);

const PostH2 = ({ children, id, ...rest }: HeadingProps) => (
  <Heading className={styles.heading} id={id} level={3} as="h2" {...rest}>
    <PostHeadingLink id={id!} />
    {children}
  </Heading>
);

const PostH3 = ({ children, id, ...rest }: HeadingProps) => (
  <Heading className={styles.heading} id={id} level={4} as="h3" {...rest}>
    <PostHeadingLink id={id!} />
    {children}
  </Heading>
);

const PostH4 = ({ children, id, ...rest }: HeadingProps) => (
  <Heading className={styles.heading} id={id} level={5} as="h4" {...rest}>
    <PostHeadingLink id={id!} />
    {children}
  </Heading>
);

interface PostParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

const PostParagraph = ({ children, ...rest }: PostParagraphProps) => {
  const hasSingleChild = Children.count(children) === 1;
  const firstChild = Children.toArray(children)[0];

  if (hasSingleChild && (firstChild as React.ReactElement)?.type === PostImage) {
    return children;
  }

  return (
    <Text className={styles.paragraph} size="l" as="p" {...rest}>
      {children}
    </Text>
  );
};

const PostLink = ({ ...props }: HTMLAttributes<HTMLAnchorElement> & { href?: string }) => <Link {...props} />;

const PostUl = (props: HTMLAttributes<HTMLUListElement>) => {
  return <List className={styles.list} {...props} />;
};

const PostOl = (props: HTMLAttributes<HTMLOListElement>) => {
  return <List className={styles.list} ordered {...props} />;
};

interface PostLiProps extends HTMLAttributes<HTMLLIElement> {
  children?: ReactNode;
}

const PostLi = ({ children, ...props }: PostLiProps) => {
  return <ListItem {...props}>{children}</ListItem>;
};

interface PostCodeProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

const PostCode = ({ children, ...rest }: PostCodeProps) => (
  <code className={styles.code} {...rest}>
    {children}
  </code>
);

const PostPre = (props: HTMLAttributes<HTMLPreElement>) => {
  return (
    <div className={styles.pre}>
      <Code {...props} />
    </div>
  );
};

const PostBlockquote = (props: HTMLAttributes<HTMLQuoteElement>) => {
  return <blockquote className={styles.blockquote} {...props} />;
};

const PostHr = (props: HTMLAttributes<HTMLHRElement>) => {
  return <hr className={styles.hr} {...props} />;
};

const PostStrong = (props: HTMLAttributes<HTMLElement>) => {
  return <strong className={styles.strong} {...props} />;
};

const PostImage = ({ src, alt, width, height, ...rest }: ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <img
      className={styles.image}
      src={src}
      decoding="async"
      loading="lazy"
      alt={alt}
      width={width}
      height={height}
      {...rest}
    />
  );
};

interface EmbedProps {
  src: string;
}

const Embed = ({ src }: EmbedProps) => {
  return (
    <div className={styles.embed}>
      <iframe src={src} loading="lazy" />
    </div>
  );
};

// MDX maps each tag to a component that receives that tag's own props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postMarkdown: Record<string, ComponentType<any>> = {
  h1: PostH1,
  h2: PostH2,
  h3: PostH3,
  h4: PostH4,
  p: PostParagraph,
  a: PostLink,
  ul: PostUl,
  ol: PostOl,
  li: PostLi,
  pre: PostPre,
  code: PostCode,
  blockquote: PostBlockquote,
  hr: PostHr,
  img: PostImage,
  strong: PostStrong,
  Embed,
};
