import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { EmployeeDraftObservationService } from '@app/shared/services/employee-draft-observation.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

import { toHTML, Editor, Toolbar, NgxEditorModule } from 'ngx-editor';

export interface WorkflowObservationDialogData {
  executionId: number;
  stepId?: number;
  mode: 'view' | 'input';
  action?: 'Approve' | 'Reject' | 'Rework';
}

@Component({
  selector: 'app-workflow-observation-dialog-component',
  imports: [FormsModule, CommonModule, NgxEditorModule, ReactiveFormsModule, CommonModule],
  templateUrl: './workflow-observation-dialog-component.html',
  styleUrl: './workflow-observation-dialog-component.css',
})
export class WorkflowObservationDialogComponent implements OnInit {
  observations: any[] = [];
  loading = false;
  templateHtml: string = '';
  isViewMode = false;
  isInputMode = false;
  IsReadyOnly = false;

  displayedColumns: string[] = ['employeeName', 'role', 'observation', 'action', 'date'];

  editordoc = 'jsonDoc';
  jsonDoc: string = '';
  editor: Editor = new Editor();
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private _doumentRequestService: DocumentRequestService,
    private _employeeDraftObservationService: EmployeeDraftObservationService,
    private _notificationToastService: NotificationToastService,
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public modalData: any,
  ) {
    this.form = this.fb.group({
      observation: [''],
    });
  }

  ngOnInit(): void {
    this.isViewMode = this.modalData.mode === 'view';
    this.isInputMode = this.modalData.mode === 'input';

    if (this.isViewMode) {
      this.loadObservations();
    }

    if (this.isInputMode) {
      const actionStr = (this.modalData.action || '').toUpperCase();
      const isApprove = actionStr === 'APPROVED' || actionStr === 'APPROVE';
      if (!isApprove) {
        this.form.get('observation')?.setValidators([Validators.required]);
      }
      this.loadDraftObservation();
    }
  }

  loadDraftObservation() {
    const empCode = localStorage.getItem('HRISEmpId') || '';
    if (!empCode) return;

    this._employeeDraftObservationService
      .getEmployeeDraftObservationByEmployeeCode(empCode)
      .subscribe((res) => {
        if (res && res.Data && res.Data.ObservationText) {
          this.form.patchValue({
            observation: res.Data.ObservationText,
          });
        }
      });
  }

  loadObservations() {
    this.loading = true;
    const entityId = this.modalData.id || this.modalData.Id;
    const entityType = this.modalData.entityType;
    const decision = this.modalData.decision;
    this._doumentRequestService.GetWorkflowObservationDetails(entityId, entityType, decision).subscribe({
      next: (response) => {
        if (response && response.Data) {
          this.observations = response.Data.map((item: any) => ({
            Id: item.id || item.Id,
            EntityId: item.EntityId,
            EntityType: item.EntityType,
            StepOrder: item.StepOrder,
            StepType: item.StepType,
            AssignedUserId: item.AssignedUserId,
            EmployeeName: item.EmployeeName,
            EmployeeCode: item.EmployeeCode,
            Division: item.Division,
            Department: item.Department,
            roleName: item.RoleName,
            Designation: item.Designation,
            Decision: item.Decision,
            Observation: item.Observation,
            ActionAt: new CustomDateFormatPipe().transform(item.ActionAt || item.actionAt || ''),
            IsActive: item.isActive || item.IsActive,
          }));
        } else {
          this.observations = [];
        }
      },
      error: (err) => {
        // this._notificationToastService.createNotification(
        //   'error',
        //   'Error',
        //   err?.Message || 'Failed to fetch document details.',
        // );
      },
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.modalRef.close({
      observation: this.form.value.observation,
    });
  }

  saveDraft() {
    const obsText = this.form.value.observation || '';
    if (!obsText) return;

    const payload = {
      ObservationText: obsText,
    };

    this.loading = true;
    this._employeeDraftObservationService.create(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && (res.Success || res.success)) {
          this._notificationToastService.createNotification(
            'success',
            'Draft Observation',
            res.Message || res.message || 'Observation saved successfully as draft.',
          );
        } else {
          this._notificationToastService.createNotification(
            'error',
            'Draft Observation',
            res.Message || res.message || 'Failed to save observation.',
          );
        }
      },
      error: (err: any) => {
        this.loading = false;
        this._notificationToastService.createNotification(
          'error',
          'Draft Observation',
          err.Message || err.message || 'Failed to save observation.',
        );
      },
    });
  }

  close() {
    this.modalRef.close();
  }
}
