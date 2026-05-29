"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

type MobileNav = { open: boolean; setOpen: (v: boolean) => void };
const MobileNavCtx = createContext<MobileNav>({ open: false, setOpen: () => {} });

export function useMobileNav() {
  return useContext(MobileNavCtx);
}

export function Shell({
  sidebar,
  topbar,
  children,
  sidebarWidth = 232,
  style,
}: {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  sidebarWidth?: number;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating (mobile).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const shellStyle = { "--ek-sidebar-w": `${sidebarWidth}px`, ...style } as React.CSSProperties;

  return (
    <MobileNavCtx.Provider value={{ open, setOpen }}>
      <div className="ek-shell" style={shellStyle}>
        <aside className={"ek-sidebar" + (open ? " ek-open" : "")}>{sidebar}</aside>
        <div
          className={"ek-backdrop" + (open ? " ek-open" : "")}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div className="ek-main">
          {topbar}
          <div className="ek-content ek-scroll">{children}</div>
        </div>
      </div>
    </MobileNavCtx.Provider>
  );
}

export function MobileMenuButton() {
  const { setOpen } = useMobileNav();
  return (
    <button type="button" className="ek-burger" aria-label="Menu" onClick={() => setOpen(true)}>
      <Icon name="menu" size={18} />
    </button>
  );
}
