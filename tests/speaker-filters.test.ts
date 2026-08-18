import { beforeEach, describe, expect, it } from "vitest";
import { setupSpeakerFilters } from "../src/scripts/speaker-filters";

const categories = ["edge", "os", "models", "robotics"];

const controls = (surface: string) => `
  <div data-filter-group data-surface="${surface}">
    <button data-speaker-filter-control data-filter-category="all">All</button>
    ${categories
      .map(
        (category) =>
          `<button data-speaker-filter-control data-filter-category="${category}">${category}</button>`,
      )
      .join("")}
  </div>
`;

const selectedOn = (surface: string) =>
  Array.from(
    document.querySelectorAll(
      `[data-surface="${surface}"] [data-speaker-filter-control][aria-pressed="true"]`,
    ),
  ).map((control) => control.getAttribute("data-filter-category"));

const click = (surface: string, category: string) => {
  const control = document.querySelector<HTMLButtonElement>(
    `[data-surface="${surface}"] [data-filter-category="${category}"]`,
  );
  expect(control).not.toBeNull();
  control?.click();
};

describe("speaker track filters", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      ${controls("mobile")}
      <section
        data-speaker-filter-state
        data-summary-all="{visible} speakers · All"
        data-summary-selected="{visible} speakers · {selected} selected"
      >
        ${controls("sidebar")}
        <output data-speaker-filter-summary></output>
        <div data-speaker-filter-card data-filter-category="edge"></div>
        <div data-speaker-filter-card data-filter-category="os"></div>
        <div data-speaker-filter-card data-filter-category="models robotics"></div>
        <p data-speaker-filter-empty hidden></p>
      </section>
    `;
  });

  it("keeps both filter surfaces in sync while categories are toggled", () => {
    setupSpeakerFilters();

    for (const category of categories) click("sidebar", category);

    expect(selectedOn("sidebar")).toEqual(categories);
    expect(selectedOn("mobile")).toEqual(categories);

    click("sidebar", "os");

    const remaining = ["edge", "models", "robotics"];
    expect(selectedOn("sidebar")).toEqual(remaining);
    expect(selectedOn("mobile")).toEqual(remaining);
    expect(
      document.querySelector("[data-speaker-filter-summary]")?.textContent,
    ).toBe("2 speakers · 3 selected");
  });

  it("returns to All only after the last selected category is removed", () => {
    setupSpeakerFilters();

    click("mobile", "edge");
    click("mobile", "models");
    click("mobile", "edge");

    expect(selectedOn("sidebar")).toEqual(["models"]);

    click("mobile", "models");

    expect(selectedOn("sidebar")).toEqual(["all"]);
    expect(selectedOn("mobile")).toEqual(["all"]);
    expect(
      document.querySelector("[data-speaker-filter-summary]")?.textContent,
    ).toBe("3 speakers · All");
  });
});
