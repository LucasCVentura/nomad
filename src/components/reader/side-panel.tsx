"use client";

import { X } from "lucide-react";

export function SidePanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile only: this is still an overlay there, so a backdrop is needed
          to close it and to block interaction with the content behind it. */}
      <div
        className="fixed inset-0 z-40 bg-black/50 sm:hidden"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-5/6 max-w-sm flex-col
          border-border/60 bg-popover
          sm:static sm:z-auto sm:h-auto sm:w-80 sm:max-w-none sm:shrink-0 sm:border-l"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <p className="font-heading text-base text-foreground">{title}</p>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto p-4">{children}</div>
      </div>
    </>
  );
}
