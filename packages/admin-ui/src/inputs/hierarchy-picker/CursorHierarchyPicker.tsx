"use client";

import {
  Alert,
  Button,
  Combobox,
  getContrastColor,
  getPrimaryShade,
  Group,
  Loader,
  Text,
  TextInput,
  useCombobox,
  useMantineTheme,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { CursorHierarchyOption } from "./cursor-hierarchy-picker.types";
import classes from "./CursorHierarchyPicker.module.css";

const EMPTY_OPTION_VALUE = "__cursor_hierarchy_empty_value__";

export function CursorHierarchyPicker({
  disabled = false,
  description,
  error,
  emptyLabel = "No options",
  errorMessage,
  hasMore = false,
  label,
  loading = false,
  loadingLabel = "Loading options",
  loadingMore = false,
  onChange,
  onLoadMore,
  onOpenChange,
  onRetry,
  onSearchChange,
  options,
  opened,
  emptyWhen = false,
  placeholder,
  renderOption,
  required = false,
  retryLabel = "Retry",
  loadMoreLabel = "Load more",
  value,
}: {
  readonly disabled?: boolean;
  readonly description?: string;
  readonly error?: string;
  readonly emptyLabel?: string;
  readonly emptyWhen?: boolean;
  readonly errorMessage?: string;
  readonly hasMore?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly loadingMore?: boolean;
  readonly onChange: (value: string) => void;
  readonly onLoadMore?: () => void;
  readonly onOpenChange?: (opened: boolean) => void;
  readonly onRetry?: () => void;
  readonly onSearchChange?: (value: string) => void;
  readonly options: readonly CursorHierarchyOption[];
  readonly opened?: boolean;
  readonly placeholder?: string;
  readonly renderOption?: (option: CursorHierarchyOption) => ReactNode;
  readonly required?: boolean;
  readonly retryLabel?: string;
  readonly loadMoreLabel?: string;
  readonly value: string;
}) {
  const theme = useMantineTheme();
  const highlightColor = (scheme: "light" | "dark") =>
    getContrastColor({
      autoContrast: true,
      color: `${theme.primaryColor}.${getPrimaryShade(theme, scheme)}`,
      theme,
    });
  const [search, setSearch] = useState("");
  const [rootSelected, setRootSelected] = useState(false);
  const optionKey = options
    .map((option) => `${option.id}\u0000${option.disabled ? "1" : "0"}`)
    .join("\u0001");
  const previousSelectionSync = useRef<{
    readonly dropdownOpened: boolean;
    readonly selectedOptionAvailable: boolean;
  } | null>(null);
  const combobox = useCombobox({
    onOpenedChange: onOpenChange,
    opened,
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch("");
      onSearchChange?.("");
    },
  });
  useEffect(() => {
    const previous = previousSelectionSync.current;
    const openedNow = combobox.dropdownOpened && !previous?.dropdownOpened;
    const selectedOptionAvailable = options.some(
      (option) => option.id === value,
    );
    const selectedOptionBecameAvailable =
      selectedOptionAvailable && !previous?.selectedOptionAvailable;

    previousSelectionSync.current = {
      dropdownOpened: combobox.dropdownOpened,
      selectedOptionAvailable,
    };

    if (
      combobox.dropdownOpened &&
      (openedNow || selectedOptionBecameAvailable)
    ) {
      combobox.selectActiveOption();
    }
  }, [combobox, combobox.dropdownOpened, optionKey, options, value]);
  const selectedLabel = useMemo(
    () => options.find((option) => option.id === value)?.label ?? "",
    [options, value],
  );
  const displayValue = search || (value || rootSelected ? selectedLabel : "");

  return (
    <Combobox
      classNames={{ dropdown: classes.dropdown, option: classes.option }}
      styles={{
        option: {
          "--picker-highlight-color": `light-dark(${highlightColor("light")}, ${highlightColor("dark")})`,
        },
      }}
      middlewares={{
        size: {
          padding: 8,
          apply({ availableHeight, elements }) {
            elements.floating.style.maxHeight = `min(20rem, ${Math.max(0, availableHeight)}px)`;
          },
        },
      }}
      store={combobox}
      onOptionSubmit={(nextValue) => {
        const optionId = nextValue === EMPTY_OPTION_VALUE ? "" : nextValue;
        const option = options.find((item) => item.id === optionId);
        if (!option || option.disabled) return;
        setRootSelected(option.id === "");
        onChange(option.id);
        setSearch("");
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target withExpandedAttribute>
        <TextInput
          classNames={{ description: classes.description }}
          disabled={disabled}
          description={description}
          error={error}
          label={label}
          loading={loading}
          placeholder={placeholder}
          required={required}
          value={displayValue}
          onChange={(event) => {
            const nextInputValue = event.currentTarget.value;
            const nextSearch = nextInputValue.startsWith(selectedLabel)
              ? nextInputValue.slice(selectedLabel.length)
              : nextInputValue;
            setSearch(nextSearch);
            onSearchChange?.(nextSearch);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onFocus={() => combobox.openDropdown()}
          onClick={() => combobox.openDropdown()}
        />
      </Combobox.Target>
      <Combobox.Dropdown
        mah="min(20rem, calc(100dvh - 1rem))"
        style={{
          display: combobox.dropdownOpened ? "flex" : "none",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Combobox.Header style={{ flexShrink: 0 }}>
            <Group gap="xs" role="status" aria-live="polite">
              <Loader size="xs" />
              <Text size="xs">{loadingLabel}</Text>
            </Group>
          </Combobox.Header>
        ) : null}
        {errorMessage ? (
          <Combobox.Header style={{ flexShrink: 0 }}>
            <Alert color="red" role="alert">
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm">{errorMessage}</Text>
                {onRetry ? (
                  <Button size="compact-xs" variant="subtle" onClick={onRetry}>
                    {retryLabel}
                  </Button>
                ) : null}
              </Group>
            </Alert>
          </Combobox.Header>
        ) : null}
        <Combobox.Options
          aria-label={label}
          mih={0}
          style={{ overflowY: "auto", overscrollBehavior: "contain" }}
        >
          {options.length === 0 || emptyWhen ? (
            <Combobox.Empty>{emptyLabel}</Combobox.Empty>
          ) : (
            options.map((option) => (
              <Combobox.Option
                active={option.id === value}
                aria-disabled={option.disabled || undefined}
                disabled={option.disabled}
                key={option.id}
                value={option.id || EMPTY_OPTION_VALUE}
              >
                {renderOption?.(option) ?? option.label}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
        {hasMore ? (
          <Combobox.Footer style={{ flexShrink: 0 }}>
            <Button
              fullWidth
              disabled={disabled || loadingMore}
              loading={loadingMore}
              variant="subtle"
              onClick={onLoadMore}
            >
              {loadMoreLabel}
            </Button>
          </Combobox.Footer>
        ) : null}
      </Combobox.Dropdown>
    </Combobox>
  );
}
