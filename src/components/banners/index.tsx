import type { FC } from "react";
import type { Theme } from "../../types/theme";
import { COLORS } from "../../constants/colors";

// Decorative headers, one per tool. Purely visual — the h1 lives in PageHeader.
// Style rules:
//   - viewBox 800x120, single accent in Traveller orange, everything else
//     is theme.text / theme.textDimmed / theme.border so it flips with the theme.
//   - Only two font weights: regular (via default) and 500 where used.
//   - Monospace tickers/labels evoke the Traveller manual's schematic look.

interface BannerProps {
  theme: Theme;
}

const svgStyle = {
  display: "block",
  width: "100%",
  height: "auto",
  maxHeight: 140,
  marginBottom: 12,
} as const;

// L-shaped corner brackets used by every banner (framed-instrument look).
const CornerFrame: FC<{ color: string }> = ({ color }) => (
  <g stroke={color} strokeWidth={1} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 22 L8 8 L22 8" />
    <path d="M792 22 L792 8 L778 8" />
    <path d="M8 98 L8 112 L22 112" />
    <path d="M792 98 L792 112 L778 112" />
  </g>
);

// ---------- Search Banner ----------
// A subsector scanner strip: a row of hexes with one hex under the reticle.

const HEX_S = 14; // radius (center to vertex) for pointy-top hex
const HEX_W = (Math.sqrt(3) / 2) * HEX_S; // half-width
const HEX_POINTS = [
  `0,-${HEX_S}`,
  `${HEX_W.toFixed(2)},-${HEX_S / 2}`,
  `${HEX_W.toFixed(2)},${HEX_S / 2}`,
  `0,${HEX_S}`,
  `-${HEX_W.toFixed(2)},${HEX_S / 2}`,
  `-${HEX_W.toFixed(2)},-${HEX_S / 2}`,
].join(" ");

const HEX_SPACING = 48;
const HEX_COUNT = 11;
const HEX_START_X = 400 - ((HEX_COUNT - 1) / 2) * HEX_SPACING;
const HEX_CENTER_Y = 60;
const TARGET_INDEX = 5;
const WORLD_HEXES: readonly number[] = [1, 3, 7, 9];

export const SearchBanner: FC<BannerProps> = ({ theme }) => (
  <svg aria-hidden="true" viewBox="0 0 800 120" style={svgStyle} preserveAspectRatio="xMidYMid meet">
    <CornerFrame color={theme.textDimmed} />
    <text x="30" y="22" fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
      {"> SUBSECTOR SCAN"}
    </text>
    <text
      x="770"
      y="22"
      fill={theme.textDimmed}
      fontSize="10"
      fontFamily="monospace"
      letterSpacing="1.5"
      textAnchor="end"
    >
      REGINA · 1910
    </text>
    <line
      x1={30}
      y1={HEX_CENTER_Y}
      x2={770}
      y2={HEX_CENTER_Y}
      stroke={theme.border}
      strokeWidth={1}
      strokeDasharray="2 5"
    />
    {Array.from({ length: HEX_COUNT }, (_, i) => {
      const cx = HEX_START_X + i * HEX_SPACING;
      const isTarget = i === TARGET_INDEX;
      const hasWorld = WORLD_HEXES.includes(i);
      return (
        <g key={i} transform={`translate(${cx}, ${HEX_CENTER_Y})`}>
          <polygon
            points={HEX_POINTS}
            fill={isTarget ? `${COLORS.primary}1F` : "none"}
            stroke={isTarget ? COLORS.primary : theme.textDimmed}
            strokeWidth={isTarget ? 1.5 : 1}
          />
          {hasWorld && !isTarget && <circle cx={0} cy={0} r={2} fill={theme.textMuted} />}
          {isTarget && (
            <>
              <circle cx={0} cy={0} r={2.5} fill={COLORS.primary} />
              <g stroke={COLORS.primary} strokeWidth={1.4} strokeLinecap="round">
                <line x1={-22} y1={0} x2={-11} y2={0} />
                <line x1={11} y1={0} x2={22} y2={0} />
                <line x1={0} y1={-24} x2={0} y2={-13} />
                <line x1={0} y1={13} x2={0} y2={24} />
              </g>
            </>
          )}
        </g>
      );
    })}
    <text
      x={HEX_START_X + TARGET_INDEX * HEX_SPACING}
      y={102}
      fill={COLORS.primary}
      fontSize="10"
      fontFamily="monospace"
      textAnchor="middle"
      letterSpacing="1.5"
      fontWeight={500}
    >
      TARGET
    </text>
  </svg>
);

