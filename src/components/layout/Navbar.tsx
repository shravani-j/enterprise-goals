"use client";

import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Menu,
  LogOut,
} from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-40">

      {/* MOBILE MENU */}
      <div className="flex items-center md:hidden">
        <Sheet>
<SheetTrigger className="-ml-2">
  <Menu className="w-5 h-5" />
</SheetTrigger>

          <SheetContent side="left" className="w-64 p-0">
            <div className="h-16 flex items-center px-6 border-b border-zinc-200 font-poppins font-bold text-xl">
              Enterprise
              <span className="text-[var(--color-dijon)]">
                Goals
              </span>
            </div>

            <div className="p-4 text-zinc-500 text-sm">
              Use desktop sidebar for navigation.
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4 ml-auto">

        {/* USER INFO */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-zinc-900">
            {session?.user?.name || "User"}
          </span>

          <span className="text-xs text-zinc-500">
            {session?.user?.role || "EMPLOYEE"}
          </span>
        </div>

        {/* LOGOUT BUTTON */}
        <Button
          onClick={() =>
            signOut({
              redirect: true,
              callbackUrl: "/",
            })
          }
          variant="outline"
          className="flex items-center gap-2 border-zinc-200 hover:bg-zinc-100"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}