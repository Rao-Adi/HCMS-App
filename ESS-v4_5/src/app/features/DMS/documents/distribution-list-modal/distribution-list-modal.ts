import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

// Obsoletion distribution retrieval tracking (client requirement, Ayesha Naz): shows the
// Distribution List a document's request carried, including each entry's retrieval status, so
// the approver can verify retrieval was actually done (not just asserted) before approving.
// Creation/Revision carry the same Distribution List (who the document goes out to once
// Effective) but nothing ever retrieves it -- Status/Retrieved By only mean anything for
// Obsoletion, so isObsoletion hides those two columns entirely rather than showing "Not
// Retrieved" against a checklist that was never actually there.
//
// Built as a real component (matching RevisionHistoryModal/UsersInRoleModal) rather than a raw
// HTML string handed to NzModalService's nzContent -- a hand-built string rendered inside the
// modal ignored width:100% on its own <table> (it kept shrink-wrapping to content width instead
// of filling the modal, for reasons not worth chasing further), where the exact same Bootstrap
// `table` markup, written as a normal Angular template, already renders correctly elsewhere in
// this app (Create/Update Document's own Distribution List - Retrieval Status panel).
//
// Each row is one Role+Cabinet+DistributionType COMBINATION (DocumentRoleDistributions), not one
// row per employee -- "Any role" expands to one row per distinct role that exists in that cabinet
// scope (DocumentComponent.GetAllActiveRoleIdsAsync), company-wide a few dozen at most, never per
// headcount. The individual employees a role/cabinet row actually resolves to (which can run into
// the thousands) are a separate, already server-paginated screen -- UsersInRoleModal -- not this
// one. Paginated anyway, defensively, since a document with many distinct combinations configured
// could still run to a few dozen rows and client-side paging here is nearly free.
@Component({
  selector: 'app-distribution-list-modal',
  imports: [CommonModule],
  templateUrl: './distribution-list-modal.html',
})
export class DistributionListModal {
  distributionList: any[] = [];
  isObsoletion = false;

  // The cabinet levels in use, in order (Division, Department, ...), each with the title it is configured under. A row with
  // a level blank covers all of it, which is shown as "All" -- so the person can tell which Division / Department a role
  // is "all" of.
  levels: { field: string; title: string }[] = [];

  pageSize = 8;
  page = 1;

  constructor(
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private modalRef: NzModalRef,
  ) {
    this.distributionList = this.modalData?.distributionList || [];
    this.isObsoletion = !!this.modalData?.isObsoletion;
    const levels: { field: string; title: string }[] = this.modalData?.cabinetLevels || [];
    this.levels = levels.length
      ? levels
      : [
          { field: 'division', title: 'Division' },
          { field: 'department', title: 'Department' },
          { field: 'subDepartment', title: 'Sub Department' },
        ];
  }

  // The name of the Division / Department / ... a row is for; "All" when it names none.
  levelValue(item: any, field: string): string {
    const pascal = field.charAt(0).toUpperCase() + field.slice(1);
    return String(item?.[field] ?? item?.[pascal] ?? '').trim() || 'All';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.distributionList.length / this.pageSize));
  }

  get pagedItems(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.distributionList.slice(start, start + this.pageSize);
  }

  isRetrieved(item: any): boolean {
    return !!(item.IsRetrieved ?? item.isRetrieved);
  }

  // Physical entries are "Retrieved"; Digital ones are "Disabled" (access withdrawn).
  statusLabel(item: any): string {
    const done = this.isRetrieved(item);
    if (this.isDigital(item)) return done ? 'Disabled' : 'Not Disabled';
    return done ? 'Retrieved' : 'Not Retrieved';
  }

  isDigital(item: any): boolean {
    return this.distributionType(item).trim().toUpperCase() === 'DIGITAL';
  }

  distributionType(item: any): string {
    return String(item.DistributionType || item.distributionType || '');
  }

  typeIcon(item: any): string {
    return this.distributionType(item).toUpperCase() === 'DIGITAL' ? 'bi-laptop' : 'bi-printer';
  }

  retrievedByName(item: any): string {
    return item.RetrievedBy || item.retrievedBy || '';
  }

  previousPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  close(): void {
    this.modalRef.destroy();
  }
}
