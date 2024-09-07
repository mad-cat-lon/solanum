"use client";

import { UserNav } from "@/components/navbar/user-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { FC } from "react";
import { useUser } from "reactfire";
import { ModeToggle } from "@/components/navbar/toggle-theme";

export const NavbarUserLinks: FC = () => {
  const { data, hasEmitted } = useUser();

  return (
    <>
      <Link href="/stats" className={buttonVariants()}>
        Stats
      </Link>
      <ModeToggle/>
      {hasEmitted && data ? (
        <>
          <UserNav />
        </>
      ) : (
        <>
          <Link href="/login" className={buttonVariants()}>
            Login / Register &rarr;
          </Link>
        </>
      )}
    </>
  );
};
