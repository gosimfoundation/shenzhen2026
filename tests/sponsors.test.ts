import { existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import sponsorsData from "../src/json/Sponsors.json";

type Partner = {
  category: string;
  image: string;
  name: string;
  url: string;
};

const partners = sponsorsData.partners as Partner[];
const sponsorImagesDirectory = resolve("public/images/sponsors");

describe("current sponsors and supporting organizations", () => {
  it("requires complete metadata and a working image reference", () => {
    const categoryIds = new Set(
      sponsorsData.categories.map((category) => category.id),
    );

    for (const partner of partners) {
      expect(partner.name.trim()).not.toBe("");
      expect(categoryIds.has(partner.category)).toBe(true);
      expect(partner.image.trim()).not.toBe("");
      expect(existsSync(resolve(sponsorImagesDirectory, partner.image))).toBe(
        true,
      );

      const website = new URL(partner.url);
      expect(["http:", "https:"]).toContain(website.protocol);
    }
  });

  it("links SAIIA to its website and uses a transparent logo", async () => {
    const saiia = partners.find(
      (partner) =>
        partner.name === "Shenzhen Artificial Intelligence Industry Association",
    );

    expect(saiia?.url).toBe("https://www.saiia.org.cn");
    expect(saiia?.image).toBe(
      "shenzhen-artificial-intelligence-industry-association-transparent.png",
    );

    const logoPath = resolve(sponsorImagesDirectory, saiia!.image);
    const metadata = await sharp(logoPath).metadata();
    const stats = await sharp(logoPath).stats();

    expect(metadata.hasAlpha).toBe(true);
    expect(stats.channels[3].min).toBe(0);
    expect(stats.channels[3].max).toBe(255);
  });
});
