import { APP_DOMAIN, APP_NAME } from "./appConfig";

/**
 * JSON-LD builders — each returns a plain object we stringify into a
 * <script type="application/ld+json"> tag. Keeps SSR markup clean and
 * lets Google surface rich results (sitelinks, course cards, Q&A).
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: APP_DOMAIN,
    logo: `${APP_DOMAIN}/og.png`,
    sameAs: ["https://www.instagram.com/taamun.sa"],
    description:
      "تطبيق ويب للتمعّن القرآني خلال ٢٨ يوماً — رحلة يومية قصيرة من الآية والسؤال والتمرين.",
    inLanguage: "ar",
  } as const;
}

export function courseSchema(input: {
  slug: string;
  title: string;
  description: string;
  durationDays: number;
  creatorName: string;
  createdAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.title,
    description: input.description,
    provider: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_DOMAIN,
    },
    author: {
      "@type": "Person",
      name: input.creatorName,
    },
    url: `${APP_DOMAIN}/journey/${input.slug}`,
    inLanguage: "ar",
    educationalLevel: "Beginner",
    numberOfCredits: input.durationDays,
    timeRequired: `P${input.durationDays}D`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: `PT5M`, // ~5 minutes per day
    },
    ...(input.createdAt ? { datePublished: input.createdAt } : {}),
  } as const;
}

export function articleSchema(input: {
  id: string;
  title: string;
  body: string;
  displayName: string;
  createdAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: input.title,
    articleBody: input.body,
    author: {
      "@type": "Person",
      name: input.displayName,
    },
    url: `${APP_DOMAIN}/threads/${input.id}`,
    datePublished: input.createdAt,
    inLanguage: "ar",
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_DOMAIN,
    },
  } as const;
}

export function breadcrumbSchema(
  crumbs: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  } as const;
}

export function faqSchema(
  pairs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((p) => ({
      "@type": "Question",
      name: p.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: p.answer,
      },
    })),
  } as const;
}

/**
 * Stringifies a schema object into JSON suitable for `<script>` injection.
 * Escapes `</` sequences to prevent HTML-injection escape in the script.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
