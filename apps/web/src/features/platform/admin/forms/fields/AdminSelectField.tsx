import { Select, type SelectProps } from "@mantine/core";
import type { KeyboardEventHandler } from "react";
import { useRef, useState } from "react";
import { Controller } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import classes from "./AdminSelectField.module.css";
import type {
  AdminFieldOptionState,
  AdminFormField,
} from "../types/admin-form.types";

interface AdminSelectFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  optionState: AdminFieldOptionState;
  required: boolean;
}

export function AdminSelectField<TValues extends FieldValues>({
  disabled,
  field,
  form,
  optionState,
  required,
}: AdminSelectFieldProps<TValues>) {
  const [pendingKeyboardSelection, setPendingKeyboardSelection] =
    useState(false);
  const [relationDropdownOpened, setRelationDropdownOpened] = useState(false);
  const activeRelationKeyboardOption = useRef<
    AdminFieldOptionState["options"][number] | null
  >(null);
  const pendingRelationKeyboardDirection = useRef<"next" | "previous">("next");
  const relationKeyboardNavigationStarted = useRef(false);

  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField, fieldState }) => {
        const isRelationSelect = field.type === "relation-select";
        const value = rhfField.value ? String(rhfField.value) : null;
        const {
          onDropdownClose: inputOnDropdownClose,
          onDropdownOpen: inputOnDropdownOpen,
          onKeyDown: inputOnKeyDown,
          onKeyDownCapture: inputOnKeyDownCapture,
          classNames: inputClassNames,
          ...inputProps
        } = field.inputProps ?? {};
        const data = optionState.options.map((option) => ({
          disabled: option.disabled,
          label: option.label,
          value: String(option.value),
        }));
        const selectClassNames = getSelectClassNames(
          inputClassNames as SelectProps["classNames"] | undefined,
          isRelationSelect,
        );

        return (
          <Select
            clearable
            allowDeselect={!isRelationSelect}
            comboboxProps={{ withinPortal: false }}
            data={data}
            description={field.description ?? field.helpText}
            disabled={disabled}
            dropdownOpened={
              isRelationSelect ? relationDropdownOpened : undefined
            }
            error={fieldState.error?.message ?? optionState.error}
            label={field.label}
            openOnFocus={isRelationSelect ? false : undefined}
            placeholder={field.placeholder}
            required={required}
            searchable={isRelationSelect}
            selectFirstOptionOnDropdownOpen={isRelationSelect && value == null}
            value={value}
            onBlur={() => {
              setPendingKeyboardSelection(false);
              activeRelationKeyboardOption.current = null;
              relationKeyboardNavigationStarted.current = false;
              setRelationDropdownOpened(false);
              rhfField.onBlur();
            }}
            onChange={(value) => {
              setPendingKeyboardSelection(false);
              activeRelationKeyboardOption.current = null;
              relationKeyboardNavigationStarted.current = false;
              setRelationDropdownOpened(false);
              rhfField.onChange(value ?? "");
            }}
            onDropdownClose={() => {
              if (typeof inputOnDropdownClose === "function") {
                inputOnDropdownClose();
              }

              if (isRelationSelect) {
                setPendingKeyboardSelection(false);
                activeRelationKeyboardOption.current = null;
                relationKeyboardNavigationStarted.current = false;
                setRelationDropdownOpened(false);
              }
            }}
            onDropdownOpen={() => {
              if (typeof inputOnDropdownOpen === "function") {
                inputOnDropdownOpen();
              }

              if (isRelationSelect) {
                relationKeyboardNavigationStarted.current = false;
                setRelationDropdownOpened(true);
              }
            }}
            onSearchChange={optionState.setSearch}
            {...inputProps}
            classNames={selectClassNames}
            onKeyDownCapture={(event) => {
              if (typeof inputOnKeyDownCapture === "function") {
                (
                  inputOnKeyDownCapture as KeyboardEventHandler<HTMLInputElement>
                )(event);
              }

              if (!isRelationSelect || event.defaultPrevented) {
                return;
              }

              if (event.key === "Escape") {
                setPendingKeyboardSelection(false);
                activeRelationKeyboardOption.current = null;
                relationKeyboardNavigationStarted.current = false;
                setRelationDropdownOpened(false);
                event.currentTarget.removeAttribute("aria-activedescendant");

                return;
              }

              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                setRelationDropdownOpened(true);
                const preferInputValue =
                  !relationKeyboardNavigationStarted.current;

                const direction =
                  event.key === "ArrowDown" ? "next" : "previous";
                pendingRelationKeyboardDirection.current = direction;
                const target = event.currentTarget;
                const activeOption = selectRelationKeyboardOption(
                  target,
                  direction,
                  optionState.options,
                  { preferInputValue, selectedValue: value },
                );

                if (activeOption) {
                  activeRelationKeyboardOption.current = activeOption;
                  relationKeyboardNavigationStarted.current = true;
                  setPendingKeyboardSelection(false);
                } else if (relationDropdownOpened) {
                  activeRelationKeyboardOption.current = null;
                  relationKeyboardNavigationStarted.current = false;
                  setPendingKeyboardSelection(true);
                  target.removeAttribute("aria-activedescendant");
                } else {
                  activeRelationKeyboardOption.current = null;
                  relationKeyboardNavigationStarted.current = false;
                  setPendingKeyboardSelection(true);
                  target.removeAttribute("aria-activedescendant");

                  window.setTimeout(() => {
                    const nextActiveOption = selectRelationKeyboardOption(
                      target,
                      direction,
                      optionState.options,
                      { preferInputValue, selectedValue: value },
                    );

                    activeRelationKeyboardOption.current = nextActiveOption;
                    relationKeyboardNavigationStarted.current =
                      Boolean(nextActiveOption);
                    setPendingKeyboardSelection(!nextActiveOption);

                    if (!nextActiveOption) {
                      target.removeAttribute("aria-activedescendant");
                    }
                  }, 0);
                }

                return;
              }

              if (event.key === "Enter" || isKeyboardSelectionSpace(event)) {
                const activeOption = relationKeyboardNavigationStarted.current
                  ? (activeRelationKeyboardOption.current ??
                    selectRelationKeyboardOption(
                      event.currentTarget,
                      "next",
                      optionState.options,
                    ))
                  : pendingKeyboardSelection
                    ? selectRelationKeyboardOption(
                        event.currentTarget,
                        pendingRelationKeyboardDirection.current,
                        optionState.options,
                        { preferInputValue: true, selectedValue: value },
                      )
                  : (getActiveKeyboardOption(
                      event.currentTarget,
                      optionState.options,
                    ) ?? activeRelationKeyboardOption.current);

                if (activeOption) {
                  event.preventDefault();
                  event.stopPropagation();
                  setPendingKeyboardSelection(false);
                  activeRelationKeyboardOption.current = null;
                  relationKeyboardNavigationStarted.current = false;
                  setRelationDropdownOpened(false);
                  optionState.setSearch(activeOption.label);
                  rhfField.onChange(String(activeOption.value));

                  return;
                }

                if (
                  pendingKeyboardSelection ||
                  relationKeyboardNavigationStarted.current
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  setPendingKeyboardSelection(false);
                  activeRelationKeyboardOption.current = null;
                  relationKeyboardNavigationStarted.current = false;
                }
              }
            }}
            onKeyDown={(event) => {
              if (typeof inputOnKeyDown === "function") {
                (
                  inputOnKeyDown as KeyboardEventHandler<HTMLInputElement>
                )(event);
              }

              if (!isRelationSelect || event.defaultPrevented) {
                return;
              }

              if (event.key === "ArrowDown") {
                setRelationDropdownOpened(true);

                if (value == null) {
                  const target = event.currentTarget;

                  window.setTimeout(() => {
                    setPendingKeyboardSelection(
                      !target.getAttribute("aria-activedescendant"),
                    );
                  }, 0);
                }

                return;
              }

              if (isKeyboardSelectionSpace(event)) {
                const activeOption = getActiveKeyboardOption(
                  event.currentTarget,
                  optionState.options,
                );

                if (
                  activeOption &&
                  isNavigatingRelationSelectOptions({
                    inputValue: event.currentTarget.value,
                    options: optionState.options,
                    value,
                  })
                ) {
                  event.preventDefault();
                  setPendingKeyboardSelection(false);
                  activeRelationKeyboardOption.current = null;
                  relationKeyboardNavigationStarted.current = false;
                  setRelationDropdownOpened(false);
                  optionState.setSearch(activeOption.label);
                  rhfField.onChange(String(activeOption.value));
                }

                return;
              }

              if (
                event.key === "Enter" &&
                pendingKeyboardSelection &&
                value == null
              ) {
                event.preventDefault();
                setPendingKeyboardSelection(false);
                activeRelationKeyboardOption.current = null;
                relationKeyboardNavigationStarted.current = false;

                const firstEnabledOption = optionState.options.find(
                  (option) => !option.disabled,
                );

                if (firstEnabledOption) {
                  setRelationDropdownOpened(false);
                  optionState.setSearch(firstEnabledOption.label);
                  rhfField.onChange(String(firstEnabledOption.value));
                }
              }
            }}
          />
        );
      }}
    />
  );
}

