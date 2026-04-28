import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  Renderer2,
  EmbeddedViewRef,
  OnDestroy,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Added for ngModel
import { DataService } from '@app/core/services/data.service';

/** Your EXISTING item model, UPDATED to match RealData.txt */
export interface MenuItem {
  Text: string;
  Value: string;
  NavigateUrl?: string;
  Class?: string;
  count?: number;
  imageUrl?: string;
  ClsSep?: string;
  CLSSEP?: string;
  formdescription?: string;
  child?: MenuItem[];
  subChild?: MenuItem[];
}

/** What the parent expects in getForms($event) - NO CHANGE NEEDED */
export interface FormSelectPayload {
  formName: string;
  formdescription: string;
  formId: string;
}

/** Search result interface with breadcrumb */
export interface SearchResult {
  item: MenuItem;
  breadcrumb: string;
  level: 'root' | 'child' | 'subChild';
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Added FormsModule
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnDestroy {
  @Input() isExpanded = true;
  @Output() formSelected = new EventEmitter<FormSelectPayload>();
  @Output() menuLoaded = new EventEmitter<MenuItem[]>(); // ← add this
  RootItems: MenuItem[] = [];
  openSubmenus: Record<string, boolean> = {};

  // Search-related properties
  searchQuery: string = '';
  searchResults: SearchResult[] = [];
  showSearchResults: boolean = false;
  showSearchFlyout: boolean = false; // For collapsed mode
  private searchTimeout: any;
  private searchFlyoutHost?: HTMLElement;

  @ViewChild('flyoutTpl', { static: true }) flyoutTpl!: TemplateRef<any>;

  private flyoutHostL1!: HTMLElement;
  private flyoutViewL1?: EmbeddedViewRef<any>;

  private flyoutHostL2!: HTMLElement;
  private flyoutViewL2?: EmbeddedViewRef<any>;

  private activeFlyoutRoot: MenuItem | null = null;
  private activeFlyoutChild: MenuItem | null = null;

  private hoverHost?: HTMLElement;
  private hoverActive?: HTMLElement | null = null;

  constructor(
    private _dataService: DataService,
    private renderer: Renderer2,
    private elRef: ElementRef
  ) { }

  public ngOnInit() {
    this.RootItems = [];
    this.getMenuData();
  }

  getMenuData(): void {
    this._dataService.get<any[]>('Menu/GetMenuDataThroughRedis/DMS-b').subscribe(data => {
      //console.log(data);
      this.RootItems = data;
      this.menuLoaded.emit(data); // ← emit after load
    });
  }

  ngOnDestroy(): void {
    this.closeFlyout(true);
    this.closeSearchFlyout();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // ========== SEARCH FUNCTIONALITY ==========

  onSearchInput(): void {
    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300); // 300ms debounce
  }

  performSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.searchResults = [];
    this.showSearchResults = true;

    // Search through all menu levels
    this.RootItems.forEach(root => {
      // Skip separators
      if (root.ClsSep || root.CLSSEP) return;

      // Search root level - ONLY if it's a leaf (no children)
      if (!root.child?.length && root.Text.toLowerCase().includes(query)) {
        this.searchResults.push({
          item: root,
          breadcrumb: root.Text,
          level: 'root'
        });
      }

      // Search child level
      if (root.child) {
        root.child.forEach(child => {
          if (child.ClsSep || child.CLSSEP) return;

          // ONLY include if it's a leaf (no subChildren)
          if (!child.subChild?.length && child.Text.toLowerCase().includes(query)) {
            this.searchResults.push({
              item: child,
              breadcrumb: `${root.Text} → ${child.Text}`,
              level: 'child'
            });
          }

          // Search subChild level (these are always leaves)
          if (child.subChild) {
            child.subChild.forEach(sub => {
              if (sub.ClsSep || sub.CLSSEP) return;

              if (sub.Text.toLowerCase().includes(query)) {
                this.searchResults.push({
                  item: sub,
                  breadcrumb: `${root.Text} → ${child.Text} → ${sub.Text}`,
                  level: 'subChild'
                });
              }
            });
          }
        });
      }
    });

    // Limit results to 10 for performance
    this.searchResults = this.searchResults.slice(0, 10);
  }

