import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdoptionDocumentService } from '@features/adoption/services/adoption-document.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-adoption-documents-viewer',
  templateUrl: './adoption-documents-viewer.component.html',
  styleUrls: ['./adoption-documents-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdoptionDocumentsViewerComponent implements OnInit {
  petId: string = '';
  adopteeId: string = '';

  documents$!: Observable<{
    commitments: any[];
    agreements: any[];
    receipts: any[];
  }>;

  constructor(
    private route: ActivatedRoute,
    private documentService: AdoptionDocumentService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.petId = params['petId'];
      this.adopteeId = params['adopteeId'];

      if (this.petId && this.adopteeId) {
        this.loadDocuments();
      }
    });
  }

  loadDocuments() {
    const docs = this.documentService.getAdoptionDocuments(this.petId, this.adopteeId);

    this.documents$ = combineLatest([
      docs.commitment,
      docs.agreement,
      docs.receipt
    ]).pipe(
      map(([commitments, agreements, receipts]) => ({
        commitments,
        agreements,
        receipts
      }))
    );
  }

  openPdf(url: string) {
    window.open(url, '_blank');
  }

  getDocumentIcon(type: string): string {
    switch (type) {
      case 'commitment':
        return 'document-text';
      case 'handover-agreement':
        return 'document-attach';
      case 'handover-receipt':
        return 'receipt';
      default:
        return 'document';
    }
  }

  getDocumentColor(type: string): string {
    switch (type) {
      case 'commitment':
        return 'primary';
      case 'handover-agreement':
        return 'secondary';
      case 'handover-receipt':
        return 'success';
      default:
        return 'medium';
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    if (date.toDate) date = date.toDate();
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

