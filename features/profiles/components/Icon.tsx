import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

/** A Font Awesome icon drawn as inline SVG, sized to the surrounding text. */
export default function Icon({ icon }: { icon: IconDefinition }) {
  const [width, height, , , path] = icon.icon;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      {(Array.isArray(path) ? path : [path]).map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
