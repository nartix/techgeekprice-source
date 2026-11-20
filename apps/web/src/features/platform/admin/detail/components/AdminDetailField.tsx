"use client";

import { Table } from "@mantine/core";

import type { AdminDetailRenderable } from "../types/admin-detail.types";

interface AdminDetailFieldProps {
  label: string;
  node: AdminDetailRenderable;
}

export function AdminDetailField({ label, node }: AdminDetailFieldProps) {
  return (
    <Table.Tr>
      <Table.Th scope="row" w="32%">
        {label}
      </Table.Th>
      <Table.Td>{node}</Table.Td>
    </Table.Tr>
  );
}
