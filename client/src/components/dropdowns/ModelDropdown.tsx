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
        <Button className="capitalize w-full flex items-center justify-between">
          <span>{model === "CHAT" ? "OKN AI" : "OKN AI (beta)"}</span>
          <img
            src={isDropdownOpen ? KeyboardArrowUp.src : KeyboardArrowDown.src}
            alt={isDropdownOpen ? "Collapse" : "Expand"}
            className="w-4 h-4"
          />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        className="w-48"
        aria-label="Dropdown Variants"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
      >
        <DropdownItem key="CHAT">OKN AI</DropdownItem>
        <DropdownItem key="SPARQL">OKN AI (beta)</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default ModelDropdown;
