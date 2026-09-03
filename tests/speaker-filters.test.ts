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

  it("keeps both filter surfaces in sync and replaces the previous selection", () => {
    setupSpeakerFilters();

    click("sidebar", "edge");
    click("sidebar", "models");

    expect(selectedOn("sidebar")).toEqual(["models"]);
    expect(selectedOn("mobile")).toEqual(["models"]);
    expect(
      document.querySelector("[data-speaker-filter-summary]")?.textContent,
    ).toBe("1 speakers · 1 selected");
  });

  it("returns to All when the selected category is clicked again", () => {
    setupSpeakerFilters();

    click("mobile", "models");
    click("mobile", "models");

    expect(selectedOn("sidebar")).toEqual(["all"]);
    expect(selectedOn("mobile")).toEqual(["all"]);
    expect(
      document.querySelector("[data-speaker-filter-summary]")?.textContent,
    ).toBe("3 speakers · All");
  });
});
