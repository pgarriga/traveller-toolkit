import type { CSSProperties, FC, ReactNode } from "react";
import { useId } from "react";
import type { Theme } from "../../types/theme";

/**
 * The dimmed caption every form control in the app sits under.
 *
 * Exported for the few places that caption something that is not a single
 * labelable control — a button that opens a picker, a group of checkboxes —
 * where a `<label>` would have nothing valid to point at.
 */
export const fieldLabelStyle = (theme: Theme): CSSProperties => ({
  display: "block",
  fontSize: 12,
  color: theme.textDimmed,
  marginBottom: 4,
  fontWeight: 500,
});

interface FieldProps {
  label: ReactNode;
  theme: Theme;
  /**
   * Receives the generated id. Put it on the control so the caption points at
   * it — that is the whole reason this component exists.
   */
  children: (id: string) => ReactNode;
  /** Merged onto the wrapper, for grid spans and the like. */
  style?: CSSProperties;
}

/**
 * A labelled form control.
 *
 * The app used to write `<label>` and `<select>` as siblings with nothing
 * connecting them, which leaves the control with no accessible name: a screen
 * reader announces "combo box" and the caption is read as loose text, if at
 * all. Clicking the caption did nothing either.
 *
 * The id is generated with `useId` rather than passed in because several of
 * these blocks render more than once on a page — FreightView draws the same
 * world form for origin and destination — and duplicate ids would silently
 * point every caption at the first control.
 */
export const Field: FC<FieldProps> = ({ label, theme, children, style }) => {
  const id = useId();
  return (
    <div style={style}>
      <label htmlFor={id} style={fieldLabelStyle(theme)}>{label}</label>
      {children(id)}
    </div>
  );
};
