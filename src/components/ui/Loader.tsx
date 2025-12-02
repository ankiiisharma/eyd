import React from "react";

export const Loader: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 ${className}`}>
    <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin" />
  </div>
);

export default Loader; 