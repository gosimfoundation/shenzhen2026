// Autoplay is a request, not a guarantee. Keep an explicit user-gesture path
// available when WebKit rejects it, and retry after page/visibility changes.
export function setupHeroVideos() {
  document.querySelectorAll<HTMLElement>("[data-hero-video]").forEach((host) => {
    if (host.dataset.videoInitialized === "true") return;
    const video = host.querySelector<HTMLVideoElement>("video");
    const button = host.querySelector<HTMLButtonElement>("[data-video-play]");
    if (!video || !button) return;
    host.dataset.videoInitialized = "true";

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    let pending = false;

    const isVisible = () => {
      const rect = video.getBoundingClientRect();
      return host.isConnected && document.visibilityState !== "hidden" && rect.width > 0 &&
        rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    };

    const play = () => {
      if (!isVisible() || pending || !video.paused) return;
      video.muted = true;
      pending = true;
      // Call synchronously so a button click retains its user activation.
      video.play().then(() => {
        button.hidden = true;
      }).catch(() => {
        button.hidden = false;
      }).finally(() => {
        pending = false;
      });
    };

    video.addEventListener("playing", () => { button.hidden = true; });
    video.addEventListener("pause", () => {
      if (isVisible()) button.hidden = false;
    });
    video.addEventListener("canplay", play);
    button.addEventListener("click", play);
    window.addEventListener("pageshow", play);
    document.addEventListener("visibilitychange", play);
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) play();
      });
      observer.observe(video);
    }
    play();
  });
}
