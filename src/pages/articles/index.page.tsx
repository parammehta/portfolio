import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { POSTS_PATH, postFilePaths } from 'utils/mdx';
import { formatTimecode } from 'utils/timecode';

export { Articles as default } from './Articles';

export function getStaticProps() {
  const allPosts = postFilePaths.map(filePath => {
    const source = fs.readFileSync(path.join(POSTS_PATH, filePath));
    const { data, content } = matter(source);

    const { time } = readingTime(content);
    const timecode = formatTimecode(time);

    return {
      ...(data as Record<string, unknown>),
      timecode,
      slug: filePath.replace(/\.mdx?$/, ''),
    } as { featured?: boolean; date?: string; timecode: string; slug: string };
  });

  const featured = allPosts.find(post => post.featured);

  const posts = allPosts
    .filter(post => post.slug !== featured!.slug)
    .sort((a, b) => {
      return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
    })
    .reverse();

  return {
    props: { posts, featured },
  };
}
