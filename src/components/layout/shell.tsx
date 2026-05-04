"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const isCatalog = pathname === "/agent-catalog" || pathname === "/catalog" || pathname === "/design";

  return (
    // h-screen locks the outer shell to the viewport height
    // overflow-hidden prevents double-scrollbars
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: flex-shrink-0 so it never compresses; height fills viewport.
          Width is driven entirely by the Sidebar component via inline style. */}
      <div className="shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Right column: header + main — min-h-0 is REQUIRED so flex children
          can shrink below their intrinsic size and inner overflow-auto works */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <Header />
        <main
          className={
            isCatalog
              ? // Catalog: fill remaining height, own scroll, flex column
                "flex-1 min-h-0 overflow-auto flex flex-col"
              : // All other pages: padded scroll area
                "flex-1 min-h-0 overflow-auto p-6"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
