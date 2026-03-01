import { useEffect, useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  useDisclosure,
} from "@heroui/react";
import { usePathname, useSearchParams } from "next/navigation";
import DarkmodeButton from "./DarkmodeButton";
import ShareButton from "../share/ShareButton";
import ShareModal from "../share/ShareModal";

const OknNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
      <Navbar
        isBordered
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className="w-full text-foreground transition duration-150 py-0"
      >
        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand>
            <p className="font-bold text-inherit">OKN</p>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarBrand>
            <Link
              className="font-bold text-black dark:text-white text-2xl"
              href="/"
            >
              OKN
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="end">
          {!isEmbedMode && (
            <NavbarItem>
              <ShareButton onPress={onOpen} />
            </NavbarItem>
          )}
          <NavbarItem className="hidden lg:flex">
            <DarkmodeButton />
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <ShareModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        shareUrl={shareUrl}
        embedUrl={embedUrl}
      />
    </>
  );
};

export default OknNavbar;
