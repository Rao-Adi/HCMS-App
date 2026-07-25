import { Component, ChangeDetectorRef } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'highlight-cell-renderer',
  template: `<span [innerHTML]="displayValue"></span>`,
  styles: [`:host { display: flex; align-items: center; }`]
})
export class HighlightCellRenderer implements ICellRendererAngularComp {
  displayValue: string = '';
  private params!: ICellRendererParams;

  constructor(private cdr: ChangeDetectorRef) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.refresh(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.displayValue = this.getHighlightedValue();
    this.cdr.detectChanges();
    return true;
  }

  private getHighlightedValue(): string {
    const text = this.params.valueFormatted != null
      ? String(this.params.valueFormatted)
      : (this.params.value == null ? '' : String(this.params.value));

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const api = this.params.api;
    if (!api) return escapeHtml(text);

    const colId =
      this.params.column?.getColId?.() ??
      this.params.colDef?.colId ??
      (this.params.colDef?.field as string | undefined) ?? '';

    const fm = api.getFilterModel?.() || {};
    const m = colId ? (fm as any)[colId] : undefined;

    const terms: string[] = [];

    // Handle text filters
    if (m) {
      const collect = (c: any) => {
        const t = (c?.filter ?? '').toString().trim();
        if (t) terms.push(t);
      };

      if (m.operator) {
        collect(m.condition1);
        collect(m.condition2);
      } else {
        collect(m);
      }
    }

    // Collect global Quick Filter / search term
    let quickFilterText = '';
    if (typeof api.getGridOption === 'function') {
      quickFilterText = (api.getGridOption('quickFilterText') || '') as string;
    }
    // Fallback to componentParent signal/property
    if (!quickFilterText && this.params.context && this.params.context.componentParent) {
      const parent = this.params.context.componentParent;
      if (parent.value) {
        if (typeof parent.value === 'function') {
          quickFilterText = parent.value() || '';
        } else {
          quickFilterText = parent.value || '';
        }
      } else if (parent.searchValue) {
        if (typeof parent.searchValue === 'function') {
          quickFilterText = parent.searchValue() || '';
        } else {
          quickFilterText = parent.searchValue || '';
        }
      }
    }

    quickFilterText = quickFilterText.trim();
    if (quickFilterText) {
      terms.push(quickFilterText);
    }

    if (!terms.length) {
      return escapeHtml(text);
    }

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const uniq = Array.from(new Set(terms.map(escapeRegExp)));
    const re = new RegExp(`(${uniq.join('|')})`, 'gi');

    return escapeHtml(text).replace(re, '<mark class="ag-hl" style="background-color: #ffeb3b; padding: 0 2px; border-radius: 2px;">$1</mark>');
  }
}
