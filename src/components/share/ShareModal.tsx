import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Share</ModalHeader>
            <ModalBody>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current view URL</p>
                  <input
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={() => copyToClipboard(shareUrl, "link")}
                  >
                    {copied === "link" ? "Copied" : "Copy link"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Embed mode URL</p>
                  <input
                    readOnly
                    value={embedUrl}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <Button
                    color="default"
                    variant="flat"
                    size="sm"
                    onPress={() => copyToClipboard(embedUrl, "embed")}
                  >
                    {copied === "embed" ? "Copied" : "Copy embed URL"}
                  </Button>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ShareModal;