// ---------- Recent Banner ----------
// A star chart with visited worlds linked by dashed jump routes.

interface WorldNode {
  x: number;
  y: number;
  label: string;
  pinned: boolean;
  highlighted?: boolean;
}

const RECENT_WORLDS: readonly WorldNode[] = [
  { x: 130, y: 78, label: "1910", pinned: true },
  { x: 260, y: 52, label: "2015", pinned: false },
  { x: 400, y: 80, label: "1912", pinned: true, highlighted: true },
  { x: 545, y: 45, label: "2211", pinned: false },
  { x: 680, y: 72, label: "2314", pinned: true },
];

const RECENT_STARS: ReadonlyArray<readonly [number, number]> = [
  [70, 40], [95, 90], [175, 30], [210, 62], [305, 90], [360, 35],
  [440, 45], [485, 90], [510, 30], [615, 82], [640, 40], [720, 60],
  [750, 85], [55, 65], [225, 92], [380, 60], [590, 90], [710, 30],
  [340, 78], [575, 65], [125, 40], [660, 92],
];

// Pin sourced from IconPin (24x24), scaled 0.5 so tip lands at (x, y).
const PinShape: FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g
    transform={`translate(${x - 6}, ${y - 11.5}) scale(0.5)`}
    stroke={color}
    strokeWidth={2}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </g>
);

export const RecentBanner: FC<BannerProps> = ({ theme }) => (
  <svg aria-hidden="true" viewBox="0 0 800 120" style={svgStyle} preserveAspectRatio="xMidYMid meet">
    <CornerFrame color={theme.textDimmed} />
    <text x="30" y="22" fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
      {"> VISITED WORLDS"}
    </text>
    <text
      x="770"
      y="22"
      fill={theme.textDimmed}
      fontSize="10"
      fontFamily="monospace"
      letterSpacing="1.5"
      textAnchor="end"
    >
      JUMP ROUTES · CHARTED
    </text>
    {RECENT_STARS.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={0.9} fill={theme.textDimmed} />
    ))}
    {RECENT_WORLDS.slice(0, -1).map((w, i) => {
      const next = RECENT_WORLDS[i + 1];
      return (
        <line
          key={i}
          x1={w.x}
          y1={w.y}
          x2={next.x}
          y2={next.y}
          stroke={theme.border}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      );
    })}
    {RECENT_WORLDS.map((w, i) => {
      const color = w.highlighted ? COLORS.primary : theme.text;
      const pinColor = w.highlighted ? COLORS.primary : theme.textMuted;
      return (
        <g key={i}>
          <circle
            cx={w.x}
            cy={w.y}
            r={w.highlighted ? 6 : 5}
            fill={w.highlighted ? `${COLORS.primary}22` : "none"}
            stroke={color}
            strokeWidth={w.highlighted ? 1.5 : 1}
          />
          <circle cx={w.x} cy={w.y} r={w.highlighted ? 2.4 : 1.6} fill={color} />
          {w.pinned && <PinShape x={w.x} y={w.y - 8} color={pinColor} />}
          <text
            x={w.x}
            y={w.y + 22}
            fill={w.highlighted ? COLORS.primary : theme.textDimmed}
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            letterSpacing="1"
            fontWeight={w.highlighted ? 500 : 400}
          >
            {w.label}
          </text>
        </g>
      );
    })}
  </svg>
);

// ---------- Passenger Banner ----------
// Passenger deck schematic: 4 compartments (High / Middle / Basic / Low),
// seats as filled/empty circles around a central corridor. Highlighted class
// gets the Traveller-orange accent.

interface Compartment {
  label: string;
  x1: number;
  x2: number;
  cols: number;
  filled: number;
  highlighted?: boolean;
}

