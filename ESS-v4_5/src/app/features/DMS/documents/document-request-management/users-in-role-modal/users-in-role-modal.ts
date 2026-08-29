import { Component, Inject, Input } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

@Component({
  selector: 'app-users-in-role-modal',
  imports: [AgGridWrapper],
  templateUrl: './users-in-role-modal.html',
  styleUrl: './users-in-role-modal.css',
})
export class UsersInRoleModal {
  @Input() data: any;
  
  selectedPageSize = 10;
  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;
  selectedRows: any[] = [];
  private gridApi: any;

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
    // {
    //   field: 'department',
    //   headerName: 'Department',
    //   flex: 1,
    // },
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
    private modalRef: NzModalRef,
  ) {}

  ngOnInit() {
    // Removed this.loadData(); to prevent double API call. AgGridWrapper triggers GetAllDocuments() automatically on init.
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

  onGridReady(event: any): void {
    this.gridApi = event.api;
  }

  // Checks off everyone already selected for this Role/Cabinet row (see
  // DRUsersComponent.openCabinetModal's preSelectedEmployeeCodes) so the user can see who's
  // already in the distribution instead of starting from a blank grid every time. Runs after
  // every loadData() (initial load, search, sort, page change) so it stays accurate as the
  // grid's rows change.
  private preselectRows(): void {
    const codes: string[] = this.modalData?.preSelectedEmployeeCodes || [];
    if (!codes.length || !this.gridApi) return;

    setTimeout(() => {
      this.gridApi.forEachNode((node: any) => {
        if (node.data?.employeeCode && codes.includes(node.data.employeeCode)) {
          node.setSelected(true);
        }
      });
    }, 50);
  }

  loadData(query: any = {}) {
    const roleId = this.modalData?.data;
    if (!roleId) return; 
    const sort = query.sortModel?.[0];
    const payload = {
      searchtext: query.searchTerm || query.searchText || '',
      sortby: sort?.sort?.toUpperCase() || 'ASC',
      sortcolumn: sort?.colId || 'empid', // Fallback to ensure query works smoothly
      isactive: true,
      pagenumber: Number(query.pageNumber) || 1,
      pagesize: Number(query.pageSize) || this.pageSize,
      divisionCode: this.modalData?.divisionCode || null,
      departmentCode: this.modalData?.departmentCode || null,
      subDepartmentCode: this.modalData?.subDepartmentCode || null,
      businessDomainCode: this.modalData?.businessDomainCode || null,
      documentTypeCode: this.modalData?.documentTypeCode || null,
    };

    this._peoplePartnerService.getUserByRoleId(roleId, payload).subscribe((res) => {
      if (res?.Success && res.Data) {
        const data = res.Data;
        const users = (Array.isArray(data) ? data : data.Items || []).filter((u: any) => u != null);
        
        if (users.length > 0) {
          this.totalRows = data.TotalCount ?? users.length;
          this.workflowAuthoritiesData = users.map((u: any) => ({
            ...u, // Preserves raw backend properties like 'empid' for the parent to use
            employeeCode: u.empcode || u.EmployeeCode || u.employeeCode,
            employeeName: u.firstname
              ? `${u.firstname} ${u.midname || ''} ${u.lastname || ''}`.trim().replace(/\s+/g, ' ')
              : u.EmployeeName || u.employeeName || u.UserName || u.userName,
            department:
              u.Department || u.department || u.DepartmentName || (u.dptid ? String(u.dptid) : ''),
            designation:
              u.Designation || u.designation || u.DesignationName || (u.dsgid ? String(u.dsgid) : ''),
          }));
          this.preselectRows();
        } else {
          this.workflowAuthoritiesData = [];
          this.totalRows = 0;
        }
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
