import { act, renderHook, waitFor } from "../../../../../../../tests/test-utils/render";
import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import type { AdminFormField } from "../../types/admin-form.types";
import { useAdminFormDependencies } from "../useAdminFormDependencies";

interface TestValues {
  categoryId: string;
  name: string;
}

describe("useAdminFormDependencies", () => {
  it("updates when declared dependencies change", async () => {
    const field: AdminFormField<TestValues> = {
      dependsOn: ["categoryId"],
      label: "Name",
      name: "name",
      type: "text",
    };
    const { result } = renderHook(() => {
      const form = useForm<TestValues>({
        defaultValues: { categoryId: "cat_1", name: "" },
      });

      return {
        form,
        values: useAdminFormDependencies(form, field),
      };
    });

    act(() => {
      result.current.form.setValue("categoryId", "cat_2");
    });

    await waitFor(() =>
      expect(result.current.values.categoryId).toBe("cat_2"),
    );
  });
});
