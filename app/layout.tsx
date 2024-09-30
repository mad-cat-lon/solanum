import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { MyFirebaseProvider } from "@/components/firebase-providers";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

const font = Work_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "lock in"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(font.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
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
