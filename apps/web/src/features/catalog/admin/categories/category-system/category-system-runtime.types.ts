import type {
  AdminCategoryCapabilityState,
  CategoryCapabilityIdentity,
  CategorySystemDefinition,
} from "./category-system.types";

export interface CategorySystemRuntime {
  readonly definition: CategorySystemDefinition<string>;
  readonly identity: CategoryCapabilityIdentity;
  readonly permissions: ReadonlySet<string>;
  readonly capabilityState: AdminCategoryCapabilityState;
  readonly effectiveLimits: Readonly<{
    parentOptionPageSize: number | undefined;
    treeSize: number | undefined;
  }>;
  /** Starts a replacement query for the current identity only. */
  refresh(): void;
}
