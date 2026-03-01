import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Embed Code</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-[var(--chat-muted)]">Width</span>
                  <input
                    type="number"
                    min={320}
                    value={width}
                    onChange={(event) => setWidth(Number(event.target.value) || 900)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-[var(--chat-muted)]">Height</span>
                  <input
                    type="number"
                    min={320}
                    value={height}
                    onChange={(event) => setHeight(Number(event.target.value) || 600)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
              </div>

              <div>
                <p className="mb-1 text-xs text-[var(--chat-muted)]">Embed URL</p>
                <input
                  readOnly
                  value={embedUrl}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <p className="mb-1 text-xs text-[var(--chat-muted)]">Iframe code</p>
                <textarea
                  readOnly
                  value={embedCode}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={copyCode}>
                {copied ? "Copied" : "Copy code"}
              </Button>
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

export default EmbedCodeModal;