function selectRelationKeyboardOption(
  input: HTMLInputElement,
  direction: "next" | "previous",
  optionStateOptions: AdminFieldOptionState["options"],
  selectionOptions?: {
    preferInputValue?: boolean;
    selectedValue?: string | null;
  },
): AdminFieldOptionState["options"][number] | null {
  const list = getComboboxOptionsList(input);

  if (!list) {
    return null;
  }

  const options = Array.from(
    list.querySelectorAll<HTMLElement>("[data-combobox-option]"),
  ).filter((option) => !option.hasAttribute("data-combobox-disabled"));

  if (options.length === 0) {
    return null;
  }

  const activeOptionId = input.getAttribute("aria-activedescendant");
  const activeIndex = activeOptionId
    ? options.findIndex((option) => option.id === activeOptionId)
    : -1;
  const inputValueIndex = options.findIndex(
    (option) => getComboboxOptionText(option) === input.value.trim(),
  );
  const selectedValueLabel = optionStateOptions.find(
    (option) =>
      !option.disabled &&
      String(option.value) === selectionOptions?.selectedValue,
  )?.label;
  const selectedValueIndex = selectedValueLabel
    ? options.findIndex(
        (option) => getComboboxOptionText(option) === selectedValueLabel,
      )
    : -1;
  const currentIndex = getCurrentRelationKeyboardIndex({
    activeIndex,
    inputValueIndex,
    preferInputValue: selectionOptions?.preferInputValue,
    selectedValueIndex,
  });
  const nextIndex =
    direction === "next"
      ? currentIndex >= 0
        ? (currentIndex + 1) % options.length
        : 0
      : currentIndex >= 0
        ? (currentIndex - 1 + options.length) % options.length
        : options.length - 1;
  const nextOption = options[nextIndex];

  if (!nextOption) {
    return null;
  }

  for (const selectedOption of list.querySelectorAll<HTMLElement>(
    "[data-combobox-selected]",
  )) {
    selectedOption.removeAttribute("data-combobox-selected");
    selectedOption.removeAttribute("aria-selected");
  }

  nextOption.setAttribute("data-combobox-selected", "true");
  nextOption.setAttribute("aria-selected", "true");
  input.setAttribute("aria-activedescendant", nextOption.id);
  nextOption.scrollIntoView({ block: "nearest" });

  const nextOptionLabel = getComboboxOptionText(nextOption);

  return (
    optionStateOptions.find(
      (option) => !option.disabled && option.label === nextOptionLabel,
    ) ?? null
  );
}

