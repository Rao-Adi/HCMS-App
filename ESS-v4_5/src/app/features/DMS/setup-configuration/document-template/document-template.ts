import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicalReimbursementService } from '@app/features/personnel/medical-reimbursement-service';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconService } from 'ng-zorro-antd/icon';
import { DownloadOutline } from '@ant-design/icons-angular/icons';
import { BehaviorSubject, catchError, debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { TemplateService } from '@app/shared/services/template.service'; 
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { CabinetSelection } from '@app/shared/interfaces/interfaces';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';

const icons = [DownloadOutline, { ...DownloadOutline, name: 'download-o' }];

interface MockUser {
  name: {
    first: string;
  };
}

@Component({
  selector: 'app-document-template',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    SafeTranslatePipe,
    NzDatePickerModule,
    NzSelectModule,
    NzButtonModule,
    DocumentTypeList,
    DMSRichTextEdit,
    NzCheckboxModule,
    CabinetStructureList,
  ],
  providers: [
    MedicalReimbursementService,
    DatePipe,
    DecimalPipe,
    { provide: NZ_ICONS, useValue: icons },
  ],
  templateUrl: './document-template.html',
  styleUrl: './document-template.css',
})
export class DocumentTemplate {
  @ViewChild(CabinetStructureList)
  cabinetStructure!: CabinetStructureList;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'templates';

  randomUserUrl = '';
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  loading = false;
  templateName: string = '';
  isDefaultTemplate = false;
  templateHtml: string = '';

  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedbusinessDomain: string = '';
  selectedDocumentType: string = '';
  selectedTemplateType: string = '';
  selectedFile: File | null = null;
  existingFileName: string = '';

  templateTypes: any[] = [
    {
      id: '1',
      text: 'PDF',
    },
    {
      id: '2',
      text: 'Word Document',
    },
    {
      id: '3',
      text: 'HTML',
    },
  ];

  constructor(
    private http: HttpClient,
    private iconService: NzIconService,
    private documentTemplateService: TemplateService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
  ) {
    this.iconService.addIcon(DownloadOutline);
    this.iconService.addIcon({ ...DownloadOutline, name: 'download-o' });
  }

