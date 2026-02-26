import { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
} from "@heroui/react";
import type { SharedSelection } from "@heroui/react";
import type { ModelType } from "../../config/ws";
import KeyboardArrowUp from "../../icons/keyboard-arrow-up.svg";
import KeyboardArrowDown from "../../icons/keyboard-arrow-down.svg";

interface ModelDropdownProps {
  model: ModelType;
  selectedKeys: Set<ModelType>;
  onSelectionChange: (keys: SharedSelection) => void;
}

const ModelDropdown = ({
  model,
  selectedKeys,
  onSelectionChange,
}: ModelDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Dropdown
      className="w-48"
      onOpenChange={(isOpen) => setIsDropdownOpen(isOpen)}
    >
      <DropdownTrigger variant="light">
        <Button className="capitalize w-full flex items-center justify-between backdrop-blur-sm bg-white/30 dark:bg-slate-800/50 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all dark:text-white">
          <span>{model === "CHAT" ? "OKN AI" : "OKN AI (beta)"}</span>
          <span className="w-4 h-4 flex items-center justify-center dark:invert">
            <img
              src={isDropdownOpen ? KeyboardArrowUp.src : KeyboardArrowDown.src}
              alt={isDropdownOpen ? "Collapse" : "Expand"}
              className="w-4 h-4"
            />
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        className="w-48 dark:bg-slate-800 dark:border-slate-700"
        aria-label="Dropdown Variants"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
      >
        <DropdownItem
          key="CHAT"
          className="dark:text-white dark:hover:bg-slate-700"
        >
          OKN AI
        </DropdownItem>
        <DropdownItem
          key="SPARQL"
          className="dark:text-white dark:hover:bg-slate-700"
        >
          OKN AI (beta)
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default ModelDropdown;
