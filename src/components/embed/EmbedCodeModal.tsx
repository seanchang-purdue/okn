import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  embedUrl: string;
}

const EmbedCodeModal = ({ isOpen, onOpenChange, embedUrl }: EmbedCodeModalProps) => {
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(600);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  const embedCode = useMemo(() => {
    return `<iframe src="${embedUrl}" width="${width}" height="${height}" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }, [embedUrl, height, width]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error("Failed to copy embed code", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Input
                type="number"
                min={320}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value) || 900)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Height</Label>
              <Input
                type="number"
                min={320}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value) || 600)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Embed URL</p>
            <Input readOnly value={embedUrl} className="bg-muted text-xs" />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Iframe code</p>
            <Textarea
              readOnly
              value={embedCode}
              rows={4}
              className="bg-muted text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={copyCode}>
            {copied ? "Copied" : "Copy code"}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmbedCodeModal;
