import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

interface OgImageProps {
  title: string;
  date: string;
  banner: string;
  timecode: string;
}

// Mixed into the cache key below so an edit to the OG template (markup or
// styles) invalidates every cached card, not just ones whose props changed —
// previously the key only covered title/date/banner/timecode.
const templateHash = createHash('md5')
  .update(
    [
      fs.readFileSync(path.join(process.cwd(), 'src/pages/articles/og-image.html'), 'utf-8'),
      fs.readFileSync(path.join(process.cwd(), 'src/pages/articles/og-image.css'), 'utf-8'),
    ].join('\0')
  )
  .digest('hex');

export async function generateOgImage(props: OgImageProps): Promise<string> {
  const params = new URLSearchParams(props as unknown as Record<string, string>);
  const url = `file:${path.join(
    process.cwd(),
    `src/pages/articles/og-image.html?${params}`
  )}`;

  const hash = createHash('md5').update(`${url}\0${templateHash}`).digest('hex');
  const ogImageDir = path.join(process.cwd(), `public/og`);
  // JPEG rather than PNG: these are photographic-density screenshots (banner
  // image + text), and PNG was costing ~8x the bytes for no visual benefit.
  const imageName = `${hash}.jpg`;
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
  // --no-sandbox is required on CI runners (GitHub Actions), where Chrome's
  // sandbox cannot start; the dev-shm/gpu flags avoid crashes in that headless
  // environment. Locally these are harmless no-ops.
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot({ type: 'jpeg', quality: 85 });
  await browser.close();

  fs.mkdirSync(ogImageDir, { recursive: true });
  fs.writeFileSync(imagePath, buffer);

  return publicPath;
}
