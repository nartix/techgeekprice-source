"use client";

import type { NotificationProvider } from "@refinedev/core";
import { notifications } from "@mantine/notifications";

export function createAdminNotificationProvider(): NotificationProvider {
  return {
    open: ({ key, message, description, type }) => {
      notifications.show({
        id: key,
        title: message,
        message: description,
        color: type === "error" ? "red" : type === "success" ? "green" : "blue",
        loading: type === "progress",
      });
    },
    close: (key) => {
      notifications.hide(key);
    },
  };
}
