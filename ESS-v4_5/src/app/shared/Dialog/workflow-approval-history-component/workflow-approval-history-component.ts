import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'; 
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-workflow-approval-history-component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './workflow-approval-history-component.html',
  styleUrl: './workflow-approval-history-component.css',
})
export class WorkflowApprovalHistoryComponent {
  @Input() entityId!: number;
  @Input() entityType!: 'Document' | 'Request';

  workflowHistory: any[] = [];
  loading = false;

  constructor( 
    private _doumentRequestService: DocumentRequestService,
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public modalData: any,
  ) {}

  ngOnInit(): void { 
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    const entityId = this.modalData.id;
    const entityType = this.modalData.entityType;
    this._doumentRequestService.getWorkflowDeatils(entityId, entityType).subscribe({
      next: (response) => {
        if (response && response.Data) { 
          this.workflowHistory = response.Data.map((item: any) => ({
            Id: item.id || item.Id,
            EntityId: item.EntityId ,
            EntityType: item.EntityType,
            StepOrder: item.StepOrder,
            StepType: item.StepType,
            AssignedUserId: item.AssignedUserId,
            EmployeeName: item.EmployeeName,
            EmployeeCode: item.EmployeeCode,
            Decision: item.Decision,
            Observation: item.Observation, 
            ReceivedOn: new CustomDateFormatPipe().transform(
              item.ReceivedOn || item.ReceivedOn || '',
            ),
            StatusUpdatedOn: new CustomDateFormatPipe().transform(
              item.StatusUpdatedOn || item.StatusUpdatedOn || '',
            ),
            IsActive: item.isActive || item.IsActive
          }));
        } else {
          this.workflowHistory = [];
        }
      },
      error: (err) => {
        // this._notification.createNotification(
        //   'error',
        //   'Error',
        //   err?.Message || 'Failed to fetch document details.',
        // );
      },
    });
  }

  close() {
    this.modalRef.close();
  }
}
