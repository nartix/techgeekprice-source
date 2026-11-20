import { Center, Loader, Stack, Text } from "@mantine/core";

interface AdminLoadingProps {
  label: string;
}

export function AdminLoading({ label }: AdminLoadingProps) {
  return (
    <Center mih={220} aria-busy="true">
      <Stack align="center" gap="sm">
        <Loader aria-label={label} />
        <Text c="dimmed">{label}</Text>
      </Stack>
    </Center>
  );
}
