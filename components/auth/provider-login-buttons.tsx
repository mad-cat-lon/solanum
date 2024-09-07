"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { GithubIcon } from "lucide-react";
import { FC, useState } from "react";
import { useAuth, useFirestore } from "reactfire";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

interface Props {
  onSignIn?: () => void;
}

export const ProviderLoginButtons: FC<Props> = ({ onSignIn }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const createUserInFirestore = async (user: any) => {
    const userDocRef = doc(firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);

    // Check if the user already exists in Firestore
    if (!userDoc.exists()) {
      // Create the user document with the sign-in data
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerId: user.providerData[0].providerId,
        createdAt: serverTimestamp(), // Store the timestamp when the user was created
      });
    }
  };
  
  const doProviderSignIn = async (provider: GoogleAuthProvider) => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      await createUserInFirestore(user);
      toast({ title: "Signed in!" });
      onSignIn?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error signing in", description: `${err}` });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Button
        className="w-full"
        disabled={isLoading}
        onClick={async () => {
          const provider = new GoogleAuthProvider();

          await doProviderSignIn(provider);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 488 512"
          fill="currentColor"
          className="mr-2"
        >
          <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
        </svg>
        Google
      </Button>
      <Button
        className="w-full"
        disabled={isLoading}
        onClick={async () => {
          const provider = new GithubAuthProvider();
          await doProviderSignIn(provider);
        }}
      >
        <GithubIcon className="w-4 h-4 mr-2" />
        Github
      </Button>
    </>
  );
};
