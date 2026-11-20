import type { components } from "../generated/spring";

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type ApiFieldErrorDto = Required<
  Pick<components["schemas"]["ApiFieldError"], "field" | "message">
>;

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type ApiErrorResponseDto = Omit<
  Required<
    Pick<
      components["schemas"]["ApiErrorResponse"],
      "code" | "message" | "path" | "timestamp" | "fieldErrors"
    >
  >,
  "fieldErrors"
> & {
  fieldErrors: ApiFieldErrorDto[];
};

/**
 * @deprecated Spring admin errors are flat `ApiErrorResponseDto` payloads.
 */
export type ApiErrorFieldDto = ApiFieldErrorDto;

/**
 * @deprecated Spring admin errors are flat `ApiErrorResponseDto` payloads.
 */
export interface ApiErrorPayloadDto {
  code: string;
  message: string;
  fields?: ApiErrorFieldDto[];
}
