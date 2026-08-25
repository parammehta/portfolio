/**
 * Types for the one part of the Worker the site's TypeScript imports:
 * `src/utils/analyticsEvents.test.ts` compares this allowlist against
 * `analyticsEvents` so the two lists can never drift again.
 *
 * The Worker itself is plain JS (it has no build step), so this file exists
 * purely to give that import a type instead of an implicit `any`.
 */
export declare const ALLOWED_EVENTS: Set<string>;
export declare function parseUserAgent(
  ua: string,
  chMobile?: string
): { device: string; browser: string; os: string };
export declare function pagePath(referer: string): string;
