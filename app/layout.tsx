import type { Metadata } from "next";
import "./globals.css";
import SocketListener from "./SocketListener";

export const metadata: Metadata = {
  title: "CMS RBAC Frontend",
  description:
    "A role-based access control CMS frontend with login, register, and dashboard routes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SocketListener />
        {children}
      </body>
    </html>
  );
}
