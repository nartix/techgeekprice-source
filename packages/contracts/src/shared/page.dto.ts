import type { components } from "../generated/spring";

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type SpringPageMetadataDto = Required<
  Pick<
    components["schemas"]["PageMetadata"],
    | "number"
    | "size"
    | "totalElements"
    | "totalPages"
    | "numberOfElements"
    | "first"
    | "last"
  >
>;

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type SpringSortDto = Omit<
  Required<
    Pick<components["schemas"]["SortResponse"], "property" | "direction">
  >,
  "direction"
> & {
  direction: "asc" | "desc" | "ASC" | "DESC";
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type SpringPageLinksDto = Omit<
  Required<
    Pick<components["schemas"]["PageLinks"], "self" | "next" | "previous">
  >,
  "self" | "next" | "previous"
> & {
  self?: NonNullable<components["schemas"]["PageLinks"]["self"]> | null;
  next?: NonNullable<components["schemas"]["PageLinks"]["next"]> | null;
  previous?: NonNullable<components["schemas"]["PageLinks"]["previous"]> | null;
};

export interface SpringPageResponseDto<TItem> {
  data: TItem[];
  page: SpringPageMetadataDto;
  sort: SpringSortDto[];
  links?: SpringPageLinksDto;
}
