import { Component, Inject } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit'; 
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-observation-modal-popup',
  imports: [DMSRichTextEdit, SafeTranslatePipe, AgGridWrapper],
  templateUrl: './observation-modal-popup.html',
  styleUrl: './observation-modal-popup.css',
})
export class ObservationModalPopup {
  templateHtml: string = '';

  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;
  selectedPageSize = 1; // default value
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  documentColumnDefs = [
    {
      field: 'employeeName',
      headerName: 'Employee Name'
    },
    {
      field: 'employeeRole',
      headerName: 'Employee Role'
    },
    {
      field: 'department',
      headerName: 'Department'
    },
    {
      field: 'division',
      headerName: 'Division'
    },
    {
      field: 'observation',
      headerName: 'Observation'
    },
    {
      field: 'lastActionPerformed',
      headerName: 'Last Action Performed'
    },
    {
      field: 'lastActionPerformedOn',
      headerName: 'Last Action Performed On',
      cellStyle: { color: '#6c757d' },
      headerClass: 'text-muted'
    },
  ];

  observationData: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _doumentRequestService: DocumentRequestService,
    private _notificationToastService: NotificationToastService,
  ) {}

  ngOnInit() { 
    // console.log('Received modal data:', this.modalData);
    // this.templateHtml = this.modalData?.templateHtml || '';
    this.GetAllPendingDocuments('');
  }

  GetAllDocuments(query: any) {}

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  GetAllPendingDocuments(query: any) { 
    const payload = {
      requestId: this.modalData.data,
    };
    this._doumentRequestService
      .GetWorkflowObservationDetails(payload.requestId,'')
      .subscribe({
        next: (response) => { 
          if (response  && response.Data) {
            const data = response.Data;
            
            // // If you need to display the main document request
            // this.documentRequest = {
            //   id: data.Id,
            //   requestNumber: data.RequestNumber,
            //   documentName: data.DocumentName,
            //   justification: data.Justification,
            //   proposedContent: data.ProposedContent,
            //   submittedAt: data.SubmittedAt,
            //   submittedBy: data.SubmittedBy,
            //   status: data.Status,
            //   workflowStatus: data.WorkflowStatus,
            //   workflowStartedAt: data.WorkflowStartedAt,
            //   workflowCompletedAt: data.WorkflowCompletedAt
            // };
            
            // Parse the steps into observationData
            if (data.Steps && data.Steps.length > 0) {
              this.observationData = data.Steps.map((step: any) => ({
                Id: step.StepOrder, // or use a unique identifier if available
                requestId: data.Id,
                documentType: step.StepType,
                proposedDocumentNumber: data.RequestNumber,
                stepId: step.StepOrder,
                stepOrder: step.StepOrder,
                startedAt: step.ActionAt,
                division: data.Division, // Not available in steps
                documentId: '', // Not available in steps
                documentName: data.DocumentName,
                proposedContent: data.ProposedContent,
                employeeName: step.UserName,
                department: data.Department,
                departmentId: data.DepartmentCode, // Not available in steps
                subdepartment: data.SubDepartment, // Not available in steps
                justification: data.Justification,
                businessdomainId: '', // Not available in steps
                requestCreatedBy: data.SubmittedBy,
                lastActionPerformedOn: new CustomDateFormatPipe().transform(step.ActionAt),
                lastActionPerformed: step.Decision,
                previousVersionCreatedOn: data.WorkflowStartedAt,
                proposedVersionNumber: data.Status,
                
                // Step-specific fields
                decision: step.Decision,
                observation: step.Observation,
                actionAt: step.ActionAt,
                isActive: step.IsActive,
                assignedUserId: step.AssignedUserId
              }));
            } else {
              this.observationData = [];
            }
            
            // Set total rows based on steps count
            this.totalRows = this.observationData.length;
            
          } else {
            this.observationData = [];
            this.totalRows = 0;
          }
        },
        error: (err) => {
          this._notificationToastService.createNotification(
            'error',
            'Error',
            err?.Message || 'Failed to fetch document details.',
          );
        },
      });
  }
}
