import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import DarkmodeButton from "./DarkmodeButton";
import ShareButton from "../share/ShareButton";
import ShareModal from "../share/ShareModal";

const OknNavbar = () => {
  const [shareUrl, setShareUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbedMode = searchParams.get("embed") === "true";

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    setShareUrl(currentUrl.toString());

    currentUrl.searchParams.set("embed", "true");
    setEmbedUrl(currentUrl.toString());
  }, [pathname, searchParams]);

  return (
    <>
      <nav className="flex w-full items-center justify-between border-b border-border bg-background px-4 py-2 text-foreground transition duration-150">
        <Link href="/" className="text-2xl font-bold text-foreground">
          OKN
        </Link>

        <div className="flex items-center gap-2">
          {!isEmbedMode && <ShareButton onPress={() => setIsShareOpen(true)} />}
          <div className="hidden lg:flex">
            <DarkmodeButton />
          </div>
        </div>
      </nav>

      <ShareModal
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        shareUrl={shareUrl}
        embedUrl={embedUrl}
      />
    </>
  );
};

export default OknNavbar;
