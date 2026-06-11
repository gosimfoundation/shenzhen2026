#!/usr/bin/env node

/**
 * Fetches live GitHub star counts and repo creation dates,
 * then updates src/json/Marquee.json with fresh data.
 *
 * Usage:
 *   node scripts/update-marquee-stars.js
 *
 * Optionally set GITHUB_TOKEN env var for higher rate limits (5000/hr vs 60/hr).
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MARQUEE_PATH = join(__dirname, "..", "src", "json", "Marquee.json");

function extractOwnerRepo(url) {
  // e.g. "https://github.com/huggingface/transformers" → ["huggingface", "transformers"]
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function monthsBetween(dateStr, now) {
  const created = new Date(dateStr);
  return (
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth())
  );
}

async function fetchRepo(owner, repo, token) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "gosim-marquee-updater",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );

  if (res.status === 404) {
    console.warn(`  [WARN] Repo not found: ${owner}/${repo}`);
    return null;
  }
  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    console.warn(
      `  [WARN] GitHub API ${res.status} for ${owner}/${repo} (rate-limit remaining: ${remaining})`
    );
    return null;
  }
  return res.json();
}

async function main() {
  const token = process.env.GITHUB_TOKEN || "";
  const raw = await readFile(MARQUEE_PATH, "utf-8");
  const projects = JSON.parse(raw);
  const now = new Date();

  let updated = 0;
  let failed = 0;

  // Process sequentially to respect rate limits
  for (const project of projects) {
    const parsed = extractOwnerRepo(project.url);
    if (!parsed) {
      console.warn(`  [SKIP] Cannot parse GitHub URL: ${project.url}`);
      failed++;
      continue;
    }

    const data = await fetchRepo(parsed.owner, parsed.repo, token);
    if (!data) {
      failed++;
      continue;
    }

    const newStars = Math.round((data.stargazers_count / 1000) * 10) / 10; // e.g. 135.2
    const newAge = monthsBetween(data.created_at, now);

    const oldStars = project.stars;
    const oldAge = project.age;

    project.stars = newStars;
    project.age = newAge;

    if (oldStars !== newStars || oldAge !== newAge) {
      console.log(
        `  ${project.name}: stars ${oldStars}k → ${newStars}k, age ${oldAge} → ${newAge} months`
      );
      updated++;
    }
  }

  await writeFile(MARQUEE_PATH, JSON.stringify(projects, null, 2) + "\n");

  console.log(
    `\nDone. ${updated} projects updated, ${failed} failed, ${projects.length - updated - failed} unchanged.`
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
