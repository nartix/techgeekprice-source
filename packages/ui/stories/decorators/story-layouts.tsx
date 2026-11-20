import type { ReactNode } from "react";

interface StoryLayoutProps {
  children: ReactNode;
}

export function NarrowContainer({ children }: StoryLayoutProps) {
  return <div style={{ width: 320 }}>{children}</div>;
}

export function WideContainer({ children }: StoryLayoutProps) {
  return (
    <div style={{ width: "min(calc(100vw - 2rem), 72rem)" }}>{children}</div>
  );
}
