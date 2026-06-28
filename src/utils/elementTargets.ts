export interface ElementTargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function getElementTarget(targetElementId?: string): HTMLElement | null {
  if (!targetElementId || typeof document === 'undefined') return null;
  return document.getElementById(targetElementId);
}

export function getElementTargetRect(targetElementId?: string): ElementTargetRect | null {
  const element = getElementTarget(targetElementId);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  };
}

export function scrollTargetIntoView(targetElementId?: string) {
  const element = getElementTarget(targetElementId);
  element?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
}

export function pulseTarget(targetElementId?: string) {
  const element = getElementTarget(targetElementId);
  if (!element) return;
  element.animate(
    [
      { outline: '0 solid rgba(255,255,255,0)', boxShadow: '0 0 0 0 rgba(255,255,255,0)' },
      { outline: '4px solid rgba(255,255,255,0.95)', boxShadow: '0 0 0 10px rgba(255,255,255,0.18)' },
      { outline: '0 solid rgba(255,255,255,0)', boxShadow: '0 0 0 0 rgba(255,255,255,0)' }
    ],
    { duration: 900, easing: 'ease-out' }
  );
}

export function clickTarget(targetElementId?: string) {
  const element = getElementTarget(targetElementId);
  if (!element) return false;
  element.click();
  return true;
}
