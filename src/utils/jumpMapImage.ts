// Builds the Traveller Map jump-map image URL and projects world coordinates
// onto the pixels of the image it returns.
//
// `/api/jumpmap` renders a PNG centred on one world. To ring the worlds that
// passed the filters we need to know which pixel each world lands on, and the
// endpoint documents no such contract. The projection below was recovered from
// the SVG rendering of the very same URL (`accept=image/svg+xml`), which states
// the transform outright:
//
//   <g transform="matrix(scale*cos30, 0, 0, scale, e, f)">
//     <g transform="translate(worldX - 0.5, worldY - evenShift(worldX)) ...">
//
// The `e`/`f` translation drops out once positions are measured relative to the
// centre world, so only the two scale factors are needed — which is what makes
// this stable enough to rely on.
//
// Verified against /api/jumpmap and /api/jumpworlds for Regina (1910), Extolay
// (1711, an even column), Terra, Deneb 1925 and Spinward Marches 0101 — that
// last one spanning four sectors — at jumps 1-6 and scales 24-64: every world's
// projected pixel matched the SVG's own to within half a pixel. That residual
// is the server fitting the render into whole-pixel image bounds, and it is far
// below the size of the markers drawn on top.
//
// Docs: https://travellermap.com/doc/api

const JUMPMAP_ENDPOINT = "https://travellermap.com/api/jumpmap";

/**
 * Horizontal spacing between hex columns, as a fraction of the vertical
 * spacing. Columns interlock, so each one advances by cos(30°) of a parsec.
 */
const COLUMN_RATIO = Math.sqrt(3) / 2;

/**
 * Traveller Map lays worlds out on the same "odd-q" hex grid `hexDistance`
 * works in: even columns sit half a hex higher than odd ones. Bitwise `&`
 * is used rather than `%` because it reports parity correctly for the negative
 * coordinates that worlds spinward and coreward of the origin carry.
 */
const evenShift = (worldX: number): number => ((worldX & 1) === 0 ? 0.5 : 0);

/** One of the render styles `/api/jumpmap` accepts. */
export type JumpMapStyle =
  | "poster" | "print" | "atlas" | "candy"
  | "draft" | "fasa" | "terminal" | "mongoose";

export interface JumpMapRequest {
  sector: string;
  hex: string;   // "XXYY", as the map formats it
  jump: number;  // radius in parsecs
  scale: number; // pixels per parsec
  style: JumpMapStyle;
}

/** Position within the returned image, in its own natural pixels. */
export interface JumpMapPoint {
  x: number;
  y: number;
}

/** Coordinates of a world in Traveller Map's world space. */
interface WorldPoint {
  worldX: number;
  worldY: number;
}

export const jumpMapUrl = ({ sector, hex, jump, scale, style }: JumpMapRequest): string => {
  const params = new URLSearchParams({
    sector,
    hex,
    jump: String(jump),
    scale: String(scale),
    style,
  });
  return `${JUMPMAP_ENDPOINT}?${params.toString()}`;
};

/**
 * Rendered size the map aims for, in natural pixels. Well above the widest the
 * layout ever displays it so the image stays sharp on high-density screens, and
 * well below the point where the server gives up: past roughly 1200x1330
 * `/api/jumpmap` answers `500 Failed to allocate bitmap (WxH). Insufficient
 * memory?` instead of an image.
 */
const TARGET_WIDTH = 1000;
const TARGET_HEIGHT = 1100;

/**
 * Bounds on the hex size requested, in pixels per parsec. The upper one only
 * ever binds at radius 1, where hitting the target width would need a hex so
 * large the server refuses to draw it.
 */
const MAX_SCALE = 200;
const MIN_SCALE = 16;

/**
 * Pixels per parsec to request for a map of the given radius.
 *
 * The endpoint takes a hex size, not an image size, and what it returns
 * measures about `scale * (sqrt(3) * jump + 1.5)` wide by
 * `scale * (2 * jump + 1.3)` tall — both fitted from real responses across
 * jumps 1-10 at scales 24-200. Inverting that keeps every radius near the same
 * rendered size, so a wide scan stays readable instead of arriving as a
 * postage stamp, and a narrow one does not balloon past what the server draws.
 */
export const jumpMapScale = (jump: number): number => {
  const byWidth = TARGET_WIDTH / (Math.sqrt(3) * jump + 1.5);
  const byHeight = TARGET_HEIGHT / (2 * jump + 1.3);
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.floor(Math.min(byWidth, byHeight))));
};

/**
 * Where `world` falls inside a jump map centred on `origin`.
 *
 * `width`/`height` are the image's natural pixel dimensions, read off the
 * loaded image rather than predicted: the server rounds the render to whole
 * pixels and the exact padding it adds around the outermost hex is not
 * documented, so measuring beats guessing.
 */
export const projectOnJumpMap = (
  world: WorldPoint,
  origin: WorldPoint,
  scale: number,
  width: number,
  height: number,
): JumpMapPoint => {
  const dx = world.worldX - origin.worldX;
  const dy = (world.worldY - origin.worldY)
    - (evenShift(world.worldX) - evenShift(origin.worldX));
  return {
    x: width / 2 + scale * COLUMN_RATIO * dx,
    y: height / 2 + scale * dy,
  };
};