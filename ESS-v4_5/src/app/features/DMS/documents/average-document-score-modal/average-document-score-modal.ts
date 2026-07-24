import { Component, Inject } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { DocumentTrainingService } from '@app/shared/services/document-training.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';

@Component({
  selector: 'app-average-document-score-modal',
  imports: [AgGridWrapper],
  templateUrl: './average-document-score-modal.html',
  styleUrl: './average-document-score-modal.css',
})
export class AverageDocumentScoreModal {
  
  averateDocumentScoreData: any[] = [];
  pageSize = 10;
  selectedPageSize = 10;
  totalRows = 0;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  employeeScoreColumnDefs: ColDef[] = [
    { field: 'userName', headerName: 'User Name' },
    { field: 'role', headerName: 'Role' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'department', headerName: 'Department' },
    { field: 'division', headerName: 'Division' },
    { field: 'noOfAttempts', headerName: 'No. of Attempts' },
    { field: 'score', headerName: 'Score (%)' },
    { field: 'status', headerName: 'Status' },
  ];

  constructor(
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _documentTrainingService: DocumentTrainingService,
    private _notificationToastService: NotificationToastService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() { 
    const docId = this.modalData?.data?.documentId || this.modalData?.data?.Id || this.modalData?.data?.id;
    if (!docId) return;

    const trainingMode = this.modalData?.trainingMode || '1';

    this._documentTrainingService.GetTrainingAssessmentDetails(docId,trainingMode).subscribe({
      next: (res) => {
        if (res?.Success) {
          const users = res.Data?.UserScores || res.Data?.Users || (Array.isArray(res.Data) ? res.Data : []);
          this.averateDocumentScoreData = users.map((u: any) => ({
            userName: u.EmployeeName || u.Name || u.name || u.UserName || u.userName,
            role: u.RoleName || u.Designation || u.Role || u.role || 'N/A',
            subDepartment: u.SubDepartment || u.subDepartment || 'N/A',
            department: u.Department || u.department || 'N/A',
            division: u.Division || u.division || 'N/A',
            noOfAttempts: u.NoOfAttempts || u.noOfAttempts || u.Attempts || u.attempts || 1,
            score: u.AssessmentScore ?? u.Score ?? u.score ?? 0,
            status: u.TrainingStatus === 1 ? 'Completed' : (u.TrainingStatus === 0 ? 'Pending' : (u.Status || u.status || 'Completed')),
          }));
          this.totalRows = this.averateDocumentScoreData.length;
        } else {
          this._notificationToastService.createNotification('error', 'Error', res?.Message || 'Failed to load assessment details.');
        }
      },
      error: (err) => {
        this._notificationToastService.createNotification('error', 'Error', 'Failed to load assessment details.');
      }
    });
  }
}
