import type { FC } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { NearbyWorld } from "../types/nearby";
import { COLORS, THEMES } from "../constants/colors";
import {
  jumpMapScale,
  jumpMapUrl,
  projectOnJumpMap,
  type JumpMapStyle,
} from "../utils/jumpMapImage";
import { worldKey } from "../utils/nearby";

interface NearbyJumpMapProps {
  theme: Theme;
  t: TranslationFunction;
  origin: NearbyWorld;
  originHex: string;
  matches: NearbyWorld[];
  /** Route length per world, keyed by `worldKey`; missing = no fuel-safe route. */
  jumps: Map<string, number>;
  /** Filter radius in parsecs — the map is drawn exactly this wide. */
  radius: number;
}

/** Natural pixel size of the loaded image; markers are placed in this space. */
interface ImageSize {
  width: number;
  height: number;
}

// How far past the hex vertices the ring is pushed. Enough to read as a
// deliberate marker around the cell rather than a tight outline of it.
const RING_OVERSIZE = 1.18;

// The map's own styles, picked to sit on the app's two surfaces: `poster` is
// the black-background render, `print` the white-paper one.
const styleForTheme = (theme: Theme): JumpMapStyle =>
  theme.bg === THEMES.dark.bg ? "poster" : "print";

/**
 * The official Traveller Map jump map for the origin world, with the worlds
 * that passed the filters ringed on top.
 *
 * The image is served by travellermap.com and shows every world in the radius;
 * the ring layer is ours and marks only the matches, so the two together answer
 * "which of these are the ones I want". Markers are deliberately not clickable:
 * the results table below is the keyboard-accessible route to each world, and
 * duplicating it here would add a tab stop per world for no new capability.
 */
export const NearbyJumpMap: FC<NearbyJumpMapProps> = ({
  theme,
  t,
  origin,
  originHex,
  matches,
  jumps,
  radius,
}) => {
  const [size, setSize] = useState<ImageSize | null>(null);
  const [failed, setFailed] = useState(false);

  const scale = jumpMapScale(radius);
  const src = useMemo(
    () => jumpMapUrl({
      sector: origin.sector,
      hex: originHex,
      jump: radius,
      scale,
      style: styleForTheme(theme),
    }),
    [origin.sector, originHex, radius, scale, theme],
  );

  // Markers can only be placed once the image has reported its natural size.
  const markers = useMemo(() => {
    if (!size) return [];
    return matches.map(w => {
      const at = projectOnJumpMap(w, origin, scale, size.width, size.height);
      return {
        key: `${w.sector}-${w.hex}`,
        name: w.name || w.hex,
        reachable: jumps.get(worldKey(w)) !== undefined,
        ...at,
      };
    });
  }, [matches, origin, scale, size, jumps]);

  const originAt = size
    ? projectOnJumpMap(origin, origin, scale, size.width, size.height)
    : null;

  // The marker circumscribes the hex with room to spare: `scale` is the height
  // across the flats, so scale/sqrt(3) is the half-width across the vertices —
  // a circle that big already contains the whole cell, name and UWP included,
  // and `RING_OVERSIZE` pushes it a little further out.
  //
  // That is past the point where markers stay apart — neighbouring hex centres
  // are exactly one parsec, `scale` pixels, apart, so two adjacent matches
  // overlap. Deliberate: filling the hex was the priority. The stroke is taken
  // out of the radius so the outer edge, not the centre line, lands on that
  // boundary at any scale.
  const stroke = Math.max(2, scale * 0.05);
  const ring = (scale / Math.sqrt(3)) * RING_OVERSIZE - stroke / 2;

  if (failed) {
    return (
      <div style={{ fontSize: 12, color: theme.textDimmed, lineHeight: 1.5 }}>
        {t("nearbyMapError")}
      </div>
    );
  }

  return (
    <>
      <div className="nearby-jumpmap">
        <img
          src={src}
          alt={t("nearbyMapAlt")
            .replace("{w}", origin.name || originHex)
            .replace("{d}", String(radius))}
          width={size?.width}
          height={size?.height}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 8, background: theme.bg }}
          onLoad={e => {
            const img = e.currentTarget;
            setSize({ width: img.naturalWidth, height: img.naturalHeight });
          }}
          onError={() => setFailed(true)}
        />

        {size && (
          <svg
            viewBox={`0 0 ${size.width} ${size.height}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            {/* "You are here": left unfilled so it never reads as a match. */}
            {originAt && (
              <circle
                cx={originAt.x}
                cy={originAt.y}
                r={ring}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth={stroke}
                strokeDasharray={`${scale * 0.14} ${scale * 0.1}`}
              />
            )}
            {/*
              Every match ring is steel blue, not the Traveller orange: on both
              map styles the orange reads as red against the black/white paper,
              and the map itself already prints red for red travel zones and
              political borders. Reachable vs not is carried by the stroke —
              solid with a tint, or dashed and hollow — so the colour stays free
              to mean just "this one passed the filters".
            */}
            {markers.map(m => (
              <circle
                key={m.key}
                cx={m.x}
                cy={m.y}
                r={ring}
                fill={COLORS.info}
                // Light enough that the world's own name, UWP and trade
                // routes stay legible through it on both map styles — the
                // tint marks the hex, the map underneath still reads.
                fillOpacity={m.reachable ? 0.18 : 0}
                stroke={COLORS.info}
                strokeWidth={stroke}
                strokeDasharray={
                  m.reachable ? undefined : `${scale * 0.14} ${scale * 0.1}`
                }
              />
            ))}
          </svg>
        )}
      </div>

      <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.6 }}>
        {/* Filled vs hollow, mirroring the solid and dashed rings on the map. */}
        <span style={{ color: COLORS.info }}>●</span> {t("nearbyMapLegendMatch")}
        {" · "}
        <span style={{ color: COLORS.info }}>○</span> {t("nearbyMapLegendNoRoute")}
        <br />
        {t("nearbyMapCredit")}
      </div>
    </>
  );
};
