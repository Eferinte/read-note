import { useEffect, useState } from "react";
import App from "./App";
import StaticReferencePage from "./StaticReferencePage";

const basePath = normalizedBasePath(import.meta.env.BASE_URL);

function normalizedPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function normalizedBasePath(pathname: string): string {
  const normalized = normalizedPathname(pathname);
  return normalized === "." ? "/" : normalized;
}

function appPathname(pathname: string): string {
  const normalized = normalizedPathname(pathname);

  if (basePath === "/") {
    return normalized;
  }

  if (normalized === basePath) {
    return "/";
  }

  if (normalized.startsWith(`${basePath}/`)) {
    return normalized.slice(basePath.length);
  }

  return normalized;
}

export default function Root() {
  const [pathname, setPathname] = useState(() =>
    typeof window === "undefined" ? "/" : appPathname(window.location.pathname)
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(appPathname(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname === "/static" ? <StaticReferencePage /> : <App />;
}
