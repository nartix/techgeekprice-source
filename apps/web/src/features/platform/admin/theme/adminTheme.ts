import {
  createTheme,
  defaultVariantColorsResolver,
  type VariantColorsResolver,
} from "@mantine/core";

import fieldClasses from "./AdminField.module.css";
import dropdownClasses from "./AdminDropdown.module.css";

const adminVariantColorResolver: VariantColorsResolver = (input) => {
  const colors = defaultVariantColorsResolver(input);
  const isPrimaryAdminColor =
    !input.color || input.color === input.theme.primaryColor;

  if (input.variant === "filled" && isPrimaryAdminColor) {
    return {
      background: "var(--admin-accent)",
      border: "1px solid var(--admin-accent)",
      color: "var(--mantine-color-white)",
      hover: "var(--admin-accent-strong)",
      hoverColor: "var(--mantine-color-white)",
    };
  }

  if (input.variant === "light" && isPrimaryAdminColor) {
    return {
      background: "var(--admin-button-light-bg)",
      border: "1px solid var(--admin-button-light-border)",
      color: "var(--admin-button-light-text)",
      hover: "var(--admin-button-light-hover-bg)",
      hoverColor: "var(--admin-button-light-hover-text)",
    };
  }

  if (input.variant === "light") {
    return {
      ...colors,
      border: `1px solid ${colors.color}`,
      hoverColor: colors.hoverColor ?? colors.color,
    };
  }

  if (input.variant === "subtle" && isPrimaryAdminColor) {
    return {
      background: "var(--admin-button-subtle-bg)",
      border: "1px solid var(--admin-button-subtle-border)",
      color: "var(--admin-button-subtle-text)",
      hover: "var(--admin-button-subtle-hover-bg)",
      hoverColor: "var(--admin-button-subtle-hover-text)",
    };
  }

  if (input.variant === "subtle") {
    return {
      ...colors,
      background: "var(--admin-button-subtle-bg)",
      border: "1px solid var(--admin-button-subtle-border)",
      hoverColor: colors.hoverColor ?? colors.color,
    };
  }

  return colors;
};

export const adminTheme = createTheme({
  primaryColor: "adminBlue",
  primaryShade: { light: 7, dark: 4 },
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  respectReducedMotion: true,
  variantColorResolver: adminVariantColorResolver,
  colors: {
    adminBlue: [
      "#e7f5ff",
      "#d0ebff",
      "#a5d8ff",
      "#74c0fc",
      "#4dabf7",
      "#339af0",
      "#228be6",
      "#1c7ed6",
      "#1971c2",
      "#1864ab",
    ],
    adminNeutral: [
      "#f8fafc",
      "#f3f6fb",
      "#e6edf5",
      "#d8e2ee",
      "#a4afbd",
      "#64748b",
      "#25313d",
      "#121b24",
      "#111922",
      "#080d13",
    ],
  },
  components: {
    Input: {
      classNames: { input: fieldClasses.input },
    },
    ActionIcon: {
      defaultProps: {
        color: "adminBlue",
        radius: "md",
      },
    },
    Button: {
      defaultProps: {
        color: "adminBlue",
        radius: "md",
        variant: "filled",
      },
    },
    Card: {
      defaultProps: {
        radius: "md",
      },
    },
    Pagination: {
      defaultProps: {
        color: "adminBlue",
        radius: "md",
      },
      styles: {
        dots: {
          color: "var(--admin-text-muted)",
        },
      },
    },
    NavLink: {
      defaultProps: {
        color: "adminBlue",
        variant: "subtle",
      },
    },
    Combobox: { classNames: { dropdown: dropdownClasses.dropdown } },
    Menu: { classNames: { dropdown: dropdownClasses.dropdown } },
    Select: {
      classNames: { dropdown: dropdownClasses.dropdown },
      defaultProps: {
        radius: "md",
      },
      styles: {
        input: {
          borderColor: "var(--admin-border)",
          color: "var(--admin-text)",
        },
        dropdown: {
          borderColor:
            "var(--admin-border, var(--mantine-color-default-border))",
        },
      },
    },
    Table: {
      defaultProps: {
        borderColor: "var(--admin-border)",
        highlightOnHoverColor: "var(--admin-table-hover-bg)",
        horizontalSpacing: "md",
        stripedColor: "var(--admin-table-row-bg)",
        verticalSpacing: "md",
      },
      styles: {
        table: {
          backgroundColor: "var(--admin-page-bg)",
          color: "var(--admin-text)",
        },
        th: {
          backgroundColor: "var(--admin-table-header-bg)",
          color: "var(--admin-table-header-text)",
          fontWeight: 700,
        },
        td: {
          color: "var(--admin-text)",
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        input: {
          borderColor: "var(--admin-border)",
          color: "var(--admin-text)",
        },
        label: {
          color: "var(--admin-text)",
        },
        description: {
          color: "var(--admin-text-muted)",
        },
      },
    },
    ThemeIcon: {
      defaultProps: {
        color: "adminBlue",
        radius: "md",
      },
    },
  },
});
