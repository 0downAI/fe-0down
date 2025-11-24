import React from "react";
import { AuroraText } from "./ui/aurora-text";
function Header() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-2 my-4">
        <h1 className="text-2xl font-bold text-gray-900">
          0down.<AuroraText>AI</AuroraText>
        </h1>
      </div>
    </div>
  );
}

export default Header;
