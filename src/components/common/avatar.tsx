"use client";

import { getUserFullNameInitial } from "@/lib/utils/getUserFullNameInitial";
import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  avatarUrl?: string | null;
  fullName?: string;
  variant?: "circle" | "square";
  size?: "sm" | "md" | "lg";
}

export function Avatar({
  avatarUrl,
  fullName = "User",
  variant = "circle",
  size = "md",
}: AvatarProps) {
  const cleanUrl = avatarUrl?.trim();

  // url hiện tại và trạng thái lỗi
  const [[currentUrl, isError], setUrlState] = useState([cleanUrl, false]);

  // Nếu url từ props truyền vào khác với url đang lưu ở State, tự động reset isError về false
  if (cleanUrl !== currentUrl) {
    setUrlState([cleanUrl, false]);
  }

  const shapeClass = variant === "circle" ? "rounded-full" : "rounded-md";

  const sizeClasses = {
    sm: "size-9 text-sm",
    md: "size-16 text-xl",
    lg: "size-24 text-3xl",
  };

  const currentSizeClass = sizeClasses[size];

  // FALLBACK: Nếu không có URL hoặc ảnh bị lỗi kích hoạt
  if (isError || !cleanUrl) {
    return (
      <div
        className={`${currentSizeClass} ${shapeClass} flex items-center justify-center select-none border-2 border-[#25304A] bg-gradient-to-br from-cyan/20 to-purple/20 text-lg font-bold text-foreground`}
        title={fullName}
      >
        {getUserFullNameInitial(fullName)}
      </div>
    );
  }

  return (
    <div
      className={`relative ${currentSizeClass} ${shapeClass} border-2 border-[#25304A] bg-[#0b1020] overflow-hidden`}
    >
      <Image
        src={cleanUrl}
        alt={`${fullName}'s avatar`}
        fill
        sizes="(max-width: 768px) 64px, 96px"
        className="object-cover"
        onError={() => setUrlState([cleanUrl, true])} // Khi lỗi, set trạng thái lỗi tương ứng với url đó
      />
    </div>
  );
}