  selectSearchResult(result: SearchResult): void {
    console.log('Selected search result:', result);
    console.log('Item details:', {
      Text: result.item.Text,
      Value: result.item.Value,
      NavigateUrl: result.item.NavigateUrl,
      hasChildren: !!result.item.child?.length,
      hasSubChildren: !!result.item.subChild?.length
    });

    this.selectIfLeaf(result.item);
    this.clearSearch();
    this.closeSearchFlyout();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.showSearchFlyout = false;
  }

  toggleSearchFlyout(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Hide the hover tooltip
    this.hideRootHint();

    // Toggle search flyout - opens if closed, closes if open
    if (this.showSearchFlyout) {
      this.closeSearchFlyout();
    } else {
      // Close any open menu flyouts before opening search
      this.closeFlyout();

      this.showSearchFlyout = true;
      // Focus the input after a small delay to ensure it's rendered
      setTimeout(() => {
        const input = document.querySelector('.search-flyout .search-input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }

  closeSearchFlyout(): void {
    this.showSearchFlyout = false;
    this.clearSearch();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showSearchResults) {
      this.clearSearch();
    }
  }

  // ========== EXISTING MENU FUNCTIONALITY ==========

  key(v: string) { return v; }
  getSubmenuKey(rootValue: string, childValue: string) { return `${rootValue}::${childValue}`; }

  toggleRoot(root: MenuItem) {
    if (!this.isExpanded) return;
    const k = this.key(root.Value);
    this.openSubmenus[k] = !this.openSubmenus[k];
  }

  toggleChild(root: MenuItem, child: MenuItem) {
    if (!this.isExpanded) return;
    const k = this.getSubmenuKey(root.Value, child.Value);
    this.openSubmenus[k] = !this.openSubmenus[k];
  }

  selectIfLeaf(item: MenuItem) {
    if (!(item.child?.length) && !(item.subChild?.length)) {
      this.formSelected.emit({
        formName: item.Text ?? '',
        formdescription: item.formdescription ?? '',
        formId: item.Value ?? ''
      });
      if (!this.isExpanded) {
        this.closeFlyout();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInsideMenu = this.elRef.nativeElement.contains(event.target as Node);
    const clickedInsideL1 = this.flyoutHostL1 && this.flyoutHostL1.contains(event.target as Node);
    const clickedInsideL2 = this.flyoutHostL2 && this.flyoutHostL2.contains(event.target as Node);

    // Handle flyout closing
    if (!this.flyoutHostL1 && !this.activeFlyoutRoot) {
      // No flyouts open, skip flyout logic
    } else if (!clickedInsideMenu && !clickedInsideL1 && !clickedInsideL2) {
      this.closeFlyout();
    }

    // Close search flyout when clicking outside menu or on menu items (but not on search flyout itself)
    if (this.showSearchFlyout) {
      const clickedElement = event.target as HTMLElement;
      const isSearchFlyout = clickedElement.closest('.search-flyout');
      const isSearchButton = clickedElement.closest('.search-menu-item');

      // Close if clicking outside menu OR clicking menu items (but not search button or flyout)
      if (!clickedInsideMenu || (clickedInsideMenu && !isSearchFlyout && !isSearchButton)) {
        this.closeSearchFlyout();
      }
    }

    // Handle search results/dropdown closing (for expanded mode)
    if (this.showSearchResults && !this.showSearchFlyout) {
      const clickedElement = event.target as HTMLElement;
      const isSearchResultClick = clickedElement.closest('.search-result-link');

      if (!clickedInsideMenu || (clickedInsideMenu && !isSearchResultClick)) {
        this.clearSearch();
      }
    }
  }

  handleRootClick(event: MouseEvent, root: MenuItem) {
    // Close search flyout if open
    if (this.showSearchFlyout) {
      this.closeSearchFlyout();
    }

    if (this.isExpanded) {
      if (root.child?.length) {
        event.preventDefault();
        this.toggleRoot(root);
      }
      this.selectIfLeaf(root);
    } else {
      event.preventDefault();
      event.stopPropagation();

      if (!root.child?.length) {
        this.selectIfLeaf(root);
        this.closeFlyout();
      } else {
        if (this.activeFlyoutRoot === root) {
          this.closeFlyout();
        } else {
          this.closeFlyout();
          const trigger = event.currentTarget as HTMLElement;
          this.openFlyout(trigger, { level: 1, root });
          this.activeFlyoutRoot = root;
        }
      }
    }
  }

  handleL1Click(event: MouseEvent, root: MenuItem, child: MenuItem) {
    if (child.subChild?.length) {
      event.preventDefault();
      this.toggleChild(root, child);
    } else {
      this.selectIfLeaf(child);
    }
  }

  handleFlyoutL1Click(event: MouseEvent, root: MenuItem, child: MenuItem) {
    if (child.subChild?.length) {
      event.preventDefault();
    } else {
      this.selectIfLeaf(child);
    }
  }

  handleFlyoutL1Enter(event: MouseEvent, root: MenuItem, child: MenuItem) {
    if (child.subChild?.length) {
      if (this.activeFlyoutChild === child) {
        return;
      }

      this.closeFlyoutL2();
      const trigger = event.currentTarget as HTMLElement;
      this.openFlyout(trigger, { level: 2, root, child });
      this.activeFlyoutChild = child;
    } else {
      this.closeFlyoutL2();
      this.activeFlyoutChild = null;
    }
  }

  private createFlyoutHost(): HTMLElement {
    const host = this.renderer.createElement('div');
    this.renderer.setStyle(host, 'position', 'fixed');
    this.renderer.setStyle(host, 'zIndex', '2000');
    this.renderer.setStyle(host, 'pointer-events', 'auto');
    document.body.appendChild(host);

    this.renderer.listen(host, 'click', (event: MouseEvent) => {
      event.stopPropagation();
    });

    return host;
  }

  public closeFlyoutL2() {
    this.activeFlyoutChild = null;
    if (this.flyoutViewL2) {
      this.flyoutViewL2.destroy();
      this.flyoutViewL2 = undefined;
    }
    if (this.flyoutHostL2) {
      this.renderer.setStyle(this.flyoutHostL2, 'display', 'none');
      const hostL2 = this.flyoutHostL2;
      let child;
      while ((child = hostL2.firstChild)) {
        hostL2.removeChild(child);
      }
    }
  }

  private positionFlyout(trigger: HTMLElement, host: HTMLElement): void {
    const triggerRect = trigger.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const gap = 6;
    const margin = 20;

    let left = triggerRect.right + gap;

    if (left + hostRect.width > viewportWidth - margin) {
      left = triggerRect.left - hostRect.width - gap;

      if (left < margin) {
        left = viewportWidth - hostRect.width - margin;

        if (left < margin) {
          left = margin;
        }
      }
    }

    let top = triggerRect.top;

    if (top + hostRect.height > viewportHeight - margin) {
      top = viewportHeight - hostRect.height - margin;

      if (top < margin) {
        top = margin;
      }
    }

    if (top < margin) {
      top = margin;
    }

    this.renderer.setStyle(host, 'left', `${left}px`);
    this.renderer.setStyle(host, 'top', `${top}px`);
  }

  private positionHoverPill(trigger: HTMLElement, host: HTMLElement, gap = 6, tweakY = 0) {
    host.style.visibility = 'hidden';
    host.style.display = 'block';

    const r = trigger.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    const margin = 4;

    let left = r.right + gap;

    let top = Math.round(r.top + (r.height - h.height) / 2) + tweakY;

    if (left + h.width > window.innerWidth - margin) {
      left = r.left - h.width - gap;
    }

    if (top < margin) top = margin;
    const maxTop = window.innerHeight - h.height - margin;
    if (top > maxTop) top = maxTop;

    host.style.left = `${Math.max(margin, left)}px`;
    host.style.top = `${top}px`;
    host.style.visibility = 'visible';
  }

  openFlyout(trigger: HTMLElement, ctx: { level: 1 | 2; root?: MenuItem; child?: MenuItem }) {
    // Close search flyout if open
    if (this.showSearchFlyout) {
      this.closeSearchFlyout();
    }

    if (this.isExpanded) return;
    if (ctx.level === 1 && !ctx.root?.child?.length) return;
    if (ctx.level === 2 && !ctx.child?.subChild?.length) return;

    let targetHost: 'flyoutHostL1' | 'flyoutHostL2';
    let targetView: 'flyoutViewL1' | 'flyoutViewL2';

    if (ctx.level === 1) {
      this.closeFlyoutL2();
      targetHost = 'flyoutHostL1';
      targetView = 'flyoutViewL1';
      if (!this[targetHost]) {
        this[targetHost] = this.createFlyoutHost();
      }
      this.renderer.setStyle(this[targetHost], 'display', 'block');
    } else {
      targetHost = 'flyoutHostL2';
      targetView = 'flyoutViewL2';
      if (!this[targetHost]) {
        this[targetHost] = this.createFlyoutHost();
      }
      this.renderer.setStyle(this[targetHost], 'display', 'block');
    }

    if (this[targetView]) this[targetView]!.destroy();
    const view = this.flyoutTpl.createEmbeddedView(ctx);
    view.detectChanges();

    const host = this[targetHost];
    let child;
    while ((child = host.firstChild)) {
      host.removeChild(child);
    }
    view.rootNodes.forEach(n => this[targetHost].appendChild(n));
    this[targetView] = view;

    setTimeout(() => {
      this.positionFlyout(trigger, this[targetHost]);
    }, 0);
  }

  closeFlyout(forceDestroy: boolean = false) {
    this.activeFlyoutRoot = null;
    this.activeFlyoutChild = null;

    if (this.flyoutViewL1) {
      this.flyoutViewL1.destroy();
      this.flyoutViewL1 = undefined;
    }
    this.closeFlyoutL2();

    if (forceDestroy) {
      if (this.flyoutHostL1 && this.flyoutHostL1.parentNode) {
        this.flyoutHostL1.parentNode.removeChild(this.flyoutHostL1);
        (this.flyoutHostL1 as any) = null;
      }
      if (this.flyoutHostL2 && this.flyoutHostL2.parentNode) {
        this.flyoutHostL2.parentNode.removeChild(this.flyoutHostL2);
        (this.flyoutHostL2 as any) = null;
      }
    } else {
      if (this.flyoutHostL1) {
        this.renderer.setStyle(this.flyoutHostL1, 'display', 'none');
        let child;
        while ((child = this.flyoutHostL1.firstChild)) {
          this.flyoutHostL1.removeChild(child);
        }
      }
    }
  }

  showRootHint(evt: MouseEvent, label: string) {
    if (this.isExpanded) return;

    const trigger = evt.currentTarget as HTMLElement;

    if (!this.hoverHost) {
      this.hoverHost = this.createFlyoutHost();
      this.renderer.addClass(this.hoverHost, 'menu-hover-host');
    }

    this.hoverHost.style.display = 'block';
    this.hoverHost.innerHTML = `<div class="hover-pill">${label}</div>`;

    this.positionHoverPill(trigger, this.hoverHost, 6, 0);
    this.hoverActive = trigger;
  }

  hideRootHint() {
    if (this.hoverHost) this.hoverHost.style.display = 'none';
    this.hoverActive = null;
  }

  ngAfterViewInit() {
    const scroller = this.elRef.nativeElement.querySelector('.menu-scroll-container') as HTMLElement;
    if (scroller) this.renderer.listen(scroller, 'scroll', () => this.hideRootHint());
    this.renderer.listen(window, 'resize', () => this.hideRootHint());
  }

  // Icon mapping for Bootstrap Icons
  getIconClass(value: string): string {
    const iconMap: Record<string, string> = {
      'HRISRecruitmentRoot': 'person-plus',
      'PsychometricTesting': 'clipboard-check',
      'PersonalInformation': 'person-badge',
      'AssetsManagement': 'laptop',
      'HRISAttendanceRoot': 'calendar-check',
      'HRISLeaveRoot': 'calendar-x',
      'TimeSheet': 'clock-history',
      'ExpenseManager': 'receipt',
      'HRISTrainingRoot': 'book',
      'Learning': 'mortarboard',
      'PerformanceRoot': 'graph-up',
      'SuccessionPlanning': 'diagram-3',
      'HRIS360AppriasalRoot': 'arrow-repeat',
      'HRISSurveyRoot': 'clipboard-data',
      'TaskManagement': 'list-check',
      'Collaboration': 'people',
      'KnowledgeSharing': 'lightbulb',
      'HRISSeperationRoot': 'door-open',
      'Metrics': 'bar-chart',
      'HRIStool': 'tools',
      'Payroll': 'cash-coin',
      'OrgPoliciesAndDoc': 'file-earmark-text',
      'Favourites': 'star',
      'HRPlanningRoot': 'diagram-2',
      "documentmanagement": 'diagram-2',
      "implementation": 'diagram-2',
      "reports": 'diagram-2',
      "setupsandconfiguration": 'diagram-2',
    };

    const key = value.split(' ')[0];
    return iconMap[key] || 'circle';
  }
}
