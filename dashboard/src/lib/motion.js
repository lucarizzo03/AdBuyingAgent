export function getAnimationDuration() {
  if (typeof window === "undefined" || !window.matchMedia) return 400;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 400;
}
