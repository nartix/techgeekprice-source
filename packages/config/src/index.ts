export const repositoryConfigPackages = {
  eslint: "@tgp/eslint-config",
  typescript: "@tgp/typescript-config",
} as const;

export type RepositoryConfigProvider = keyof typeof repositoryConfigPackages;

export type RepositoryConfigPackageName =
  (typeof repositoryConfigPackages)[RepositoryConfigProvider];
