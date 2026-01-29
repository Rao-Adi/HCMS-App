// export interface ApiResponse<T> {
//   Data: {
//     Items: T[];
//     TotalCount: number;
//   };
//   Success: boolean;
//   Message: string;
//   Code: number;
// }

export interface ColumnToggle {
  field: string;
  label: string;
  visible: boolean;
}

export interface ApiResponse<T> {
  Success: boolean;
  Code: number;
  Message: string;
  Data: T;
}

export interface CabinetTabVM {
  level: number;
  title: string;
  createdBy: string | null;
  createdAt: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
}

export interface CabinetLevel {
  level: number;
  title: string;
  createdBy: string | null;
  createdAt: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
}


export interface Division {
  Id: number;
  Code: string;
  Name: string;
  CreatedBy: string;
  CreatedAt: string;
  LastModifiedBy: string;
  LastModifiedAt: string;
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

export interface SelectList2 {
  ID: string;
  NAME: string;
}

export class DocumentType {
  Id: number = 0;
  Code: string = '';
  Name: string = '';
  CreatedBy: string = '';
  CreatedAt: any = '';
  LastModifiedBy: string = '';
  LastModifiedAt: any = '';
}

export interface SubDepartment {
  Id: number;
  Code: string;
  Name: string;
  CreatedBy: string;
  CreatedAt: any;
  LastModifiedBy: string;
  LastModifiedAt: any;
}

export interface Department {
  Id: number;
  Code: string;
  Name: string;
  Division: string;
  DivisionCode: string;
  CreatedBy: string;
  CreatedAt: any;
  LastModifiedBy: string;
  LastModifiedAt: any;
}

export interface AuditableEntity {
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
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

export interface AttributeMandatoryScope {
  id: string;
  documentAttributeId: string;
  divisionCode: string;
  departmentCode: string;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  documentAttribute: DocumentAttribute;
  division: Division;
  department: Department;
}

export interface Designation extends AuditableEntity {
  Id: number;
  Code: string;
  Name: string;
}

export interface AuditLog extends AuditableEntity {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
  iPAddress: string | null;
}

export interface DistributionList extends AuditableEntity {
  id: string;
  documentRequestId: string;
  divisionCode: string;
  departmentCode: string;
  roleId: number;
  distributionType: number;
  documentRequest: DocumentRequest;
  division: Division;
  department: Department;
  role: Role;
}

export interface Division {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  departments: Department[];
}

export interface Document extends AuditableEntity {
  id: string;
  documentNumber: string;
  documentTypeCode: string;
  divisionCode: string;
  departmentCode: string;
  subDepartmentCode: string;
  documentName: string;
  status: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  nextReviewDate: string | null;
  versions: DocumentVersion[];
}

export interface DocumentApproval extends AuditableEntity {
  id: string;
  documentVersionId: string;
  workflowStepId: string;
  approverUserId: string;
  status: number;
  observation: string;
  actionDate: string | null;
}

export interface DocumentAttribute extends AuditableEntity {
  id: string;
  documentTypeCode: string;
  controlLabel: string;
  controlType: number;
  listValues: string | null;
  isMandatory: boolean;
  documentType: DocumentType;
  mandatoryScopes: AttributeMandatoryScope[];
}

export interface DocumentRequest extends AuditableEntity {
  id: string;
  requestNumber: string;
  requestType: number;
  documentId: string | null;
  documentTypeCode: string;
  divisionCode: string;
  departmentCode: string;
  subDepartmentCode: string;
  documentName: string;
  justification: string;
  status: number;
  currentStep: number;
  document: Document | null;
  approvals: RequestApproval[];
}

export interface DocumentTraining extends AuditableEntity {
  id: string;
  documentId: string;
  trainingMode: number;
  trainingStatus: number;
  trainingProofURL: string | null;
  assessmentScore: number | null;
  validationStatus: number;
  readyForAuthorization: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  versionType: number;
  content: string;
  changeDescription: string | null;
  status: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  document: Document;
}

export interface ESignature extends AuditableEntity {
  id: string;
  userId: string;
  signatureData: string;
  signatureType: number;
  fileType: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: number;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface RequestApproval extends AuditableEntity {
  id: string;
  documentRequestId: string;
  workflowStepId: string;
  approverUserId: string;
  status: number;
  observation: string;
  actionDate: string | null;
  documentRequest: DocumentRequest;
}

export interface ResponsibilityTransfer extends AuditableEntity {
  id: string;
  employeeFromId: string;
  employeeToId: string;
  reason: number;
  effectiveDateFrom: string;
  effectiveDateTo: string | null;
  isPermanent: boolean;
  remarks: string;
  status: number;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface Role extends AuditableEntity {
  id: number;
  name: string;
  description: string;
  userRoles: UserRole[];
}

export interface Company extends AuditableEntity {
  id: number;
  name: string; 
}


export interface DistributionType extends AuditableEntity {
  id: number;
  name: string; 
}


export interface Template extends AuditableEntity {
  id: string;
  documentTypeCode: string;
  templateName: string;
  templateFileURL: string;
  templateType: number;
  divisionCode: string | null;
  departmentCode: string | null;
  subDepartmentCode: string | null;
  isDefault: boolean;
}

export interface TemplateCreateDto {
  id: string;
  documentTypeCode: string;
  templateName: string;
  templateFileURL: string;
  templateType: number;
  divisionCode: string | null;
  departmentCode: string | null;
  subDepartmentCode: string | null;
  isDefault: boolean;
}
export interface TrainingPolicy extends AuditableEntity {
  id: string;
  documentTypeId: number;
  trainingRequired: boolean;
  minimumScore: number | null;
}

export interface TransferScopePolicy extends AuditableEntity {
  id: number;
  divisionCode: string;
  reportingToLevel: number;
  divisions: Division[];
}

export interface TransferWorkflowPolicy extends AuditableEntity {
  id: number;
  divisionCode: string;
  approvalRoleId: number;
  approvalUserId: string;
}

export interface User extends AuditableEntity {
  id: string;
  employeeCode: string;
  userName: string;
  email: string;
  divisionCode: string | null;
  departmentCode: string | null;
  subDepartmentCode: string | null;
  userRoles: UserRole[];
}

export interface UserRole extends AuditableEntity {
  userId: string;
  roleId: number;
  assignedAt: string;
  assignedBy: string;
  user: User;
  role: Role;
}

export interface WorkflowPolicy extends AuditableEntity {
  id: string;
  policyType: number;
  divisionCode: string | null;
  departmentCode: string | null;
  subDepartmentCode: string | null;
  documentTypeCode: string | null;
  sharingType: number | null;
  steps: WorkflowStep[];
}

export interface WorkflowStep extends AuditableEntity {
  id: string;
  workflowPolicyId: string;
  sequence: number;
  approverRoleId: number | null;
  approverUserId: string | null;
  approvalLevel: number | null;
  workflowPolicy: WorkflowPolicy;
}
