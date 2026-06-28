import { type ElementTargetRect } from '../../utils/elementTargets';

interface SpotlightProps {
  rect: ElementTargetRect | null;
}

export default function Spotlight({ rect }: SpotlightProps) {
  if (!rect) return null;

  const style = {
    top: Math.max(8, rect.top - 8),
    left: Math.max(8, rect.left - 8),
    width: rect.width + 16,
    height: rect.height + 16
  };

  return <div className="fixed z-50 rounded-2xl border-2 border-white pointer-events-none" style={style} />;
}