function getComboboxOptionsList(input: HTMLInputElement): HTMLElement | null {
  const listId = input.getAttribute("aria-controls");

  if (listId) {
    return document.getElementById(listId);
  }

  return document.querySelector<HTMLElement>("[role='listbox']");
}

function getComboboxOptionText(option: HTMLElement): string {
  return option.textContent?.trim() ?? "";
}

function getCurrentRelationKeyboardIndex(args: {
  activeIndex: number;
  inputValueIndex: number;
  preferInputValue?: boolean;
  selectedValueIndex: number;
}) {
  if (args.preferInputValue && args.selectedValueIndex >= 0) {
    return args.selectedValueIndex;
  }

  if (args.preferInputValue && args.inputValueIndex >= 0) {
    return args.inputValueIndex;
  }

  return args.activeIndex >= 0 ? args.activeIndex : args.inputValueIndex;
}

function getSelectClassNames(
  inputClassNames: SelectProps["classNames"] | undefined,
  isRelationSelect: boolean,
): SelectProps["classNames"] | undefined {
  if (!isRelationSelect) {
    return inputClassNames;
  }

  if (typeof inputClassNames === "function") {
    return (theme, props, ctx) => {
      const resolvedClassNames = inputClassNames(theme, props, ctx);

      return {
        ...resolvedClassNames,
        option: joinClassNames(
          resolvedClassNames.option,
          classes.relationOption,
        ),
      };
    };
  }

  return {
    ...inputClassNames,
    option: joinClassNames(inputClassNames?.option, classes.relationOption),
  };
}

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

function isKeyboardSelectionSpace(
  event: Parameters<KeyboardEventHandler<HTMLInputElement>>[0],
): boolean {
  return event.key === " " || event.key === "Spacebar";
}

function isNavigatingRelationSelectOptions(args: {
  inputValue: string;
  options: AdminFieldOptionState["options"];
  value: string | null;
}): boolean {
  if (args.inputValue.trim().length === 0) {
    return true;
  }

  if (args.value == null) {
    return false;
  }

  return args.options.some(
    (option) =>
      String(option.value) === args.value && option.label === args.inputValue,
  );
}

function getActiveKeyboardOption(
  input: HTMLInputElement,
  options: AdminFieldOptionState["options"],
) {
  const activeOptionId = input.getAttribute("aria-activedescendant");

  if (!activeOptionId) {
    return undefined;
  }

  const activeOptionLabel = document.getElementById(activeOptionId)?.textContent;

  if (!activeOptionLabel) {
    return undefined;
  }

  return options.find(
    (option) => !option.disabled && option.label === activeOptionLabel.trim(),
  );
}
