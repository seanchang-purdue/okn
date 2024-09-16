import { useState } from "react";

const useExpandMap = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);
  return { isExpanded, toggleExpand };
};

export default useExpandMap;
