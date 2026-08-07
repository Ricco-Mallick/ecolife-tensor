// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useState, type ComponentProps } from "react";
import Globe from "@/components/originkit/ui/hero-23/globe";
import Stardust from "@/components/originkit/ui/hero-23/stardust";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
};

/** Mounts the WebGL globe only when the viewport matches, so the
 *  mobile and desktop layouts never run two scenes at once. */
export const MediaGlobe = ({ query }: { query: string }) => {
  if (!useMediaQuery(query)) return null;

  // Component defaults stay as authored; only the framing scale is overridden
  // here so the sphere's silhouette exactly fills its box (370.4px mobile /
  // 898px desktop), matching Figma node 2001:21604.
  return (
    <Globe
      scale={9.7}
      initialLatitude={12}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

/** Same idea for the particle field — the hidden breakpoint's canvas never
 *  gets created, so only one animation loop is ever alive. */
export const MediaStardust = ({
  query,
  ...props
}: { query: string } & ComponentProps<typeof Stardust>) => {
  if (!useMediaQuery(query)) return null;

  return <Stardust {...props} style={{ width: "100%", height: "100%" }} />;
};
