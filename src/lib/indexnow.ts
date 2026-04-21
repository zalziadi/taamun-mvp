/**
 * IndexNow — instant-indexing protocol used by Bing, Yandex, and
 * search engines that federate with them (DuckDuckGo derives from
 * Bing). Google does NOT participate — it will still discover us
 * via robots.txt + sitemap.xml, but on its own schedule.
 *
 * Key lives at /public/{key}.txt and on this constant. The key is
 * our proof of ownership for the host.
 */

import { APP_DOMAIN } from "./appConfig";

export const INDEXNOW_KEY = "022cf7be2973d3841bdd98dcfc8db501";
export const INDEXNOW_KEY_LOCATION = `${APP_DOMAIN}/${INDEXNOW_KEY}.txt`;

/**
 * Submit URLs to IndexNow. Fire-and-forget; errors are logged, never thrown.
 * Use when publishing new content (e.g., after creator publish, after new thread).
 */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const host = new URL(APP_DOMAIN).host;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls.slice(0, 10000), // IndexNow limit
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.warn(`[indexnow] ${endpoint} failed:`, err);
      }
    })
  );
}
