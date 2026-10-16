import { beforeEach, describe, expect, it, vi } from "vitest";
import { initTimeline } from "../src/utils/schedule-timeline-controls";

describe("timeline controls", () => {
  let root: HTMLElement;
  let initialMarkup: string;
  beforeEach(() => {
    history.replaceState(null, "", "/schedule/");
    document.body.innerHTML = `<div data-timeline data-lang="en">
      <div class="timeline-toolbar"></div>
      <button data-timeline-day="2026-10-16" aria-pressed="true"></button>
      <button data-timeline-day="2026-10-17" aria-pressed="false"></button>
      <select data-timeline-time><option value="all">All times</option>
        <option data-date="2026-10-16" value="10:15">10:15</option>
        <option data-date="2026-10-16" value="10:40">10:40</option>
        <option data-date="2026-10-17" value="14:00">14:00</option></select>
      <a href="#now" data-timeline-now>Now ↘</a>
      <button data-timeline-all>All</button><button data-timeline-clear>Clear</button>
      <button data-timeline-all="tracks">All conferences</button><button data-timeline-clear="tracks">Clear conferences</button>
      <button data-timeline-all="workshops">All workshops</button><button data-timeline-clear="workshops">Clear workshops</button>
      <span data-timeline-selection></span><p data-timeline-status></p>
      <input type="checkbox" data-timeline-track="a" data-timeline-group="tracks" checked>
      <input type="checkbox" data-timeline-track="b" data-timeline-group="workshops" checked>
      <input type="checkbox" data-timeline-track="c" data-timeline-group="tracks" checked>
      <input type="checkbox" data-timeline-track="spotlight" data-timeline-group="showcases" checked>
      <section data-timeline-window data-date="2026-10-16" data-start="10:15" data-end="10:40">
        <article data-timeline-entry data-track="a">a</article><article data-timeline-entry data-track="b">b</article></section>
      <section data-timeline-window data-date="2026-10-16" data-start="10:40" data-end="11:00">
        <article data-timeline-entry data-track="b">b ongoing</article></section>
      <section data-timeline-window data-date="2026-10-17" data-start="14:00" data-end="15:00">
        <article data-timeline-entry data-track="a">tomorrow</article></section>
      <section data-timeline-window data-date="2026-10-16" data-pending>
        <article data-timeline-entry data-track="a">pending</article></section>
      <p data-timeline-empty hidden>No sessions</p>
    </div>`;
    root = document.querySelector<HTMLElement>("[data-timeline]")!;
    initialMarkup = root.outerHTML;
    initTimeline(root, () => new Date("2026-10-16T02:40:00Z"));
  });
  const visibleWindows = () => [...document.querySelectorAll<HTMLElement>("[data-timeline-window]")].filter((node) => !node.hidden);
  const click = (selector: string) => root.querySelector<HTMLElement>(selector)!.click();
  const selectTime = (value: string) => {
    const select = root.querySelector<HTMLSelectElement>("select")!;
    select.value = value;
    select.dispatchEvent(new Event("change"));
  };

  it("shows a chronological day and supports focusing a specific window", () => {
    expect(visibleWindows()).toHaveLength(3);
    selectTime("10:40");
    expect(visibleWindows().map((node) => node.dataset.start)).toEqual(["10:40"]);
  });

  it("filters any combination of tracks and recovers from empty selection", () => {
    click('[data-timeline-track="a"]');
    expect(visibleWindows()).toHaveLength(2);
    expect(root.querySelector<HTMLElement>('[data-track="a"]')!.hidden).toBe(true);
    click("[data-timeline-clear]");
    expect(visibleWindows()).toHaveLength(0);
    expect(root.querySelector<HTMLElement>("[data-timeline-empty]")!.hidden).toBe(false);
    click("[data-timeline-all]");
    expect(visibleWindows()).toHaveLength(3);
    expect(root.querySelector("[data-timeline-selection]")!.textContent).toBe("All tracks");
  });

  it("changes dates and rebuilds the available times", () => {
    selectTime("10:40");
    click('[data-timeline-day="2026-10-17"]');
    expect(visibleWindows().map((node) => node.dataset.start)).toEqual(["14:00"]);
    expect([...root.querySelectorAll("option")].map((option) => option.value)).toEqual(["all", "14:00"]);
    expect(root.querySelector('[data-timeline-day="2026-10-17"]')!.getAttribute("aria-pressed")).toBe("true");
  });

  it("selects and clears all conference tracks without changing workshops or Spotlight", () => {
    click('[data-timeline-clear="tracks"]');
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="a"]')!.checked).toBe(false);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="c"]')!.checked).toBe(false);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="b"]')!.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="spotlight"]')!.checked).toBe(true);
    expect(visibleWindows()).toHaveLength(2);
    expect(root.querySelector("[data-timeline-selection]")!.textContent).toBe("2 of 4 selected");
    click('[data-timeline-all="tracks"]');
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="a"]')!.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="c"]')!.checked).toBe(true);
    expect(visibleWindows()).toHaveLength(3);
  });

  it("selects and clears workshops without changing the conference selection", () => {
    click('[data-timeline-track="a"]');
    click('[data-timeline-clear="workshops"]');
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="b"]')!.checked).toBe(false);
    expect(visibleWindows()).toHaveLength(0);
    click('[data-timeline-all="workshops"]');
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="b"]')!.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="a"]')!.checked).toBe(false);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="c"]')!.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>('[data-timeline-track="spotlight"]')!.checked).toBe(true);
    expect(visibleWindows()).toHaveLength(2);
  });

  it("Now chooses the event-local window and excludes a session at its end boundary", () => {
    click("[data-timeline-now]");
    expect(visibleWindows().map((node) => node.dataset.start)).toEqual(["10:40"]);
    expect(location.hash).toBe("#now");
  });

  it("recalculates Now when its bookmark is opened at a different time", () => {
    history.replaceState(null, "", "#now");
    document.body.innerHTML = initialMarkup;
    root = document.querySelector<HTMLElement>("[data-timeline]")!;
    initTimeline(root, () => new Date("2026-10-17T06:30:00Z"));
    expect(visibleWindows().map((node) => [node.dataset.date, node.dataset.start])).toEqual([["2026-10-17", "14:00"]]);
    expect(root.querySelector("[data-timeline-status]")!.textContent).toContain("Happening now");
  });

  it("recalculates Now when navigating to its hash without reloading", () => {
    history.replaceState(null, "", "#now");
    window.dispatchEvent(new Event("hashchange"));
    expect(visibleWindows().map((node) => node.dataset.start)).toEqual(["10:40"]);
  });

  it("leaves the Now bookmark when a specific day or time is chosen", () => {
    click("[data-timeline-now]");
    click('[data-timeline-day="2026-10-17"]');
    expect(location.hash).toBe("#by-time");
    click("[data-timeline-now]");
    selectTime("all");
    expect(location.hash).toBe("#by-time");
  });

  it("does not register duplicate handlers on repeated initialization", () => {
    initTimeline(root, () => new Date("2026-10-17T06:30:00Z"));
    click("[data-timeline-now]");
    expect(visibleWindows().map((node) => [node.dataset.date, node.dataset.start])).toEqual([["2026-10-16", "10:40"]]);
  });

  it("explains Now outside conference dates without changing the day", () => {
    const fresh = root.cloneNode(true) as HTMLElement;
    delete fresh.dataset.timelineInitialized;
    initTimeline(fresh, () => new Date("2026-10-18T02:00:00Z"));
    fresh.querySelector<HTMLElement>("[data-timeline-now]")!.click();
    expect(fresh.querySelector("[data-timeline-status]")!.textContent).toContain("conference days");
    expect(fresh.querySelector('[data-timeline-day="2026-10-16"]')!.getAttribute("aria-pressed")).toBe("true");
  });

  it("returns to the controls if narrowing the schedule leaves them above the viewport", () => {
    const toolbar = root.querySelector<HTMLElement>(".timeline-toolbar")!;
    vi.spyOn(toolbar, "getBoundingClientRect").mockReturnValue({ top: -500 } as DOMRect);
    const scroll = vi.spyOn(root, "scrollIntoView");
    selectTime("10:40");
    expect(scroll).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
  });

  it("returns to the beginning of new results even while the toolbar stays visible", () => {
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: -500 } as DOMRect);
    const scroll = vi.spyOn(root, "scrollIntoView");
    selectTime("10:40");
    expect(scroll).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
    scroll.mockClear();
    click('[data-timeline-day="2026-10-17"]');
    expect(scroll).toHaveBeenCalled();
    scroll.mockClear();
    click("[data-timeline-now]");
    expect(scroll).toHaveBeenCalled();
  });
});
