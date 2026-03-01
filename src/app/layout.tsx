import type { Metadata } from "next";
import "../styles/global.css";
import Providers from "./providers";
import DarkmodeInitializer from "../components/utils/DarkmodeInitializer";

export const metadata: Metadata = {
  title: "OKN",
  description: "Open Knowledge Network - Gun Violence Intelligence Platform",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DarkmodeInitializer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
