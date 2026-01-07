"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Daily Reflection", labelKr: "오늘의 회고" },
  { href: "/quick-response", label: "Quick Response", labelKr: "즉흥 영작" },
  { href: "/think-aloud", label: "Think Aloud", labelKr: "브레인덤프" },
  { href: "/rephrasing", label: "Rephrasing", labelKr: "리프레이징" },
  { href: "/scenario", label: "Scenario", labelKr: "상황극" },
];

// Navigation을 숨길 경로들
const hiddenPaths = ["/login", "/auth/login", "/auth/register"];

export function Navigation() {
  const pathname = usePathname();

  // 로그인/인증 페이지에서는 Navigation 숨김
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-bold">
            ETutor
          </Link>
          <div className="flex gap-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.labelKr}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}


