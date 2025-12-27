export interface ApiResponse<T> {
  Data: {
    Items: T[];
    TotalCount: number;
  };
  Success: boolean;
  Message: string;
  Code: number;
}
export interface Division {
  Id: number;
  Code: string;
  Name: string;
  IsActive: boolean;
}

export interface OrganizationItem {
  id: string;
  logo?: string;
  organisationName: string | null;
  isActive: string;
  organizationLogo: string;
  organizationType: string;
}

export interface OrderInterface {
  orderID?: number;
  hold?: boolean;
  boxSize?: string;
  noOfBoxes?: number;
}

export interface SelectList {
  CODE: string;
  NAME: string;
}

export class DocumentType {
  CODE: string = '';
  NAME: string = '';
}

export interface SubDepartment {
  code: string;
  Name: string;
}

export interface Department {
  code: string;
  Name: string;
}

export interface Division {
  Code: string;
  Name: string;
}

export interface CabinetStructureTabsConfig {
  Id: number;
  Name: string;
  CreatedBy: string | null;
  CreatedAt: string | null;
  LastModifiedAt: string | null;
  LastModifiedBy: string | null;
}
export interface CabinetStructureTabsConfig2 {
  Id: number;
  name: string;
}
