"use client";

import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "glow" | "regular";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export default function Button({
  variant = "glow",
  size = "md",
  children,
  className = "",
  href,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-[0.875rem] py-[0.375rem] text-[0.875rem]",
    md: "px-[1.25rem] py-[0.625rem] text-[1rem]",
    lg: "px-[1.75rem] py-[0.875rem] text-[1.125rem] font-semibold",
  };

  const variantClasses = {
    glow: "btn-glow shadow-sm",
    regular: "btn-regular shadow-sm font-medium",
  };

  const combinedClassName = `inline-flex items-center justify-center gap-2 font-montserrat transition-all duration-200 select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={combinedClassName}
        style={{ borderRadius: "var(--radius-btn, 8px)" }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      style={{ borderRadius: "var(--radius-btn, 8px)" }}
      {...props}
    >
      {children}
    </button>
  );
}
