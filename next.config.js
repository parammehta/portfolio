// No `output: 'export'` here anymore. The site was a static export because its
// host was an S3 bucket, which can only serve files; on Vercel the same pages
// still prerender to static HTML at build time, but the app can also carry
// server code. That is what lets the contact form live at `/api/message` in
// this repo instead of in a separately deployed Lambda.
module.exports = {
  reactStrictMode: true,
  trailingSlash: true,
  pageExtensions: ['page.tsx', 'page.ts', 'api.ts'],
  webpack(config, { isServer }) {
    // Run custom scripts
    if (isServer) {
      require('./scripts/generate-sitemap');
      require('./scripts/draco');
    }

    // Emit every stylesheet into one chunk that all routes share.
    //
    // By default each route gets its own CSS chunk, and Next removes the old
    // one the moment a route commits. Anything still mounted from the outgoing
    // route — a page playing an exit animation — then renders with no styles at
    // all, losing its grid and max-width and stretching to full width until it
    // unmounts. One shared chunk is never unloaded, so that can't happen.
    //
    // It also comes out smaller than the split version: merging drops the rules
    // the per-route chunks each duplicated, so one 107KB (18KB gzipped) file
    // replaces 144KB across eleven, and it is fetched once for the whole site.
    if (!isServer && config.optimization?.splitChunks?.cacheGroups) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.css$/,
        chunks: 'all',
        enforce: true,
      };
    }

    // Import `svg` files as React components
    config.module.rules.push({
      test: /\.svg$/,
      resourceQuery: { not: [/url/] },
      use: [{ loader: '@svgr/webpack', options: { svgo: false } }],
    });

    // Import videos and fonts
    config.module.rules.push({
      test: /\.(mp4|woff|woff2)$/i,
      type: 'asset/resource',
    });

    // Force url import with `?url`
    config.module.rules.push({
      resourceQuery: /url/,
      type: 'asset/resource',
    });

    // Import `.glsl` shaders
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });

    return config;
  },
};
