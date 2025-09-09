"use client"; // if you're using this in a Next.js app with App Router

import { ClerkProvider } from "@clerk/clerk-react";
import React from "react";

function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      {children}
    </ClerkProvider>
  );
}

export default AppClerkProvider;
