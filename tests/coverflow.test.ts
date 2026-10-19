import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupCoverFlows } from "../src/scripts/coverflow";

describe("conference photo cover flow", () => {
  let root: HTMLElement;
  let slides: HTMLButtonElement[];
  let dialog: HTMLDialogElement;
  const click = (selector: string) => root.querySelector<HTMLButtonElement>(selector)!.click();
  const key = (value: string) => root.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));

  beforeEach(() => {
    document.body.innerHTML = `<div data-coverflow>
      <div data-coverflow-stage>${Array.from({ length: 9 }, (_, i) => `<button data-coverflow-slide data-caption="Photo ${i + 1}" data-full-src="/photo-${i + 1}.webp" data-photo-alt="Scene ${i + 1}" data-select-label="Select photo" data-open-label="Enlarge photo"></button>`).join("")}</div>
      <button data-coverflow-prev></button><button data-coverflow-next></button>
      <span data-coverflow-count></span><p data-coverflow-caption></p>
      ${Array.from({ length: 9 }, () => "<button data-coverflow-dot></button>").join("")}
      <dialog data-coverflow-dialog><button data-coverflow-close></button><button data-coverflow-lightbox-prev></button><img data-coverflow-full-image alt=""><button data-coverflow-lightbox-next></button><p data-coverflow-full-caption></p></dialog>
    </div>`;
    root = document.querySelector<HTMLElement>("[data-coverflow]")!;
    slides = [...root.querySelectorAll<HTMLButtonElement>("[data-coverflow-slide]")];
    dialog = root.querySelector<HTMLDialogElement>("dialog")!;
    setupCoverFlows();
  });
  afterEach(() => { document.body.innerHTML = ""; });

  it("wraps in both directions and exposes only the current photo as a tab stop", () => {
    click("[data-coverflow-prev]");
    expect(root.dataset.activePhoto).toBe("8");
    expect(slides[8].getAttribute("aria-current")).toBe("true");
    expect(slides.filter(slide => slide.tabIndex === 0)).toEqual([slides[8]]);
    expect(root.querySelector("[data-coverflow-count]")!.textContent).toBe("09 / 09");
    click("[data-coverflow-next]");
    expect(root.dataset.activePhoto).toBe("0");
    expect(root.querySelector("[data-coverflow-caption]")!.textContent).toBe("Photo 1");
  });

  it("selects a side photo before opening it and keeps the large view in sync", () => {
    slides[1].click();
    expect(root.dataset.activePhoto).toBe("1");
    expect(dialog.open).toBe(false);
    slides[1].click();
    expect(dialog.open).toBe(true);
    expect(root.querySelector("[data-coverflow-full-image]")!.getAttribute("src")).toBe("/photo-2.webp");
    click("[data-coverflow-lightbox-next]");
    expect(root.dataset.activePhoto).toBe("2");
    expect(root.querySelector("[data-coverflow-full-image]")!.getAttribute("alt")).toBe("Scene 3");
    click("[data-coverflow-close]");
    expect(dialog.open).toBe(false);
  });

  it("supports arrow keys, Home and End without scrolling the page", () => {
    key("End");
    expect(root.dataset.activePhoto).toBe("8");
    expect(document.activeElement).toBe(slides[8]);
    key("ArrowRight");
    expect(root.dataset.activePhoto).toBe("0");
    key("ArrowLeft");
    expect(root.dataset.activePhoto).toBe("8");
    key("Home");
    expect(root.dataset.activePhoto).toBe("0");
  });

  it("updates dot selection and does not register duplicate handlers", () => {
    setupCoverFlows();
    click("[data-coverflow-next]");
    expect(root.dataset.activePhoto).toBe("1");
    root.querySelectorAll<HTMLButtonElement>("[data-coverflow-dot]")[5].click();
    expect(root.dataset.activePhoto).toBe("5");
    expect(root.querySelectorAll('[data-coverflow-dot][aria-pressed="true"]')).toHaveLength(1);
    expect(slides[0].getAttribute("aria-hidden")).toBe("true");
  });

  it("recognizes horizontal swipes while preserving vertical scrolling and suppressing accidental opens", () => {
    const stage = root.querySelector<HTMLElement>("[data-coverflow-stage]")!;
    const swipe = (x: number, y: number) => {
      stage.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, isPrimary: true, button: 0, clientX: 200, clientY: 100, bubbles: true }));
      stage.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, bubbles: true }));
    };
    swipe(190, 200);
    expect(root.dataset.activePhoto).toBe("0");
    swipe(100, 110);
    expect(root.dataset.activePhoto).toBe("1");
    slides[1].click();
    expect(dialog.open).toBe(false);
  });
});
