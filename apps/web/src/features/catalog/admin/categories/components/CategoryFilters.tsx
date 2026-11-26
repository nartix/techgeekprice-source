"use client";

import { Button, Select, Stack, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";

import type { CategoryListFilters } from "../types/category-admin.types";
import type { CategoryListFilterValidation } from "../category-list-filters";

import styles from "./CategoryFilters.module.css";

interface CategoryFiltersProps {
  disabled?: boolean;
  qVisible?: boolean;
  slugVisible?: boolean;
  activeVisible?: boolean;
  validation?: CategoryListFilterValidation;
  filters: CategoryListFilters;
  onChange: (filters: CategoryListFilters) => void;
}

export function CategoryFilters({
  disabled = false,
  filters,
  qVisible = true,
  slugVisible = true,
  activeVisible = true,
  validation = { valid: true },
  onChange,
}: CategoryFiltersProps) {
  const t = useTranslations("Admin.ProductCategories.filters");
  const hasFilters =
    filters.q.trim().length > 0 ||
    filters.slug.trim().length > 0 ||
    filters.active !== "all";

  return (
    <Stack
      component="section"
      className={styles.panel}
      gap="xs"
      aria-label={t("label")}
    >
      <div className={styles.fields}>
        {qVisible ? (
          <TextInput
            className={styles.search}
            disabled={disabled}
            label={t("qLabel")}
            placeholder={t("qPlaceholder")}
            value={filters.q}
            onChange={(event) =>
              onChange({ ...filters, q: event.currentTarget.value })
            }
          />
        ) : null}
        {slugVisible ? (
          <TextInput
            className="min-w-0 w-full"
            disabled={disabled}
            label={t("slugLabel")}
            placeholder={t("slugPlaceholder")}
            value={filters.slug}
            onChange={(event) =>
              onChange({ ...filters, slug: event.currentTarget.value })
            }
          />
        ) : null}
        {activeVisible ? (
          <Select
            className="min-w-0 w-full"
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
            data={[
              { value: "all", label: t("activeAll") },
              { value: "active", label: t("activeTrue") },
              { value: "inactive", label: t("activeFalse") },
            ]}
            disabled={disabled}
            label={t("activeLabel")}
            value={filters.active}
            onChange={(value) =>
              onChange({
                ...filters,
                active:
                  value === "active" || value === "inactive" ? value : "all",
              })
            }
          />
        ) : null}
        <Button
          className="w-full sm:w-fit"
          disabled={disabled || !hasFilters}
          onClick={() => onChange({ q: "", slug: "", active: "all" })}
          variant="default"
        >
          {t("clear")}
        </Button>
      </div>
      {!validation.valid ? (
        <div aria-live="polite" role="status">
          {validation.reason === "search-too-long"
            ? t("searchTooLong")
            : validation.reason === "too-many-filters"
              ? t("tooManyFilters")
              : t("filterUnavailable")}
        </div>
      ) : null}
    </Stack>
  );
}
