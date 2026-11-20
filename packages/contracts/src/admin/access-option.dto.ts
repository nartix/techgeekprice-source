export interface AdminRoleOptionDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface AdminPermissionOptionDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  resource: string;
  action: string;
  active: boolean;
}
