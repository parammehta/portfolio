import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

interface OgImageProps {
  title: string;
  date: string;
  banner: string;
  timecode: string;
}

export async function generateOgImage(props: OgImageProps): Promise<string> {
  const params = new URLSearchParams(props as unknown as Record<string, string>);
  const url = `file:${path.join(
    process.cwd(),
    `src/pages/articles/og-image.html?${params}`
  )}`;

  const hash = createHash('md5').update(url).digest('hex');
  const ogImageDir = path.join(process.cwd(), `public/og`);
  const imageName = `${hash}.png`;
  const imagePath = `${ogImageDir}/${imageName}`;
  const publicPath = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/og/${imageName}`;

  try {
    fs.statSync(imagePath);
    return publicPath;
  } catch {
    // file does not exist, so we create it
  }

  // Puppeteer is ESM-only, so import it dynamically to avoid bundling it into
  // the webpack build (this only runs in getStaticProps at build time).
  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot();
  await browser.close();

  fs.mkdirSync(ogImageDir, { recursive: true });
  fs.writeFileSync(imagePath, buffer);

  return publicPath;
}
