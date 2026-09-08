import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';

import { DRDistributionList } from './drdistribution-list';
import { DistributionListService } from '@app/shared/services/distribution-list.service';
import { DistributionTypeService } from '@app/shared/services/distribution-type.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { NzModalService } from 'ng-zorro-antd/modal';

describe('DRDistributionList', () => {
  let component: DRDistributionList;
  let fixture: ComponentFixture<DRDistributionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DRDistributionList],
      providers: [
        { provide: DistributionListService, useValue: {} },
        { provide: DistributionTypeService, useValue: { getDistributionTypeList: () => of({ Data: [] }) } },
        { provide: NotificationToastService, useValue: {} },
        { provide: CabinetHierarchyService, useValue: { loadDropdownHierarchy: () => of([]) } },
        { provide: CabinetGridService, useValue: { loadDropdownData: () => of(void 0), buildCabinetColumns: () => [] } },
        { provide: PermissionService, useValue: { getPermissions: () => of({ canAdd: true, canEdit: true, canDelete: true }) } },
        { provide: PeoplePartnersService, useValue: { GetAllRoles: () => of({ Data: [] }) } },
        { provide: NzModalService, useValue: { confirm: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DRDistributionList);
    component = fixture.componentInstance;
    fixture.detectChanges(); // runs ngOnInit -> loadDropdownsAndGrid via the stubs above
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Bug report: selecting a draft WITH a distribution list correctly shows it, but then
  // selecting a different draft whose distribution list is EMPTY still shows the previous
  // draft's rows -- the grid never clears. Root cause was setGridData()'s early return on an
  // empty selectedDistributionList, which skipped clearing distributionListData entirely.
  it('clears distributionListData when a newly-selected record has an empty distribution list', () => {
    // Simulate selecting a draft that HAS distribution rows (e.g. clicking a request row in
    // draft-request-list.ts, which rebinds [selectedDistributionList]).
    const populated = [
      {
        Id: 1,
        DivisionCode: 'DIV1',
        DepartmentCode: 'DEP1',
        SubDepartmentCode: 'SUB1',
        BusinessDomainCode: null,
        RoleId: 5,
        DistributionTypeId: 2,
      },
    ];
    component.selectedDistributionList = populated;
    component.ngOnChanges({
      selectedDistributionList: new SimpleChange(null, populated, true),
    });

    expect(component.distributionListData.length).toBe(1);
    expect(component.distributionListData[0].roleId).toBe(5);

    // Now simulate selecting a DIFFERENT draft that has NO distribution rows.
    const empty: any[] = [];
    component.selectedDistributionList = empty;
    component.ngOnChanges({
      selectedDistributionList: new SimpleChange(populated, empty, false),
    });

    // This is the actual regression: before the fix, distributionListData still held the
    // previous record's 1 row here because setGridData() returned early without clearing it.
    expect(component.distributionListData.length).toBe(0);
  });

  // Guards the OTHER direction: emitting an internal update (e.g. user adds/removes a row
  // locally) must not be treated as "record switched, wipe the grid" when the parent's
  // re-bound value round-trips back in via [selectedDistributionList].
  it('does not re-run setGridData for its own emitted update (isInternalUpdate guard)', () => {
    const row = {
      Id: 1,
      DivisionCode: null,
      DepartmentCode: null,
      SubDepartmentCode: null,
      BusinessDomainCode: null,
      RoleId: null, // "Any"
      DistributionTypeId: 2,
    };
    component.selectedDistributionList = [row];
    component.ngOnChanges({
      selectedDistributionList: new SimpleChange(null, [row], true),
    });
    expect(component.distributionListData.length).toBe(1);

    // Simulate the component's own notifyParent() round-tripping: isInternalUpdate is set,
    // then the (now empty, if the user cleared the grid) value comes back through the input.
    (component as any).isInternalUpdate = true;
    component.selectedDistributionList = [];
    component.ngOnChanges({
      selectedDistributionList: new SimpleChange([row], [], false),
    });

    // Guarded: this ngOnChanges call must be a no-op (distributionListData untouched), since
    // it's the component's own internal update, not an externally-selected different record.
    expect(component.distributionListData.length).toBe(1);
  });
});
