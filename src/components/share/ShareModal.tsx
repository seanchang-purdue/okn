import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  shareUrl: string;
  embedUrl: string;
}

const ShareModal = ({
  isOpen,
  onOpenChange,
  shareUrl,
  embedUrl,
}: ShareModalProps) => {
  const [copied, setCopied] = useState<"" | "link" | "embed">("");

  useEffect(() => {
    if (!isOpen) {
      setCopied("");
    }
  }, [isOpen]);

  const copyToClipboard = async (value: string, target: "link" | "embed") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied(""), 1500);
    } catch (error) {
      console.error("Failed to copy share URL", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Current view URL</p>
            <Input readOnly value={shareUrl} className="bg-muted" />
            <Button
              variant="default"
              size="sm"
              onClick={() => copyToClipboard(shareUrl, "link")}
            >
              {copied === "link" ? "Copied" : "Copy link"}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Embed mode URL</p>
            <Input readOnly value={embedUrl} className="bg-muted" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(embedUrl, "embed")}
            >
              {copied === "embed" ? "Copied" : "Copy embed URL"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
