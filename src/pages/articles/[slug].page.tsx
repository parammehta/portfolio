import fs from 'fs';
import path from 'path';
import { Post, postMarkdown } from 'layouts/Post';
import { bundleMDX } from 'mdx-bundler';
import { getMDXComponent } from 'mdx-bundler/client';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { useMemo } from 'react';
import type { MDXComponents } from 'mdx/types';
import readingTime from 'reading-time';
import rehypeImgSize from 'rehype-img-size';
import rehypeMinify from 'rehype-preset-minify';
import rehypeSlug from 'rehype-slug';
import { POSTS_PATH, postFilePaths } from 'utils/mdx';
import { formatTimecode } from 'utils/timecode';
import rehypePrism from '@mapbox/rehype-prism';
import { generateOgImage } from './og-image';

interface PostFrontmatter {
  title: string;
  abstract: string;
  date: string;
  banner: string;
  featured: boolean;
  draft?: boolean;
}

interface PostPageProps {
  frontmatter: PostFrontmatter;
  code: string;
  timecode: string;
  ogImage: string;
  slug: string;
}

export default function PostPage({ frontmatter, code, timecode, ogImage, slug }: PostPageProps) {
  // This is mdx-bundler's documented usage pattern: compiled MDX code is only
  // available at runtime, so the component must be created here, memoized on `code`.
  const MDXComponent = useMemo(() => getMDXComponent(code), [code]);

  return (
    <Post timecode={timecode} ogImage={ogImage} slug={slug} {...frontmatter}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <MDXComponent components={postMarkdown as MDXComponents} />
    </Post>
  );
}

export const getStaticProps: GetStaticProps<PostPageProps> = async ({ params }) => {
  const postFilePath = path.join(POSTS_PATH, `${params!.slug}.mdx`);
  const source = fs.readFileSync(postFilePath, 'utf-8');

  const { code, frontmatter, matter } = await bundleMDX({
    source,
    mdxOptions(options) {
      options.remarkPlugins = [...(options.remarkPlugins ?? [])];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypePrism,
        rehypeSlug,
        rehypeMinify,
        [rehypeImgSize, { dir: 'public' }],
      ];

      return options;
    },
  });

  const { time } = readingTime(matter.content);
  const timecode = formatTimecode(time);

  const ogImage = await generateOgImage({
    title: frontmatter.title,
    date: frontmatter.date,
    banner: frontmatter.banner,
    timecode,
  });

  return {
    props: { code, frontmatter: frontmatter as PostFrontmatter, timecode, ogImage, slug: params!.slug as string },
    notFound: Boolean(process.env.NODE_ENV === 'production' && frontmatter.draft),
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = postFilePaths
    .map(filePath => filePath.replace(/\.mdx?$/, ''))
    .map(slug => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};