const COMPARTMENTS: readonly Compartment[] = [
  { label: "HIGH",   x1: 30,  x2: 220, cols: 3, filled: 2 },
  { label: "MIDDLE", x1: 220, x2: 420, cols: 4, filled: 5, highlighted: true },
  { label: "BASIC",  x1: 420, x2: 620, cols: 4, filled: 4 },
  { label: "LOW",    x1: 620, x2: 770, cols: 3, filled: 1 },
];

const BULKHEADS: readonly number[] = [220, 420, 620];

export const PassengerBanner: FC<BannerProps> = ({ theme }) => {
  const cabinX1 = 30;
  const cabinX2 = 770;
  const cabinY1 = 44;
  const cabinY2 = 96;
  const seatYTop = 60;
  const seatYBot = 82;
  const corridorY = 71;

  const totalSeats = COMPARTMENTS.reduce((s, c) => s + c.cols * 2, 0);
  const totalFilled = COMPARTMENTS.reduce((s, c) => s + c.filled, 0);

  return (
    <svg aria-hidden="true" viewBox="0 0 800 120" style={svgStyle} preserveAspectRatio="xMidYMid meet">
      <CornerFrame color={theme.textDimmed} />
      <text x="30" y="22" fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
        {"> PASSENGER DECK"}
      </text>
      <text
        x="770"
        y="22"
        fill={theme.textDimmed}
        fontSize="10"
        fontFamily="monospace"
        letterSpacing="1.5"
        textAnchor="end"
      >
        {`SEATS ${totalFilled}/${totalSeats}`}
      </text>

      {/* Class labels above each compartment */}
      {COMPARTMENTS.map((c, i) => {
        const midX = (c.x1 + c.x2) / 2;
        const color = c.highlighted ? COLORS.primary : theme.textDimmed;
        return (
          <text
            key={`lbl-${i}`}
            x={midX}
            y={38}
            fill={color}
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            letterSpacing="1.5"
            fontWeight={c.highlighted ? 500 : 400}
          >
            {c.label}
          </text>
        );
      })}

      {/* Highlighted compartment background (drawn under the hull) */}
      {COMPARTMENTS.map((c, i) => {
        if (!c.highlighted) return null;
        return (
          <rect
            key={`bg-${i}`}
            x={c.x1}
            y={cabinY1}
            width={c.x2 - c.x1}
            height={cabinY2 - cabinY1}
            fill={`${COLORS.primary}14`}
          />
        );
      })}

      {/* Cabin outer hull */}
      <rect
        x={cabinX1}
        y={cabinY1}
        width={cabinX2 - cabinX1}
        height={cabinY2 - cabinY1}
        rx={8}
        ry={8}
        stroke={theme.text}
        strokeWidth={1.5}
        fill="none"
      />

      {/* Bulkheads (openings left in the middle for the corridor) */}
      {BULKHEADS.map(x => (
        <g key={x} stroke={theme.textDimmed} strokeWidth={1}>
          <line x1={x} y1={cabinY1 + 1} x2={x} y2={corridorY - 4} />
          <line x1={x} y1={corridorY + 4} x2={x} y2={cabinY2 - 1} />
        </g>
      ))}

      {/* Central corridor (dashed) */}
      <line
        x1={cabinX1 + 10}
        y1={corridorY}
        x2={cabinX2 - 10}
        y2={corridorY}
        stroke={theme.textDimmed}
        strokeWidth={0.8}
        strokeDasharray="3 4"
      />

      {/* Seats: two rows per compartment, filled = occupied */}
      {COMPARTMENTS.map((c, ci) => {
        const color = c.highlighted ? COLORS.primary : theme.text;
        const spacing = (c.x2 - c.x1) / c.cols;
        const total = c.cols * 2;
        return (
          <g key={`seats-${ci}`}>
            {Array.from({ length: total }, (_, si) => {
              const col = si % c.cols;
              const row = Math.floor(si / c.cols);
              const sx = c.x1 + spacing * (col + 0.5);
              const sy = row === 0 ? seatYTop : seatYBot;
              const isFilled = si < c.filled;
              return (
                <circle
                  key={si}
                  cx={sx}
                  cy={sy}
                  r={3.5}
                  fill={isFilled ? color : "none"}
                  stroke={color}
                  strokeWidth={1.2}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---------- Nearby Banner ----------
// A proximity plot: range arcs every two parsecs around the ship, with the
// shortest refuelling route drawn out to a target world. The two ideas the tool
// trades in — distance in parsecs, length in jumps — are the same picture here.

const NEARBY_ORIGIN = { x: 60, y: 68 };
const PC_SCALE = 65; // svg units per parsec
const NEARBY_RANGES: readonly number[] = [2, 4, 6, 8, 10];
const ARC_HALF_HEIGHT = 42; // how much of each arc stays inside the viewBox

// Worlds in range the route does not use — context, not waypoints.
const NEARBY_FIELD: ReadonlyArray<readonly [number, number]> = [
  [128, 42], [150, 96], [205, 34], [270, 102], [300, 88],
  [345, 46], [395, 102], [420, 32], [510, 58], [545, 98],
  [578, 34], [598, 100], [700, 92], [712, 36], [740, 66],
];

// Origin, two fuel stops, target: three jumps.
const NEARBY_ROUTE: ReadonlyArray<{ x: number; y: number }> = [
  NEARBY_ORIGIN,
  { x: 250, y: 44 },
  { x: 455, y: 88 },
  { x: 645, y: 55 },
];

// The visible slice of a range circle, drawn from its top edge round to the
// bottom one. Wide radii barely bow, which is what makes it read as a scope.
const arcPath = (r: number): string => {
  const x = (NEARBY_ORIGIN.x + Math.sqrt(r * r - ARC_HALF_HEIGHT ** 2)).toFixed(1);
  return `M ${x} ${NEARBY_ORIGIN.y - ARC_HALF_HEIGHT} `
    + `A ${r} ${r} 0 0 1 ${x} ${NEARBY_ORIGIN.y + ARC_HALF_HEIGHT}`;
};

export const NearbyBanner: FC<BannerProps> = ({ theme }) => {
  const target = NEARBY_ROUTE[NEARBY_ROUTE.length - 1];
  const stops = NEARBY_ROUTE.slice(1, -1);

  return (
    <svg aria-hidden="true" viewBox="0 0 800 120" style={svgStyle} preserveAspectRatio="xMidYMid meet">
      <CornerFrame color={theme.textDimmed} />
      <text x="30" y="22" fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
        {"> PROXIMITY SCAN"}
      </text>
      <text
        x="770"
        y="22"
        fill={theme.textDimmed}
        fontSize="10"
        fontFamily="monospace"
        letterSpacing="1.5"
        textAnchor="end"
      >
        J-2 · 10 PC · 3 JUMPS
      </text>

      {/* Range arcs and their parsec ticks */}
      {NEARBY_RANGES.map(pc => (
        <path
          key={pc}
          d={arcPath(pc * PC_SCALE)}
          fill="none"
          stroke={theme.border}
          strokeWidth={1}
          strokeDasharray="2 5"
        />
      ))}
      {NEARBY_RANGES.map(pc => (
        <text
          key={pc}
          x={NEARBY_ORIGIN.x + pc * PC_SCALE}
          y={116}
          fill={theme.textDimmed}
          fontSize="9"
          fontFamily="monospace"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          {pc}
        </text>
      ))}
      <text x="30" y="116" fill={theme.textDimmed} fontSize="9" fontFamily="monospace" letterSpacing="1.5">
        ORIGIN
      </text>

      {/* Worlds the scan picked up but the route passes by */}
      {NEARBY_FIELD.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill="none" stroke={theme.textDimmed} strokeWidth={1} />
      ))}

      {/* One dashed leg per jump */}
      {NEARBY_ROUTE.slice(0, -1).map((a, i) => {
        const b = NEARBY_ROUTE[i + 1];
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={COLORS.primary}
            strokeWidth={1.2}
            strokeDasharray="4 3"
          />
        );
      })}

      {/* Ship at the origin */}
      <circle
        cx={NEARBY_ORIGIN.x}
        cy={NEARBY_ORIGIN.y}
        r={7}
        fill={`${COLORS.primary}1F`}
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <circle cx={NEARBY_ORIGIN.x} cy={NEARBY_ORIGIN.y} r={2.5} fill={COLORS.primary} />

      {/* Refuelling stops along the way */}
      {stops.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={5} fill={`${COLORS.primary}22`} stroke={COLORS.primary} strokeWidth={1.2} />
          <circle cx={s.x} cy={s.y} r={1.8} fill={COLORS.primary} />
        </g>
      ))}

      {/* Target under the reticle */}
      <circle cx={target.x} cy={target.y} r={6} fill={`${COLORS.primary}1F`} stroke={COLORS.primary} strokeWidth={1.5} />
      <circle cx={target.x} cy={target.y} r={2.5} fill={COLORS.primary} />
      <g stroke={COLORS.primary} strokeWidth={1.4} strokeLinecap="round">
        <line x1={target.x - 22} y1={target.y} x2={target.x - 12} y2={target.y} />
        <line x1={target.x + 12} y1={target.y} x2={target.x + 22} y2={target.y} />
        <line x1={target.x} y1={target.y - 22} x2={target.x} y2={target.y - 12} />
        <line x1={target.x} y1={target.y + 12} x2={target.x} y2={target.y + 22} />
      </g>
      <text
        x={target.x}
        y={90}
        fill={COLORS.primary}
        fontSize="10"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="1.5"
        fontWeight={500}
      >
        TARGET
      </text>
    </svg>
  );
};

// ---------- Freight Banner ----------
// Stacked cargo containers on the loading deck, sized by lot type.

interface Container {
  x: number;
  y: number;
  w: number;
  h: number;
  highlighted?: boolean;
}

// Base deck at y=100. Containers stack upward.
// Major lot ~ 10 t (large), Minor ~ 5 t (medium), Incidental ~ 1 t (small).
const CONTAINERS: readonly Container[] = [
  // Major stack (large 10t containers) around x=90-190
  { x: 80, y: 74, w: 54, h: 26 },
  { x: 140, y: 74, w: 54, h: 26 },
  { x: 80, y: 46, w: 54, h: 26 },
  { x: 140, y: 46, w: 54, h: 26, highlighted: true },
  // Minor stack (medium 5t) around x=220-320
  { x: 220, y: 76, w: 36, h: 24 },
  { x: 262, y: 76, w: 36, h: 24 },
  { x: 220, y: 52, w: 36, h: 24 },
  { x: 262, y: 52, w: 36, h: 24 },
  { x: 220, y: 28, w: 36, h: 24 },
  // Incidental stack (small 1t) around x=340-460
  { x: 340, y: 84, w: 20, h: 16 },
  { x: 364, y: 84, w: 20, h: 16 },
  { x: 388, y: 84, w: 20, h: 16 },
  { x: 412, y: 84, w: 20, h: 16 },
  { x: 436, y: 84, w: 20, h: 16 },
  { x: 340, y: 66, w: 20, h: 16 },
  { x: 364, y: 66, w: 20, h: 16 },
  { x: 388, y: 66, w: 20, h: 16 },
  { x: 412, y: 66, w: 20, h: 16 },
  { x: 340, y: 48, w: 20, h: 16 },
  { x: 364, y: 48, w: 20, h: 16 },
  { x: 388, y: 48, w: 20, h: 16 },
];

export const FreightBanner: FC<BannerProps> = ({ theme }) => (
  <svg aria-hidden="true" viewBox="0 0 800 120" style={svgStyle} preserveAspectRatio="xMidYMid meet">
    <CornerFrame color={theme.textDimmed} />
    <text x="30" y="22" fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
      {"> CARGO MANIFEST"}
    </text>
    <text
      x="770"
      y="22"
      fill={theme.textDimmed}
      fontSize="10"
      fontFamily="monospace"
      letterSpacing="1.5"
      textAnchor="end"
    >
      10T · 5T · 1T
    </text>

    {/* Deck line */}
    <line x1={40} y1={100} x2={520} y2={100} stroke={theme.text} strokeWidth={1.2} />
    {Array.from({ length: 25 }, (_, i) => (
      <line
        key={i}
        x1={40 + i * 20}
        y1={100}
        x2={40 + i * 20}
        y2={104}
        stroke={theme.textDimmed}
        strokeWidth={0.8}
      />
    ))}

    {/* Containers */}
    {CONTAINERS.map((c, i) => (
      <rect
        key={i}
        x={c.x}
        y={c.y}
        width={c.w}
        height={c.h}
        stroke={c.highlighted ? COLORS.primary : theme.text}
        strokeWidth={c.highlighted ? 1.5 : 1}
        fill={c.highlighted ? `${COLORS.primary}22` : "none"}
      />
    ))}

    {/* Crane hook lowering onto the highlighted container */}
    <g stroke={COLORS.primary} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1={167} y1={12} x2={167} y2={40} />
      <path d="M 160 40 L 174 40 L 174 46 L 160 46 Z" />
    </g>

    {/* Stack labels */}
    <text x={137} y={116} fill={theme.textDimmed} fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
      MAJOR
    </text>
    <text x={258} y={116} fill={theme.textDimmed} fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
      MINOR
    </text>
    <text x={398} y={116} fill={theme.textDimmed} fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
      INCIDENTAL
    </text>

    {/* Cargo bay capacity meter on the right */}
    <g transform="translate(560, 40)">
      <text x={0} y={0} fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
        BAY / 82t
      </text>
      <rect x={0} y={10} width={200} height={14} stroke={theme.textDimmed} strokeWidth={1} fill="none" />
      <rect x={0} y={10} width={140} height={14} fill={`${COLORS.primary}55`} stroke={COLORS.primary} strokeWidth={1} />
      <text x={0} y={44} fill={COLORS.primary} fontSize="10" fontFamily="monospace" letterSpacing="1.5" fontWeight={500}>
        LOADED 57t
      </text>
      <text x={200} y={44} fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5" textAnchor="end">
        FREE 25t
      </text>
    </g>
  </svg>
);

// ---------- Ship Banner ----------
// Una LÁMINA DE PLANOS: planta, perfil y frontal, con su cota y sus ejes de
// simetría, como la hoja de un diseñador naval. Una sola silueta —da igual desde
// dónde— acaba pareciendo otra cosa (la de perfil salía submarino); tres vistas
// ortográficas juntas no se leen como un dibujo de una nave, se leen como los
// planos de una nave, que es exactamente lo que la pestaña es.
//
// El casco es el del CARGUERO LEJANO, el Tipo A2 del manual: las mismas 200 t
// que dice el rótulo, con sus 63 de bodega. Un cajón con el morro achaflanado,
// la rampa de carga en la popa y las góndolas del salto-2 a los costados — se le
// ve que es una nave de carga, que es la que casi todo el mundo juega. Los
// números son los de su plantilla (`farTrader` en constants/shipTemplates.ts),
// así que si allí cambian, aquí también.

/** Las tres vistas: dónde va cada una y dónde su rótulo. */
const SHIP_VIEWS: readonly { x: number; label: string }[] = [
  { x: 162, label: "PLAN" },
  { x: 422, label: "PROFILE" },
  { x: 600, label: "FRONT" },
];

/** El eje de simetría del dibujo técnico: raya y punto. */
const AXIS_DASH = "10 3 2 3";

export const ShipBanner: FC<BannerProps> = ({ theme }) => (
  <svg aria-hidden="true" viewBox="0 0 800 120" style={svgStyle} preserveAspectRatio="xMidYMid meet">
    <CornerFrame color={theme.textDimmed} />
    <text x="30" y="22" fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
      {"> BLUEPRINT"}
    </text>
    <text
      x="770"
      y="22"
      fill={theme.textDimmed}
      fontSize="10"
      fontFamily="monospace"
      letterSpacing="1.5"
      textAnchor="end"
    >
      TYPE A2 · 200 TONS
    </text>

    {/* La lámina, dividida en sus vistas. */}
    <g stroke={theme.border} strokeWidth={1} strokeDasharray="3 4">
      <line x1={300} y1={32} x2={300} y2={96} />
      <line x1={532} y1={32} x2={532} y2={96} />
      <line x1={655} y1={32} x2={655} y2={96} />
    </g>

    {/* Ejes de simetría: uno por vista, que es lo que delata un plano. */}
    <g stroke={theme.border} strokeWidth={1} strokeDasharray={AXIS_DASH}>
      <line x1={42} y1={57} x2={282} y2={57} />
      <line x1={326} y1={57} x2={518} y2={57} />
      <line x1={600} y1={30} x2={600} y2={76} />
    </g>

    {/* PLANTA: el casco cajón del mercante libre —morro achaflanado, rampa de
        carga en la popa y las góndolas de los motores a los costados—. */}
    <g stroke={theme.textMuted} strokeWidth={1.4} fill="none" strokeLinejoin="round">
      <path d="M70 40 L206 40 L240 48 L252 57 L240 66 L206 74 L70 74 Z" />
      <rect x={46} y={46} width={24} height={22} />
      <rect x={96} y={34} width={54} height={6} />
      <rect x={96} y={74} width={54} height={6} />
      <rect x={206} y={48} width={26} height={18} />
    </g>

    {/* La bodega, marcada sobre la planta: el único acento del dibujo, y las
        mismas 81 t que la barra del margen. */}
    <g stroke={COLORS.primary} strokeWidth={1.4} fill={`${COLORS.primary}22`}>
      <rect x={118} y={44} width={60} height={26} />
      <line x1={148} y1={44} x2={148} y2={70} />
    </g>

    {/* PERFIL: un cajón bajo, con la cubierta marcada y el tren de aterrizaje
        fuera — que es lo que ningún submarino tiene. */}
    <g stroke={theme.textMuted} strokeWidth={1.4} fill="none" strokeLinejoin="round">
      <path d="M334 44 L462 44 L498 56 L498 64 L334 64 Z" />
      <line x1={334} y1={50} x2={462} y2={50} />
      <path d="M370 64 L370 76 M362 76 L378 76" />
      <path d="M452 64 L452 76 M444 76 L460 76" />
    </g>

    {/* FRONTAL: ancho y de fondo plano, con una góndola a cada costado. */}
    <g stroke={theme.textMuted} strokeWidth={1.4} fill="none" strokeLinejoin="round">
      <path d="M562 68 L562 52 L576 44 L624 44 L638 52 L638 68 Z" />
      <rect x={550} y={50} width={12} height={10} />
      <rect x={638} y={50} width={12} height={10} />
      <path d="M576 68 L576 74 M624 68 L624 74" />
    </g>

    {/* La cota de la planta, con su hueco para el número. */}
    <g stroke={theme.textDimmed} strokeWidth={1}>
      <line x1={52} y1={86} x2={52} y2={94} />
      <line x1={272} y1={86} x2={272} y2={94} />
      <line x1={52} y1={90} x2={140} y2={90} />
      <line x1={184} y1={90} x2={272} y2={90} />
    </g>
    <text
      x={162}
      y={93}
      fill={theme.textDimmed}
      fontSize="9"
      fontFamily="monospace"
      textAnchor="middle"
      letterSpacing="1.5"
    >
      37 m
    </text>

    {/* El rótulo de cada vista. */}
    {SHIP_VIEWS.map(view => (
      <text
        key={view.label}
        x={view.x}
        y={107}
        fill={theme.textDimmed}
        fontSize="9"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        {view.label}
      </text>
    ))}

    {/* Y en el margen, la nave entera y qué parte de ella es bodega: las 200 t
        del rótulo de arriba, con las 63 de carga marcadas — las mismas que van
        en naranja sobre la planta. El Tipo A2 del manual, de cabo a rabo. */}
    <g transform="translate(665, 46)">
      <text x={0} y={0} fill={theme.textDimmed} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
        HULL 200t
      </text>
      <rect x={0} y={8} width={105} height={11} stroke={theme.textDimmed} strokeWidth={1} fill="none" />
      <rect x={0} y={8} width={33} height={11} fill={`${COLORS.primary}55`} stroke={COLORS.primary} strokeWidth={1} />
      <text x={0} y={34} fill={COLORS.primary} fontSize="10" fontFamily="monospace" letterSpacing="1.5" fontWeight={500}>
        CARGO 63t
      </text>
    </g>
  </svg>
);
