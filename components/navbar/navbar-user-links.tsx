"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserNav } from "@/components/navbar/user-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { FC } from "react";
import { useUser } from "reactfire";
import { ThemeToggle } from "@/components/navbar/toggle-theme";

export const NavbarUserLinks: FC = () => {
  const { data, hasEmitted } = useUser();

  return (
    <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
      <Link href="/stats" className={buttonVariants()}>
        stats
      </Link>
      <Link href="/settings" className={buttonVariants()}>
        settings
      </Link>
      <ThemeToggle/>
      {hasEmitted && data ? (
        <>
          <UserNav />
        </>
      ) : (
        <>
          <Link href="/login" className={buttonVariants()}>
            login / register &rarr;
          </Link>
        </>
      )}
    </div>
  );
};
