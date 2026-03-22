import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/agent/", "/client/", "/talent/", "/api/", "/onboarding"],
    },
    sitemap: "https://castingbrief.com/sitemap.xml",
  };
}
