// src/app/datacube/layout.tsx
import type { Metadata } from "next";
import "../../styles/global.css";
import Providers from "../providers";
import DarkmodeInitializer from "../../components/utils/DarkmodeInitializer";

export const metadata: Metadata = {
  title: "OKN — Data Cube Explorer",
  description: "Explore gun violence data with pivot tables and charts",
};

export default function DatacubeLayout({
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
