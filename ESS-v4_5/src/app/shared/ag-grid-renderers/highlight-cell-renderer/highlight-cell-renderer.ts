import { Component } from '@angular/core';
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

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.refresh(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.displayValue = this.getHighlightedValue();
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
    const colId =
      this.params.column?.getColId?.() ??
      this.params.colDef?.colId ??
      (this.params.colDef?.field as string | undefined) ?? '';

    const fm = api.getFilterModel?.() || {};
    const m = colId ? (fm as any)[colId] : undefined;

    if (!m) {
      return escapeHtml(text);
    }

    // Handle text filters
    const terms: string[] = [];
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

    if (!terms.length) {
      return escapeHtml(text);
    }

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const uniq = Array.from(new Set(terms.map(escapeRegExp)));
    const re = new RegExp(`(${uniq.join('|')})`, 'gi');

    return escapeHtml(text).replace(re, '<mark class="ag-hl">$1</mark>');
  }
}
