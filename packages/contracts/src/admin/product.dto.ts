export interface AdminProductReferenceDto {
  id: string;
  name: string;
}

export interface AdminProductPriceDto {
  amount: number;
  currency: string;
  merchantName?: string | null;
  updatedAt?: string | null;
}

export interface ProductIdentifierRequestDto {
  family: string;
  value: string;
  primary?: boolean;
}

export interface AdminProductIdentifierDto extends ProductIdentifierRequestDto {
  id?: string | null;
}

export interface AdminProductDto {
  id: string;
  title: string;
  slug: string;
  family: string;
  brand?: AdminProductReferenceDto | null;
  manufacturer?: AdminProductReferenceDto | null;
  mainImageUrl?: string | null;
  shortDescription?: string | null;
  identifiers?: AdminProductIdentifierDto[] | Record<string, string>;
  description?: string | null;
  mediaUrl?: string | null;
  price?: AdminProductPriceDto | null;
  categories?: AdminProductReferenceDto[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductMutationDto {
  title: string;
  slug: string;
  family: string;
  brandId: string;
  manufacturerId: string;
  mainImageUrl?: string | null;
  shortDescription?: string | null;
  identifiers?: ProductIdentifierRequestDto[];
  active: boolean;
}
