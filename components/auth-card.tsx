"use client";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "reactfire";

export const AuthCard = () => {
  const [isShowingSignUp, setIsShowingSignUp] = useState<boolean>(false);
  const { data: user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user]);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isShowingSignUp ? "sign up" : "sign in"}</CardTitle>
          <CardDescription>
             {isShowingSignUp ? "sign up" : "sign in"} to track your productivity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isShowingSignUp ? (
            <SignUpForm onShowLogin={() => setIsShowingSignUp(false)} />
          ) : (
            <SignInForm onShowSignUp={() => setIsShowingSignUp(true)} />
          )}
        </CardContent>
      </Card>
    </>
  );
};