  ngOnInit(): void {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.searchChange$
        .pipe(
          debounceTime(500),
          switchMap((name) => this.getRandomNameList(name)),
        )
        .subscribe((data) => {
          this.optionList = data;
          this.loading = false;
        });
    });
  }

  onfiscalYearchange() {}

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  getRandomNameList(name: string): Observable<string[]> {
    return this.http.get<{ results: MockUser[] }>(`${this.randomUserUrl}`).pipe(
      map((res) => res.results),
      catchError(() => of<MockUser[]>([])),
      map((list) => list.map((item) => `${item.name.first} ${name}`)),
    );
  }

  onDivisionChange(value: string): void {
    this.selectedDivisions = value;
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
  }
  onDepartmentsChange(value: string): void {
    this.selectedDepartment = value;
    this.selectedSubDepartment = '';
  }

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;

    if (!value) {
      this.resetTemplateDetails();
      return;
    }

    this.documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response) => {
        if (response?.Data) {
          const data = response.Data;
          this.templateHtml = data.TemplateContent || '';
          this.selectedTemplateType = data.TemplateType ? String(data.TemplateType) : '';
          this.isDefaultTemplate =
            data.IsDefault === true || String(data.IsDefault).toLowerCase() === 'true';
          this.existingFileName = data.TemplateFileUrl || data.templateFileUrl || '';
          this.selectedDivisions = data.DivisionCode || '';
          this.selectedDepartment = data.DepartmentCode || '';
          this.selectedSubDepartment = data.SubDepartmentCode || '';
          this.selectedbusinessDomain = data.BusinessDomainCode || '';
        } else {
          this.resetTemplateDetails(false);
        }
      },
      error: (err) => {
        console.error(err);
        this.resetTemplateDetails(false);
      },
    });
  }

  private resetTemplateDetails(clearDocType: boolean = true) {
    if (clearDocType) this.selectedDocumentType = '';
    this.templateHtml = '';
    this.selectedTemplateType = '';
    this.isDefaultTemplate = false;
    this.existingFileName = '';
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedbusinessDomain = '';
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
    } else {
      this.selectedFile = null;
    }
  }

  saveTemplate(data: any) {
    if (this.selectedDocumentType === undefined || this.selectedDocumentType === '') {
      this._notificationToastService.createNotification('warning', 'Document Type', 'Document Type required');
      return;
    }

    if (this.selectedTemplateType === undefined || this.selectedTemplateType === '') {
      this._notificationToastService.createNotification('warning', 'Template Type', 'Template Type required');
      return;
    }

    if (!this.isDefaultTemplate) {
      if (this.selectedDepartment === undefined || this.selectedDepartment === '') {
        this._notificationToastService.createNotification('warning', 'Department', 'Department required');
        return;
      }
    }

    if (
      (this.selectedTemplateType === '1' || this.selectedTemplateType === '2') &&
      !this.selectedFile
    ) {
      this._notificationToastService.createNotification(
        'warning',
        'File Required',
        'Please choose a file to upload',
      );
      return;
    }

    const formData = new FormData();
    formData.append('DocumentTypeCode', this.selectedDocumentType);
    formData.append('TemplateName', this.templateName || 'Template');
    formData.append('TemplateFileUrl', this.selectedFile ? this.selectedFile.name : '');
    formData.append('TemplateType', this.selectedTemplateType);
    formData.append('IsDefault', String(this.isDefaultTemplate));

    if (this.selectedDivisions) formData.append('DivisionCode', this.selectedDivisions);
    if (this.selectedDepartment) formData.append('DepartmentCode', this.selectedDepartment);
    if (this.selectedSubDepartment)
      formData.append('SubDepartmentCode', this.selectedSubDepartment);
    if (this.selectedbusinessDomain)
      formData.append('BusinessDomainCode', this.selectedbusinessDomain);
    if (this.templateHtml) formData.append('TemplateContent', this.templateHtml);

    if (this.selectedFile) {
      formData.append('TemplateFile', this.selectedFile);
    }

    this.documentTemplateService.create(formData).subscribe({
      next: () => {
        this._notificationToastService.createNotification(
          'success',
          'Document Template',
          'Document Template created successfully!',
        );

        this.cabinetStructure.resetHierarchy();
      },
      error: (err) => {
        console.error('Document Template failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notificationToastService.createNotification('error', 'Document Template', message);
      },
    });
  }

  downloadTemplateFile(): void {
    if (!this.selectedDocumentType) {
      this._notificationToastService.createNotification('warning', 'Document Type', 'Please select a Document Type first');
      return;
    }

    if (this.selectedFile) {
      const url = window.URL.createObjectURL(this.selectedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.selectedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    if (!this.existingFileName) {
      this._notificationToastService.createNotification('warning', 'Template', 'No template file exists to download');
      return;
    }

    this.documentTemplateService.DownloadTemplateByDocumentTypeCode(this.selectedDocumentType).subscribe({
      next: (response: any) => {
        const blob = response.body;
        if (!blob) {
          this._notificationToastService.createNotification('error', 'Download', 'Failed to download template: Empty response');
          return;
        }

        let filename = this.existingFileName;
        const contentDisposition = response.headers?.get('content-disposition') || response.headers?.get('Content-Disposition');
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading template:', err);
        this._notificationToastService.createNotification('error', 'Download', 'Failed to download template from server');
      }
    });
  }

  viewTemplateFile(): void {
    if (!this.selectedDocumentType) {
      this._notificationToastService.createNotification('warning', 'Document Type', 'Please select a Document Type first');
      return;
    }

    if (this.selectedFile) {
      const url = window.URL.createObjectURL(this.selectedFile);
      window.open(url, '_blank');
      return;
    }

    if (!this.existingFileName) {
      this._notificationToastService.createNotification('warning', 'Template', 'No template file exists to view');
      return;
    }

    this.documentTemplateService.DownloadTemplateByDocumentTypeCode(this.selectedDocumentType).subscribe({
      next: (response: any) => {
        const blob = response.body;
        if (!blob) {
          this._notificationToastService.createNotification('error', 'View Template', 'Failed to view template: Empty response');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Error loading template file:', err);
        this._notificationToastService.createNotification('error', 'View Template', 'Failed to retrieve template file from server');
      }
    });
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedbusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }
}
