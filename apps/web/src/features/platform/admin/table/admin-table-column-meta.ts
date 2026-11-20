import type { RowData } from "@tanstack/react-table";

import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "center" | "right";
    headerLabel?: string;
    minWidth?: number;
    width?: number | string;
    testId?: string;
    isActionColumn?: boolean;
  }
}

export {};
