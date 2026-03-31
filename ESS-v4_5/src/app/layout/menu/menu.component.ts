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
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // This import is correct
import { DataService } from '@app/core/services/data.service';

/** Your EXISTING item model, UPDATED to match RealData.txt */
export interface MenuItem {
  Text: string; // Was 'text'
  Value: string; // Was 'value'
  NavigateUrl?: string; // Was 'navigateUrl'
  Class?: string; // Was 'class'
  count?: number; // Kept from original
  imageUrl?: string; // Kept from original
  ClsSep?: string; // Was 'clsSep'
  CLSSEP?: string; // Added from RealData.txt
  formdescription?: string; // Kept from original (is lowercase in RealData.txt)
  child?: MenuItem[]; // Kept from original (is lowercase in RealData.txt)
  subChild?: MenuItem[]; // Kept from original (is lowercase in RealData.txt)
}

/** What the parent expects in getForms($event) - NO CHANGE NEEDED */
export interface FormSelectPayload {
  formName: string;
  formdescription: string;
  formId: string;
}

/* -------- Inline menu data (UPDATED to match new MenuItem interface) -------- */
// ... (Your DUMMY_MENU_ITEMS array) ...
// (Removed for brevity, but it should be here)

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule], // This is correct
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnDestroy {
  @Input() isExpanded = true;
  @Output() formSelected = new EventEmitter<FormSelectPayload>();
  RootItems: MenuItem[] = []; // Initialized as empty, will be filled by getMenuData
  openSubmenus: Record<string, boolean> = {};

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
    private _dataService: DataService, // Injected DataService
    private renderer: Renderer2,
    private elRef: ElementRef // You do NOT need to inject the Router, which is correct
  ) {}

  public ngOnInit() {
    //this.RootItems = [];
    this.RootItems = [
      {
        Text: 'Dashboard',
        Value: 'dashboard',
        NavigateUrl: '/dashboard',
        Class: 'menu-l1',
      },
      {
        Text: 'Impelementation',
        Value: 'impelementation',
        Class: 'menu-l1',
        child: [
          {
            Text: 'Upload Old Documents',
            Value: 'upload-old-documents',
            NavigateUrl: '/implementation/upload-old-documents',
            Class: 'menu-l2',
          },
          {
            Text: 'AG-Grid inline edit test',
            Value: 'aggridinlineediting',
            NavigateUrl: '/implementation/aggridinlineediting',
            Class: 'menu-l2',
          },
          {
            Text: 'Upload Old Documents Edit',
            Value: 'upload-old-documents-edit',
            NavigateUrl: '/implementation/upload-old-documents-edit',
            Class: 'menu-l2',
          },
        ],
      },
      {
        Text: 'Setups And Configurations',
        Value: 'setups-and-configurations',
        Class: 'menu-l1',
        child: [
          {
            Text: 'Cabinet Structure',
            Value: 'Cabinet-Structure',
            NavigateUrl: '/setups-configurations/cabinet-structure',
            Class: 'menu-l2',
          },
          {
            Text: 'Document Attributes',
            Value: 'Document-Attributes',
            NavigateUrl: '/setups-configurations/document-attributes',
            Class: 'menu-l2',
          },
          {
            Text: 'Template',
            Value: 'Template',
            NavigateUrl: '/setups-configurations/document-template',
            Class: 'menu-l2',
          },
          {
            Text: 'Users',
            Value: 'Users',
            NavigateUrl: '/setups-configurations/users',
            Class: 'menu-l2',
          },
          {
            Text: 'Approval Workflow Policy Management',
            Value: 'Approval-Workflow-Policy-Management',
            NavigateUrl: '/setups-configurations/approval-workflow-policy-management',
            Class: 'menu-l2',
          },
          {
            Text: 'Approval Workflow Policy(External Users)',
            Value: 'Approval-Workflow-Policy(External-Users)',
            NavigateUrl: '/setups-configurations/approval-workflow-policy-external-users',
            Class: 'menu-l2',
          },
          {
            Text: 'Misc Policies',
            Value: 'Misc-Policies',
            NavigateUrl: '/setups-configurations/misc-policies',
            Class: 'menu-l2',
          },
          {
            Text: 'E-Signature',
            Value: 'ESignature',
            NavigateUrl: '/setups-configurations/esignature',
            Class: 'menu-l2',
          },
          {
            Text: 'Responsibility Transfer Form',
            Value: 'responsibility-transfer-form',
            NavigateUrl: '/setups-configurations/responsibility-transfer-form',
            Class: 'menu-l2',
          },
          {
            Text: 'Responsibility Transfer Workflow',
            Value: 'responsibility-transfer-workflow',
            NavigateUrl: '/setups-configurations/responsibility-transfer-workflow',
            Class: 'menu-l2',
          },
        ],
      },
      {
        Text: 'Documents',
        Value: 'documents',
        Class: 'menu-l1',
        child: [
          {
            Text: 'Request for Document Creation/Update',
            Value: 'Reuest-for-Document-Creation-Update',
            NavigateUrl: '/documents/request-for-document-creation-update',
            Class: 'menu-l2',
          },
          {
            Text: 'My Approvals – Request for Document Creation/Update',
            Value: 'My-Approvals-Reuest-for-Document-Creation-Update',
            NavigateUrl: '/documents/my-approvals-request',
            Class: 'menu-l2',
          },
          {
            Text: 'Create/Update Document',
            Value: 'Document-Creation-Update',
            NavigateUrl: '/documents/create-update-document',
            Class: 'menu-l2',
          },
          {
            Text: 'My Approvals-Documents',
            Value: 'My-Approvals-Documents',
            NavigateUrl: '/documents/my-approvals-documents',
            Class: 'menu-l2',
          },
          {
            Text: 'SOP Documents Training',
            Value: 'SOP-Documents-Training',
            NavigateUrl: 'documents/sop-training',
            Class: 'menu-l2',
          },
          {
            Text: 'Document Authorization-Post Training',
            Value: 'Document-Authorization-Post-Training',
            NavigateUrl: '/documents/authorization-post-training',
            Class: 'menu-l2',
          },
        ],
      },
      {
        Text: 'Reports',
        Value: 'reports',
        Class: 'menu-l1',
        child: [
          {
            Text: 'Approval Documents',
            Value: 'Approval-Documents',
            NavigateUrl: '/reports/view-document',
            Class: 'menu-l2',
          },
          {
            Text: 'Personalized Email Alerts',
            Value: 'personalized-Email-Alerts',
            NavigateUrl: '/reports/personalized-email-alerts',
            Class: 'menu-l2',
          },
          {
            Text: 'AI Report',
            Value: 'Ai-Report',
            NavigateUrl: '/reports/ai-report',
            Class: 'menu-l2',
          },
          {
            Text: 'View Documents(Pending Apprvovals)',
            Value: 'View-Documents-Pending-Apprvovals',
            NavigateUrl: '/reports/pending-approval',
            Class: 'menu-l2',
          },
        ],
      },
      // {
      //   Text: 'Documents',
      //   Value: 'documents',
      //   Class: 'menu-l1',
      //   child: [
      //     {
      //       Text: 'All Documents',
      //       Value: 'all-docs',
      //       NavigateUrl: '/documents/all',
      //       Class: 'menu-l2',
      //     },
      //     {
      //       Text: 'Workflows',
      //       Value: 'workflows',
      //       Class: 'menu-l2',
      //       subChild: [
      //         {
      //           Text: 'Pending',
      //           Value: 'pending-workflows',
      //           NavigateUrl: '/documents/workflows/pending',
      //           Class: 'menu-l3',
      //         },
      //         {
      //           Text: 'Approved',
      //           Value: 'approved-workflows',
      //           NavigateUrl: '/documents/workflows/approved',
      //           Class: 'menu-l3',
      //         },
      //       ],
      //     },
      //   ],
      // },
    ];
    //this.getMenuData();
  }

  getMenuData(): void {
    this._dataService.get<any[]>('Menu/GetMenuDataThroughRedis/ESSv4.5').subscribe((data) => {
      console.log(data);
      this.RootItems = data;
      //this._UtilitiesService.setActiveMenu();
    });
  }

  // ... (Removed commented out getMenuCounts) ...

  ngOnDestroy(): void {
    this.closeFlyout(true);
  }

  // #region Menu scirpt working
  // Keys
  key(v: string) {
    return v;
  }
  getSubmenuKey(rootValue: string, childValue: string) {
    return `${rootValue}::${childValue}`;
  }

  // Accordion toggles
  toggleRoot(root: MenuItem) {
    if (!this.isExpanded) return;
    const k = this.key(root.Value); // <-- UPDATED
    this.openSubmenus[k] = !this.openSubmenus[k];
  }
  toggleChild(root: MenuItem, child: MenuItem) {
    if (!this.isExpanded) return;
    const k = this.getSubmenuKey(root.Value, child.Value); // <-- UPDATED
    this.openSubmenus[k] = !this.openSubmenus[k];
  }

  // Emit leaf selection (This function is correct, no changes needed)
  selectIfLeaf(item: MenuItem) {
    if (!item.child?.length && !item.subChild?.length) {
      this.formSelected.emit({
        formName: item.Text ?? '', // <-- UPDATED
        formdescription: item.formdescription ?? '', // <-- NO CHANGE (lowercase in RealData)
        formId: item.Value ?? '', // <-- UPDATED
      });
      if (!this.isExpanded) {
        this.closeFlyout();
      }
    }
  }

  // Global click listener (This function is correct, no changes needed)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.flyoutHostL1 && !this.activeFlyoutRoot) {
      return;
    }
    const clickedInsideMenu = this.elRef.nativeElement.contains(event.target as Node);
    const clickedInsideL1 = this.flyoutHostL1 && this.flyoutHostL1.contains(event.target as Node);
    const clickedInsideL2 = this.flyoutHostL2 && this.flyoutHostL2.contains(event.target as Node);

    if (!clickedInsideMenu && !clickedInsideL1 && !clickedInsideL2) {
      this.closeFlyout();
    }
  }

  // ==========================
  // Root item click - CHANGED
  // ==========================
  handleRootClick(event: MouseEvent, root: MenuItem) {
    if (this.isExpanded) {
      // --- THIS IS THE FIX ---
      if (root.child?.length) {
        // It's a parent, so prevent the '#' navigation
        event.preventDefault();
        this.toggleRoot(root);
      }
      // If it's a leaf, we do nothing and let [routerLink] work
      this.selectIfLeaf(root);
    } else {
      // This 'else' block was already correct!
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

  // ==================================
  // L1 item click - NEW FUNCTION ADDED
  // ==================================
  handleL1Click(event: MouseEvent, root: MenuItem, child: MenuItem) {
    if (child.subChild?.length) {
      // It's a parent, so prevent the '#' navigation and toggle
      event.preventDefault();
      this.toggleChild(root, child);
    } else {
      // It's a leaf, let [routerLink] work
      this.selectIfLeaf(child);
    }
  }

  // This flyout handler was already correct!
  handleFlyoutL1Click(event: MouseEvent, root: MenuItem, child: MenuItem) {
    if (child.subChild?.length) {
      // It's a parent. Prevent <a> tag navigation.
      event.preventDefault();
    } else {
      // It's a leaf. selectIfLeaf() will select it AND close the flyouts.
      this.selectIfLeaf(child);
    }
  }

  handleFlyoutL1Enter(event: MouseEvent, root: MenuItem, child: MenuItem) {
    if (child.subChild?.length) {
      // It's a parent, open L2
      if (this.activeFlyoutChild === child) {
        return; // L2 for this item is already open
      }

      this.closeFlyoutL2(); // Close any other L2
      const trigger = event.currentTarget as HTMLElement;
      this.openFlyout(trigger, { level: 2, root, child });
      this.activeFlyoutChild = child; // Track the active L2
    } else {
      // It's a leaf, close any open L2
      this.closeFlyoutL2();
      this.activeFlyoutChild = null;
    }
  }

  // Simplified host creation
  private createFlyoutHost(): HTMLElement {
    const host = this.renderer.createElement('div');
    this.renderer.setStyle(host, 'position', 'fixed');
    this.renderer.setStyle(host, 'zIndex', '2000');
    this.renderer.setStyle(host, 'pointer-events', 'auto');
    document.body.appendChild(host);

    // Stop clicks inside flyout from closing itself
    this.renderer.listen(host, 'click', (event: MouseEvent) => {
      event.stopPropagation();
    });

    return host;
  }

  // Public helper to close L2
  public closeFlyoutL2() {
    this.activeFlyoutChild = null; // Reset active L2
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

  // ====== UPDATED: Smart positioning for flyouts ======
  private positionFlyout(trigger: HTMLElement, host: HTMLElement): void {
    const triggerRect = trigger.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const gap = 6;
    const margin = 20;

    // Calculate horizontal position (default: right of trigger)
    let left = triggerRect.right + gap;

    // Check if flyout would overflow right edge
    if (left + hostRect.width > viewportWidth - margin) {
      // Try positioning to the left of trigger
      left = triggerRect.left - hostRect.width - gap;

      // If doesn't fit on left either, align with right edge of viewport
      if (left < margin) {
        left = viewportWidth - hostRect.width - margin;

        // Last resort: align with left margin
        if (left < margin) {
          left = margin;
        }
      }
    }

    // Calculate vertical position (default: aligned with trigger top)
    let top = triggerRect.top;

    // Check if flyout would overflow bottom edge
    if (top + hostRect.height > viewportHeight - margin) {
      // Align bottom of flyout with bottom of viewport
      top = viewportHeight - hostRect.height - margin;

      // If flyout is taller than viewport, align with top margin
      if (top < margin) {
        top = margin;
      }
    }

    // Ensure flyout doesn't go above viewport
    if (top < margin) {
      top = margin;
    }

    // Apply positioning
    this.renderer.setStyle(host, 'left', `${left}px`);
    this.renderer.setStyle(host, 'top', `${top}px`);
  }

  private positionHoverPill(trigger: HTMLElement, host: HTMLElement, gap = 6, tweakY = 0) {
    // Show to measure
    host.style.visibility = 'hidden';
    host.style.display = 'block';

    const r = trigger.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    const margin = 4;

    // Default: to the right of the trigger
    let left = r.right + gap;

    // Vertical center on the trigger
    let top = Math.round(r.top + (r.height - h.height) / 2) + tweakY;

    // Flip to left if overflowing viewport
    if (left + h.width > window.innerWidth - margin) {
      left = r.left - h.width - gap;
    }

    // Clamp vertically
    if (top < margin) top = margin;
    const maxTop = window.innerHeight - h.height - margin;
    if (top > maxTop) top = maxTop;

    host.style.left = `${Math.max(margin, left)}px`;
    host.style.top = `${top}px`;
    host.style.visibility = 'visible';
  }

  // openFlyout (UPDATED with smart positioning)
  openFlyout(trigger: HTMLElement, ctx: { level: 1 | 2; root?: MenuItem; child?: MenuItem }) {
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
      // level 2
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
    view.rootNodes.forEach((n) => this[targetHost].appendChild(n));
    this[targetView] = view;

    // ====== ADDED: Smart positioning after content is rendered ======
    setTimeout(() => {
      this.positionFlyout(trigger, this[targetHost]);
    }, 0);
  }

  // closeFlyout (simpler, resets state)
  closeFlyout(forceDestroy: boolean = false) {
    this.activeFlyoutRoot = null;
    this.activeFlyoutChild = null;

    if (this.flyoutViewL1) {
      this.flyoutViewL1.destroy();
      this.flyoutViewL1 = undefined;
    }
    this.closeFlyoutL2(); // Close L2

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
      this.hoverHost = this.createFlyoutHost(); // you already have this helper
      this.renderer.addClass(this.hoverHost, 'menu-hover-host');
    }

    this.hoverHost.style.display = 'block';
    // Render a tiny pill
    this.hoverHost.innerHTML = `<div class="hover-pill">${label}</div>`;

    // Reuse your smart positioning
    //this.positionFlyout(trigger, this.hoverHost!);
    this.positionHoverPill(trigger, this.hoverHost, 6 /* gap */, 0 /* tweakY: try 0 or 1 */);
    this.hoverActive = trigger;
  }

  hideRootHint() {
    if (this.hoverHost) this.hoverHost.style.display = 'none';
    this.hoverActive = null;
  }

  ngAfterViewInit() {
    const scroller = this.elRef.nativeElement.querySelector(
      '.menu-scroll-container'
    ) as HTMLElement;
    if (scroller) this.renderer.listen(scroller, 'scroll', () => this.hideRootHint());
    this.renderer.listen(window, 'resize', () => this.hideRootHint());
  }
  // #endregion
}
