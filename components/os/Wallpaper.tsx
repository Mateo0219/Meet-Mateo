import { memo } from "react";
import { createRandom } from "@/lib/random";

// Seeded so server and client draw the same sky; a tiled pattern reads as a grid.
const random = createRandom(2026);
const sparkles = Array.from({ length: 46 }, () => ({
  x: random() * 1600,
  y: random() * 1000,
  size: 3 + random() ** 2.4 * 9,
  opacity: 0.35 + random() * 0.6,
  warm: random() > 0.25,
}));
const dots = Array.from({ length: 110 }, () => ({
  x: random() * 1600,
  y: random() * 1000,
  r: 0.6 + random() * 1.1,
  opacity: 0.2 + random() * 0.6,
}));

const sparklePath = (x: number, y: number, s: number) =>
  `M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`;

function Wallpaper() {
  return (
    <div className="os-wallpaper" aria-hidden="true">
      <svg className="wallpaper-sparkles" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {dots.map((dot, index) => (
          <circle key={`d${index}`} cx={dot.x.toFixed(1)} cy={dot.y.toFixed(1)} r={dot.r.toFixed(2)} fill="#FFF6E9" opacity={dot.opacity.toFixed(2)} />
        ))}
        {sparkles.map((sparkle, index) => (
          <path
            key={`s${index}`}
            d={sparklePath(Number(sparkle.x.toFixed(1)), Number(sparkle.y.toFixed(1)), Number(sparkle.size.toFixed(2)))}
            fill={sparkle.warm ? "#FFD23F" : "#FFF6E9"}
            opacity={sparkle.opacity.toFixed(2)}
          />
        ))}
      </svg>
    </div>
  );
}

export default memo(Wallpaper);
