import { MantineProvider } from "@mantine/core";
import {
  render as testingLibraryRender,
  type RenderOptions,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { tgpTheme } from "../src/theme";

interface TestProviderProps {
  children: ReactNode;
}

function TestProvider({ children }: TestProviderProps) {
  return (
    <MantineProvider
      defaultColorScheme="light"
      env="test"
      theme={tgpTheme}
    >
      {children}
    </MantineProvider>
  );
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper">;

export function render(ui: ReactElement, options?: CustomRenderOptions) {
  return testingLibraryRender(ui, {
    wrapper: TestProvider,
    ...options,
  });
}
