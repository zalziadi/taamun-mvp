import type { MetadataRoute } from "next";
import { APP_DOMAIN } from "@/lib/appConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/discover",
          "/threads",
          "/journey/",
          "/creator/by/",
          "/creator/leaderboard",
          "/creator/guide",
          "/faq",
          "/shared/",
          "/book",
          "/about",
          "/sources",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/api/",
          "/auth",
          "/auth/",
          "/checkout",
          "/checkout/",
        ],
      },
    ],
    sitemap: `${APP_DOMAIN}/sitemap.xml`,
    host: APP_DOMAIN,
  };
}
