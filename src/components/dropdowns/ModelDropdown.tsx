import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SharedSelection } from "@heroui/react";
import type { ModelType } from "../../config/ws";

interface ModelDropdownProps {
  model: ModelType;
  selectedKeys: Set<ModelType>;
  onSelectionChange: (keys: SharedSelection) => void;
}

const MODEL_LABELS: Record<ModelType, string> = {
  CHAT: "OKN AI",
  SPARQL: "OKN AI (beta)",
};

const ModelDropdown = ({
  model,
  selectedKeys,
  onSelectionChange,
}: ModelDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selected = (Array.from(selectedKeys)[0] ?? model) as ModelType;

  return (
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-48 justify-between font-normal"
        >
          <span>{model === "CHAT" ? "OKN AI" : "OKN AI (beta)"}</span>
          {isDropdownOpen ? (
            <ChevronUp className="size-4 opacity-70" />
          ) : (
            <ChevronDown className="size-4 opacity-70" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48"
        aria-label="Model variants"
      >
        <DropdownMenuRadioGroup
          value={selected}
          onValueChange={(value) =>
            onSelectionChange(new Set([value]) as SharedSelection)
          }
        >
          <DropdownMenuRadioItem value="CHAT">
            {MODEL_LABELS.CHAT}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SPARQL">
            {MODEL_LABELS.SPARQL}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelDropdown;
