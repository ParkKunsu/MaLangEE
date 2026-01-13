import Image from "next/image";
import React from "react";

export type MalangEEStatus = "default" | "talking" | "humm";

interface MalangEEProps {
  status?: MalangEEStatus;
  size?: number;
  className?: string;
}

const statusImages: Record<MalangEEStatus, string> = {
  default: "/images/malangee.gif",
  talking: "/images/malangee-talking.gif",
  humm: "/images/malangee-humm.gif",
};

export const MalangEE = ({
  status = "default",
  size = 300,
  className = "",
}: MalangEEProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={statusImages[status]}
        alt={`MalangEE ${status}`}
        width={size}
        height={size}
        priority
        className="object-contain"
      />
    </div>
  );
};
