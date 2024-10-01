import type { Metadata } from "next";
import { Work_Sans, Press_Start_2P, Orbitron } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { MyFirebaseProvider } from "@/components/firebase-providers";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

const workSans = Work_Sans({ subsets: ["latin"] });
const pressStart2P = Press_Start_2P(
  {
    subsets: ["latin"],
    weight: "400",
    display: "fallback",
    variable: "--font-press-start-2p"
  }
);
const orbitron = Orbitron({
  subsets: ["latin"], 
  weight: "400",
  variable: "--font-orbitron",
  display: "swap"
})

export const metadata: Metadata = {
  title: "lock in"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${workSans.className} ${orbitron.variable} ${pressStart2P.variable}`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          <MyFirebaseProvider>
            {children}
            <Toaster />
          </MyFirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
