import { Component, Inject } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

// Case of incoming JSON keys is inconsistent across this app depending on whether a controller
// returns a strongly-typed DTO or a raw Dapper dynamic row (PascalCase vs all-lowercase), so
// every read here checks both.
function pick(source: any, keys: string[], fallback: any = ''): any {
  if (!source) return fallback;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
    const lower = key.toLowerCase();
    if (source[lower] !== undefined && source[lower] !== null && source[lower] !== '') {
      return source[lower];
    }
  }
  return fallback;
}

@Component({
  selector: 'app-revision-history-modal',
  imports: [AgGridWrapper],
  templateUrl: './revision-history-modal.html',
  styleUrl: './revision-history-modal.css',
})
export class RevisionHistoryModal {
  revisionHistoryData: any[] = [];
  pageSize = 10;
  selectedPageSize = 10;
  totalRows = 0;
  loading = false;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  revisionHistoryColumnDefs: ColDef[] = [
    { field: 'documentNumber', headerName: 'Document Number'},
    { field: 'version', headerName: 'Version', minWidth: 80 },
    { field: 'status', headerName: 'Status'  },
    {
      field: 'isCurrentVersion',
      headerName: 'Current Version', 
      cellRenderer: (p: any) => (p.value ? 'Yes' : ''),
    },
    {
      field: 'requestedBy',
      headerName: 'Requested By', 
      cellClass: 'audit-cell',
    },
    {
      field: 'requestedOn',
      headerName: 'Requested On', 
      cellClass: 'audit-cell',
    },
    {
      field: 'approvedBy',
      headerName: 'Approved By', 
      cellClass: 'audit-cell',
    },
    {
      field: 'approvedOn',
      headerName: 'Approved On', 
      cellClass: 'audit-cell',
    },
    {
      field: 'effectiveBy',
      headerName: 'Effective By', 
      cellClass: 'audit-cell',
    },
    {
      field: 'effectiveOn',
      headerName: 'Effective On', 
      cellClass: 'audit-cell',
    },
  ];

  private documentId: number | null = null;

  constructor(
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _documentRequestService: DocumentRequestService,
  ) {
    const source = this.modalData?.data;
    const rawId = pick(source, ['documentId', 'DocumentId', 'Id', 'id', 'documentid'], null);
    const parsedId = Number(rawId);
    this.documentId = rawId != null && !isNaN(parsedId) ? parsedId : null;
  }

  ngOnInit() {
    this.loadData({ pageNumber: 1 });
  }

  GetAllDocuments(query: any) {
    this.loadData(query);
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.pageSize = event.pageSize;
    }
    this.loadData({ pageNumber: 1, pageSize: this.pageSize });
  }

  loadData(query: any = {}) {
    if (!this.documentId) {
      this.revisionHistoryData = [];
      this.totalRows = 0;
      return;
    }

    const pageNumber = Number(query.pageNumber) || 1;
    const pageSize = Number(query.pageSize) || this.pageSize;
    const dateFmt = new CustomDateFormatPipe();

    this.loading = true;
    this._documentRequestService.GetDocumentRevisionHistory(this.documentId).subscribe({
      next: (res: any) => {
        this.loading = false;
        const items = res?.Data || res?.data || [];

        const mapped = items.map((item: any) => ({
          documentId: pick(item, ['DocumentId', 'documentId']),
          documentNumber: pick(item, ['DocumentNumber', 'documentNumber']),
          version: pick(item, ['Version', 'version']),
          status: pick(item, ['CurrentStatus', 'currentStatus']),
          requestedBy: pick(item, ['RequestedBy', 'requestedBy']),
          requestedOn: dateFmt.transform(pick(item, ['RequestedOn', 'requestedOn'], null)) || '',
          approvedBy: pick(item, ['ApprovedBy', 'approvedBy']),
          approvedOn: dateFmt.transform(pick(item, ['ApprovedOn', 'approvedOn'], null)) || '',
          effectiveBy: pick(item, ['EffectiveBy', 'effectiveBy']),
          effectiveOn: dateFmt.transform(pick(item, ['EffectiveOn', 'effectiveOn'], null)) || '',
          isCurrentVersion: !!pick(item, ['IsCurrentVersion', 'isCurrentVersion'], false),
        }));

        // Chain is small and returned in full by the API; paginate client-side to match the grid wrapper's contract.
        const start = (pageNumber - 1) * pageSize;
        this.revisionHistoryData = mapped.slice(start, start + pageSize);
        this.totalRows = mapped.length;
      },
      error: () => {
        this.loading = false;
        this.revisionHistoryData = [];
        this.totalRows = 0;
      },
    });
  }
}
