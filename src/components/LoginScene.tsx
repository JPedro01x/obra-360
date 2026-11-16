import React from 'react';

/** Lightweight architectural artwork; decorative, with no WebGL or external assets. */
export function LoginScene() {
  const facade = (ax: number, ay: number, bx: number, by: number, side: string) =>
    Array.from({ length: 4 }, (_, column) =>
      Array.from({ length: 3 }, (_, row) => {
        const from = (column + 0.13) / 4,
          to = (column + 0.87) / 4,
          top = 14 + row * 49,
          bottom = top + 34;
        const x1 = ax + (bx - ax) * from,
          x2 = ax + (bx - ax) * to,
          y1 = ay + (by - ay) * from,
          y2 = ay + (by - ay) * to;
        return (
          <path
            key={`${side}-${column}-${row}`}
            d={`M${x1} ${y1 + top} L${x2} ${y2 + top} V${y2 + bottom} L${x1} ${y1 + bottom} Z`}
            className={
              side === 'right' && column === 2 && row === 1
                ? 'login-scene-window accent'
                : 'login-scene-window'
            }
          />
        );
      }),
    );
  return (
    <aside className="login-scene" aria-hidden="true">
      <div className="login-scene-copy">
        <span>ESPAÇO PARA IR ALÉM</span>
        <p>
          Da planta
          <br />
          <em>à realidade.</em>
        </p>
      </div>
      <svg viewBox="0 0 600 460" focusable="false">
        <defs>
          <linearGradient id="login-front" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--scene-fill)" stopOpacity=".9" />
            <stop offset="1" stopColor="var(--scene-fill)" stopOpacity=".3" />
          </linearGradient>
          <linearGradient id="login-side" x1="0" x2="1">
            <stop stopColor="var(--scene-fill)" stopOpacity=".4" />
            <stop offset="1" stopColor="var(--scene-fill)" stopOpacity=".8" />
          </linearGradient>
          <linearGradient id="login-roof" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#f97316" stopOpacity=".06" />
            <stop offset="1" stopColor="#fb923c" stopOpacity=".24" />
          </linearGradient>
          <radialGradient id="login-ground">
            <stop stopColor="var(--scene-shadow)" stopOpacity=".7" />
            <stop offset="1" stopColor="var(--scene-shadow)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="307" cy="362" rx="270" ry="91" fill="url(#login-ground)" />
        <g className="login-scene-guides" fill="none">
          <path d="M24 290L302 140L578 291L300 450ZM24 340L300 190L578 341M75 263L351 414M126 235L402 387M178 207L454 359M230 180L506 331M75 317L352 166M127 346L403 194M179 374L455 222M231 402L507 251" />
          <path d="M125 82V352M476 82V351M83 145L341 8M285 447V188" strokeDasharray="3 7" />
        </g>
        <g className="login-scene-building" strokeLinejoin="round">
          <path
            d="M125 145L286 238V402L125 309Z"
            fill="url(#login-front)"
            className="login-scene-outline"
          />
          <path
            d="M286 238L476 137V301L286 402Z"
            fill="url(#login-side)"
            className="login-scene-outline"
          />
          {facade(125, 145, 286, 238, 'front')}
          {facade(286, 238, 476, 137, 'right')}
          <path
            d="M125 145L315 44L476 137L286 238Z"
            fill="url(#login-roof)"
            stroke="#fb923c"
            strokeWidth="1.4"
          />
          <path
            d="M148 145L315 57L453 137L286 225Z"
            fill="none"
            stroke="#fb923c"
            strokeOpacity=".3"
          />
          <path
            d="M125 198L286 291L476 190M125 252L286 345L476 244"
            fill="none"
            className="login-scene-outline"
          />
          <path d="M125 309L286 402L476 301M286 238V402" fill="none" className="login-scene-edge" />
          <path d="M125 252L286 345L476 244" fill="none" stroke="#fb923c" strokeWidth="2.5" />
          <path
            d="M315 44V19M125 145V119M476 137V111"
            fill="none"
            stroke="#fb923c"
            strokeOpacity=".6"
          />
          <circle cx="315" cy="19" r="3.5" fill="#fb923c" />
          <path
            d="M243 132L319 92L365 119L290 159ZM243 132V146L290 173L365 133V119M290 159V173"
            fill="var(--scene-fill)"
            stroke="var(--scene-edge)"
            strokeWidth="1"
          />
        </g>
        <g fill="none" stroke="#fb923c" strokeOpacity=".55" strokeWidth="1">
          <path d="M76 359L76 379L98 391M493 317L515 329L536 318" />
          <circle cx="76" cy="359" r="2.5" />
          <circle cx="536" cy="318" r="2.5" />
        </g>
      </svg>
    </aside>
  );
}
