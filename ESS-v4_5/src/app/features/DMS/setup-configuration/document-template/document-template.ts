import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicalReimbursementService } from '@app/features/personnel/medical-reimbursement-service';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select'; 
import { NzIconService } from 'ng-zorro-antd/icon';
import { DownloadOutline } from '@ant-design/icons-angular/icons';
import { BehaviorSubject, catchError, debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form'; 
import { DivisionList } from '@app/shared/Dropdowns/division-list/division-list';
import { SubDepartmentList } from '@app/shared/Dropdowns/sub-department-list/sub-department-list';
import { DepartmentList } from '@app/shared/Dropdowns/department-list/department-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { TemplateService } from '@app/shared/services/template.service';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';

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
    DivisionList,
    SubDepartmentList,
    DepartmentList,
    DocumentTypeList,
    DMSRichTextEdit,
    NzCheckboxModule,
    CabinetStructureList
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
  randomUserUrl = '';
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  loading = false;
  templateName: string = '';
  isDefaultTemplate = false;
  templateHtml: string = '';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';
  selectedTemplateType?: string = '';

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
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private iconService: NzIconService,
    private documentTemplateService: TemplateService,
    private _notification: NotificationService,
  ) {
    this.iconService.addIcon(DownloadOutline);
    this.iconService.addIcon({ ...DownloadOutline, name: 'download-o' });
  }

  ngOnInit(): void {
    this.searchChange$
      .pipe(
        debounceTime(500),
        switchMap((name) => this.getRandomNameList(name)),
      )
      .subscribe((data) => {
        this.optionList = data;
        this.loading = false;
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
  }

  saveTemplate(data: any) {
    debugger;
    console.log(this.templateHtml);

    if (this.selectedDocumentType === undefined || this.selectedDocumentType === '') {
      this._notification.createNotification('warning', 'Document Type', 'Document Type required');
      return;
    }
    if (!this.isDefaultTemplate) {
      if (this.selectedDivisions === undefined || this.selectedDivisions === '') {
        this._notification.createNotification('warning', 'Division', 'Division required');
      } else if (this.selectedDepartment === undefined || this.selectedDepartment === '') {
        this._notification.createNotification('warning', 'Department', 'Department required');
      } else if (this.selectedTemplateType === undefined || this.selectedTemplateType === '') {
        this._notification.createNotification(
          'warning',
          'Templeate Type',
          'Template Type required',
        );
      }
    }

    const payload = {
      id: '', // or generate if needed; usually backend handles this
      documentTypeCode: this.selectedDocumentType,
      templateName: this.templateName,
      templateFileURL: this.randomUserUrl || '', // fallback empty string if no URL
      templateType: this.selectedTemplateType,
      divisionCode: this.selectedDivisions || null,
      departmentCode: this.selectedDepartment || null,
      subDepartmentCode: this.selectedSubDepartment || null,
      isDefault: this.isDefaultTemplate,
      templateContent: this.templateHtml,
      // Plus fields from AuditableEntity if required or optional
    };

    this.documentTemplateService.create(payload).subscribe({
      next: () => alert('Template saved successfully'),
      error: (err) => console.error(err),
    });
  }
}
