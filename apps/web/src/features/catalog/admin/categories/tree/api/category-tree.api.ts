import type { DataProvider } from "@refinedev/core";
import type { AdminCategoryDto, SpringPageResponseDto } from "@tgp/contracts";

import { INCOMPLETE_TREE_RESPONSE_CODE } from "./category-tree.errors";

export const SMALL_CATEGORY_TREE_URL =
  "/api/v1/admin/category-systems/catalogue/categories/tree";
const DEFAULT_CATEGORY_API_BASE_PATH =
  "/api/v1/admin/category-systems/catalogue/categories";

export class IncompleteSmallCategoryTreeResponseError extends Error {
  code = INCOMPLETE_TREE_RESPONSE_CODE;

  constructor(message = "Incomplete small category tree response.") {
    super(message);
    this.name = "IncompleteSmallCategoryTreeResponseError";
  }
}

interface LoadSmallCategoryTreeArgs {
  apiBasePath?: string;
  dataProvider: Pick<DataProvider, "custom"> | undefined;
  signal?: AbortSignal;
  size?: number;
}

export async function loadSmallCategoryTree({
  apiBasePath,
  dataProvider,
  signal,
  size,
}: LoadSmallCategoryTreeArgs): Promise<
  SpringPageResponseDto<AdminCategoryDto>
> {
  if (!dataProvider?.custom) {
    throw new Error("Admin data provider is unavailable.");
  }

  const response = await dataProvider.custom<
    SpringPageResponseDto<AdminCategoryDto>
  >({
    method: "get",
    query: { page: 0, ...(size === undefined ? {} : { size }) },
    ...(signal === undefined ? {} : { meta: { signal } }),
    url: createSmallCategoryTreeUrl(apiBasePath),
  });

  assertCompleteTreePage(response.data);

  return response.data;
}

function createSmallCategoryTreeUrl(apiBasePath?: string): string {
  const basePath = (apiBasePath ?? DEFAULT_CATEGORY_API_BASE_PATH).replace(
    /\/+$/,
    "",
  );

  return `${basePath}/tree`;
}

export function assertCompleteTreePage(
  response: SpringPageResponseDto<AdminCategoryDto>,
): void {
  const dataLength = response.data.length;
  const page = response.page;
  const hasNextLink = Boolean(response.links?.next);
  const complete =
    page.number === 0 &&
    page.first &&
    page.last &&
    !hasNextLink &&
    page.totalElements === dataLength &&
    page.numberOfElements === dataLength;

  if (!complete) {
    throw new IncompleteSmallCategoryTreeResponseError(
      "Incomplete small category tree response.",
    );
  }
}
