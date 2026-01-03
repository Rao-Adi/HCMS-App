import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cascade-dropdown-cell-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select 
      [ngModel]="selectedValue"
      (ngModelChange)="onChange($event)"
      [disabled]="isDisabled || params?.disabled"
      class="ag-dropdown-select"
      style="width: 100%; padding: 4px; border: 1px solid #d9d9d9; border-radius: 4px; background: white;">
      <option *ngIf="showEmptyOption" [value]="emptyValue">
        {{ placeholder }}
      </option>
      <option *ngFor="let option of filteredOptions" [value]="option.id">
        {{ option.text }}
      </option>
    </select>
  `
})
export class CascadeDropdownCellRenderer implements ICellRendererAngularComp, OnInit, OnDestroy {
  params: any;
  selectedValue: any;
  filteredOptions: any[] = [];
  allOptions: any[] = [];
  isDisabled: boolean = false;
  showEmptyOption: boolean = true;
  placeholder: string = '--Select--';
  emptyValue: any = 0;
  
  private dataChangeSubscription?: Subscription;

  ngOnInit(): void {
    this.initializeDropdown();
  }

  agInit(params: any): void {
    this.params = params;
    
    // Get initial value
    this.selectedValue = params.value || params.params?.value;
    
    // Get placeholder if provided
    if (params.params?.placeholder) {
      this.placeholder = params.params.placeholder;
    }
    
    // Get empty value if provided
    if (params.params?.emptyValue !== undefined) {
      this.emptyValue = params.params.emptyValue;
    }
    
    // Subscribe to data changes if cascade dependency exists
    if (params.params?.dependsOn) {
      this.setupCascadeDependency();
    } else {
      // Load options directly
      this.loadOptions();
    }
  }

  initializeDropdown(): void {
    if (this.params?.params?.options) {
      // Options provided directly
      this.allOptions = this.params.params.options;
      this.filteredOptions = [...this.allOptions];
    }
  }

  setupCascadeDependency(): void {
    const dependsOnField = this.params.params.dependsOn;
    const rowData = this.params.data;
    const parentValue = rowData ? rowData[dependsOnField] : null;
    
    // Listen for parent changes
    if (this.params.api) {
      this.dataChangeSubscription = this.params.api.addEventListener('cellValueChanged', (event: any) => {
        if (event.column.getColId() === dependsOnField && 
            event.node.id === this.params.node.id) {
          this.handleParentChange(event.newValue);
        }
      });
    }
    
    // Initial filter based on current parent value
    this.handleParentChange(parentValue);
  }

  handleParentChange(parentValue: any): void {
    const dataSourceKey = this.params.params.dataSourceKey;
    const filterKey = this.params.params.filterKey || 'parentId';
    
    if (!parentValue || parentValue === this.params.params.emptyValue) {
      // Parent not selected, disable and clear
      this.isDisabled = true;
      this.filteredOptions = [];
      this.selectedValue = this.emptyValue;
      this.onChange(this.selectedValue);
    } else {
      // Parent selected, filter options
      this.isDisabled = false;
      
      if (dataSourceKey && this.params.context) {
        // Get data from parent component context
        const allData = this.params.context[dataSourceKey] || [];
        this.filteredOptions = allData.filter((item: any) => 
          item[filterKey] == parentValue
        );
        this.allOptions = this.filteredOptions;
      } else if (this.params.params.getFilteredOptions) {
        // Use custom filter function
        this.filteredOptions = this.params.params.getFilteredOptions(parentValue);
        this.allOptions = this.filteredOptions;
      }
      
      // Reset selection if current selection is not in filtered options
      if (this.selectedValue !== this.emptyValue) {
        const exists = this.filteredOptions.some(opt => opt.id == this.selectedValue);
        if (!exists) {
          this.selectedValue = this.emptyValue;
          this.onChange(this.selectedValue);
        }
      }
    }
    
    // Refresh the cell
    this.params.api?.refreshCells({
      rowNodes: [this.params.node],
      columns: [this.params.column],
      force: true
    });
  }

  loadOptions(): void {
    const dataSourceKey = this.params.params.dataSourceKey;
    
    if (dataSourceKey && this.params.context) {
      // Load from parent component context
      this.allOptions = this.params.context[dataSourceKey] || [];
      this.filteredOptions = [...this.allOptions];
    } else if (this.params.params.options) {
      // Use provided options
      this.allOptions = this.params.params.options;
      this.filteredOptions = [...this.allOptions];
    }
    
    this.isDisabled = this.filteredOptions.length === 0;
  }

  onChange(newValue: any): void {
    this.selectedValue = newValue;
    
    if (this.params?.onValueChange) {
      this.params.onValueChange(newValue, this.params.data);
      
      // Trigger cascade to child dropdowns
      this.triggerChildUpdates();
    }
  }

  triggerChildUpdates(): void {
    // Find columns that depend on this field
    const columnDefs = this.params.api.getColumnDefs();
    const currentField = this.params.colDef.field;
    
    columnDefs.forEach((colDef: any) => {
      if (colDef.cellRendererParams?.dependsOn === currentField) {
        // Refresh dependent cells
        this.params.api.refreshCells({
          rowNodes: [this.params.node],
          columns: [colDef.field],
          force: true
        });
      }
    });
  }

  refresh(params: any): boolean {
    this.params = params;
    this.selectedValue = params.value || params.params?.value;
    
    // Re-initialize if needed
    if (params.params?.dependsOn) {
      const dependsOnField = params.params.dependsOn;
      const parentValue = params.data ? params.data[dependsOnField] : null;
      this.handleParentChange(parentValue);
    }
    
    return true;
  }

  ngOnDestroy(): void {
    if (this.dataChangeSubscription) {
      this.dataChangeSubscription.unsubscribe();
    }
  }
}