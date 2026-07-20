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
