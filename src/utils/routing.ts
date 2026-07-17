// URL routing helpers

type RoutingView = "home" | "planet" | "settings" | "freight" | "passenger" | "search" | "recent";

interface ParsedUrl {
  view: RoutingView;
  uwp: string | null;
}

// Support GitHub Pages subdirectory - Vite provides BASE_URL
export const getBasePath = (): string => {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const parseUrl = (): ParsedUrl => {
  const basePath = getBasePath();
  const path = window.location.pathname.replace(basePath, "") || "/";

  if (path === "/" || path === "") {
    return { view: "home", uwp: null };
  }
  if (path === "/recent") {
    return { view: "recent", uwp: null };
  }
  if (path === "/search") {
    return { view: "search", uwp: null };
  }
  if (path === "/settings") {
    return { view: "settings", uwp: null };
  }
  if (path === "/freight") {
    return { view: "freight", uwp: null };
  }
  if (path === "/passengers") {
    return { view: "passenger", uwp: null };
  }
  const planetMatch = path.match(/^\/planet\/([A-Za-z0-9-]+)$/);
  if (planetMatch) {
    return { view: "planet", uwp: planetMatch[1].toUpperCase() };
  }
  return { view: "home", uwp: null };
};

export const buildUrl = (view: RoutingView, uwp: string | null = null): string => {
  const basePath = getBasePath();
  if (view === "settings") return `${basePath}/settings`;
  if (view === "freight") return `${basePath}/freight`;
  if (view === "passenger") return `${basePath}/passengers`;
  if (view === "search") return `${basePath}/search`;
  if (view === "recent") return `${basePath}/recent`;
  if (view === "planet" && uwp) return `${basePath}/planet/${uwp.toUpperCase()}`;
  return basePath || "/";
};
