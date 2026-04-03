import { Component, Inject, Input } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

@Component({
  selector: 'app-rivision-history-popup',
  imports: [AgGridWrapper],
  templateUrl: './rivision-history-popup.html',
  styleUrl: './rivision-history-popup.css',
})
export class RivisionHistoryPopup {
  @Input() data: any; 

  selectedPageSize = 10;
  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;
  selectedRows: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  documentColumnDefs = [
    {
      field: 'employeeCode',
      headerName: 'Employee Code',
      flex: 1,
    },
    {
      field: 'employeeName',
      headerName: 'Employee Name',
      flex: 1,
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
    },
    {
      field: 'designation',
      headerName: 'Designation',
      flex: 1,
    },
  ];

  workflowAuthoritiesData: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _peoplePartnerService: PeoplePartnersService,
    private modalRef: NzModalRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  GetAllDocuments(query: any) {
    this.loadData(query);
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
    this.pageSize = pageSize;
    this.loadData({ pageNumber: 1, pageSize: this.pageSize });
  }

  onSelectionChange(selectedRows: any[]) {
    this.selectedRows = selectedRows;
  }

  loadData(query: any = {}) {
    const roleId = this.modalData?.data;
    if (!roleId) return;

    const sort = query.sortModel?.[0];
    const payload = {
      searchtext: query.searchTerm || query.searchText || '',
      sortby: sort?.sort?.toUpperCase() || '',
      sortcolumn: sort?.colId || '',
      isactive: true,
      pagenumber: Number(query.pageNumber) || 1,
      pagesize: Number(query.pageSize) || this.pageSize
    };

    this._peoplePartnerService.getUserByRoleId(roleId, payload).subscribe((res) => {
      if (res?.Success && res.Data) {
        const data = res.Data;
        const users = Array.isArray(data) ? data : (data.Items || []);
        this.totalRows = data.TotalCount ?? users.length;

        this.workflowAuthoritiesData = users.map((u: any) => ({
          ...u, // Preserves raw backend properties like 'empid' for the parent to use
          employeeCode: u.empcode || u.EmployeeCode || u.employeeCode,
          employeeName: u.firstname ? `${u.firstname} ${u.lastname || ''}`.trim() : (u.EmployeeName || u.employeeName || u.UserName || u.userName),
          department: u.Department || u.department || u.DepartmentName || (u.dptid ? String(u.dptid) : ''),
          designation: u.Designation || u.designation || u.DesignationName || (u.dsgid ? String(u.dsgid) : '')
        }));
      } else {
        this.workflowAuthoritiesData = [];
        this.totalRows = 0;
      }
    });
  }

  approve() {}
  disapprove() {}
  revert() {}

  save() {
    this.modalRef.destroy(this.selectedRows);
  }
}
