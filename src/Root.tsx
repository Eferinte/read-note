import { useEffect, useState } from "react";
import App from "./App";
import StaticReferencePage from "./StaticReferencePage";

function normalizedPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export default function Root() {
  const [pathname, setPathname] = useState(() =>
    typeof window === "undefined" ? "/" : normalizedPathname(window.location.pathname)
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizedPathname(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname === "/static" ? <StaticReferencePage /> : <App />;
}
