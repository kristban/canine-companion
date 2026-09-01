import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/getArticles";
import { getBreeds } from "@/lib/getBreeds";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, breeds] = await Promise.all([getArticles(), getBreeds()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/breeds`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/guides/${article.id}`,
    lastModified: article.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const breedRoutes: MetadataRoute.Sitemap = breeds.map((breed) => ({
    url: `${SITE_URL}/breeds/${breed.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes, ...breedRoutes];
}
