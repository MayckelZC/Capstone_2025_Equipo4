import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdoptionCommitment, HandoverAgreement, HandoverReceipt, generateReceiptNumber } from '../models/AdoptionDocument';

@Injectable({
  providedIn: 'root'
})
export class AdoptionDocumentService {

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  /**
   * Generate PDF for Adoption Commitment document
   */
  async generateCommitmentPDF(commitment: Partial<AdoptionCommitment>): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(40, 167, 69);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Compromiso de Adopción', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Patitas en Casa', pageWidth / 2, 30, { align: 'center' });

    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    let yPos = 55;

    // Document info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Adoptante:', 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${commitment.adopterName || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Fecha: ${commitment.signature?.timestamp ? new Date(commitment.signature.timestamp).toLocaleDateString('es-ES') : 'N/A'}`, 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Mascota:', 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${commitment.petName || 'N/A'}`, 20, yPos);
    yPos += 12;

    // Commitments section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Compromisos del Adoptante:', 15, yPos);
    yPos += 10;

    const commitments = [
      {
        check: commitment.commitments?.longTermCare || false,
        text: 'Cuidado a largo plazo: Las mascotas viven 10-15 años o más.\nMe comprometo a cuidarla durante toda su vida.'
      },
      {
        check: commitment.commitments?.veterinaryExpenses || false,
        text: 'Gastos veterinarios: Asumo la responsabilidad de todos\nlos gastos médicos y veterinarios.'
      },
      {
        check: commitment.commitments?.noAbandonment || false,
        text: 'No abandono: Me comprometo a no abandonar a la mascota\nbajo ninguna circunstancia.'
      },
      {
        check: commitment.commitments?.returnPolicy || false,
        text: 'Política de devolución: Si no puedo continuar con el cuidado,\ncontactaré al dueño original, NO la abandonaré.'
      },
      {
        check: commitment.commitments?.legalConsequences || false,
        text: 'Consecuencias legales: Acepto las consecuencias legales\nen caso de maltrato o abandono.'
      },
      {
        check: commitment.commitments?.addressChangeNotification || false,
        text: 'Cambio de domicilio: Me comprometo a notificar\ncualquier cambio de dirección.'
      }
    ];

    doc.setFontSize(10);
    commitments.forEach((item) => {
      // Checkbox
      doc.rect(20, yPos - 3, 4, 4);
      if (item.check) {
        doc.setFillColor(40, 167, 69);
        doc.rect(20, yPos - 3, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('✓', 21, yPos + 0.5);
        doc.setTextColor(0, 0, 0);
      }

      // Text
      doc.setFont('helvetica', 'normal');
      const lines = item.text.split('\n');
      lines.forEach((line, index) => {
        doc.text(line, 27, yPos + (index * 5));
      });

      yPos += (lines.length * 5) + 5;
    });

    yPos += 10;

    // Terms acceptance
    doc.setFont('helvetica', 'bold');
    doc.rect(20, yPos - 3, 4, 4);
    if (commitment.signature?.accepted) {
      doc.setFillColor(40, 167, 69);
      doc.rect(20, yPos - 3, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('✓', 21, yPos + 0.5);
      doc.setTextColor(0, 0, 0);
    }
    doc.text('He leído y acepto todos los términos del compromiso', 27, yPos);
    yPos += 12;

    // Signature section
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Este documento tiene validez legal y será almacenado permanentemente.', 15, yPos);
    yPos += 10;

    doc.line(15, yPos, 95, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Firma del Adoptante', 15, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const signDate = commitment.signature?.timestamp ? new Date(commitment.signature.timestamp).toLocaleString('es-ES') : new Date().toLocaleString('es-ES');
    doc.text(`Firmado digitalmente el ${signDate}`, 15, yPos);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, footerY, pageWidth, 20, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Patitas en Casa - Sistema de Adopción Responsable', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text(`Documento ID: ${commitment.petId.substring(0, 8)}`, pageWidth / 2, footerY + 13, { align: 'center' });

    return doc.output('blob');
  }

  /**
   * Generate PDF for Handover Agreement document
   */
  async generateHandoverAgreementPDF(agreement: Partial<HandoverAgreement>): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(40, 167, 69);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Acuerdo de Entrega', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Patitas en Casa', pageWidth / 2, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    let yPos = 55;

    // Parties info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Dueño Original:', 15, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${agreement.ownerName}`, 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Adopt', 15, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Aprobación: ${agreement.signature?.timestamp ? new Date(agreement.signature.timestamp).toLocaleDateString('es-ES') : 'N/A'}`, 20, yPos);
    yPos += 12;

    // Pet information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Información de la Mascota:', 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${agreement.petName || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Estado de Salud: ${agreement.petInformation?.healthStatus || 'N/A'}`, 20, yPos);
    yPos += 6;

    if (agreement.petInformation?.vaccinationsUpToDate) {
      doc.text(`Vacunas: Al día`, 20, yPos);
      yPos += 6;
    }

    if (agreement.petInformation?.specialNeeds) {
      doc.text(`Necesidades Especiales:`, 20, yPos);
      yPos += 5;
      const needsLines = doc.splitTextToSize(agreement.petInformation.specialNeeds, 160);
      doc.text(needsLines, 25, yPos);
      yPos += needsLines.length * 5;
    }

    yPos += 8;

    // Owner commitments
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Compromisos del Dueño:', 15, yPos);
    yPos += 10;

    const ownerCommitments = [
      {
        check: agreement.ownerCommitments?.deliverInGoodCondition || false,
        text: 'Me comprometo a entregar la mascota en buen estado'
      },
      {
        check: agreement.ownerCommitments?.ownershipTransfer || false,
        text: 'Acepto la transferencia de propiedad'
      },
      {
        check: agreement.ownerCommitments?.postAdoptionContact || false,
        text: 'Estoy disponible para contacto post-adopción'
      }
    ];

    doc.setFontSize(10);
    ownerCommitments.forEach((item) => {
      doc.rect(20, yPos - 3, 4, 4);
      if (item.check) {
        doc.setFillColor(40, 167, 69);
        doc.rect(20, yPos - 3, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('✓', 21, yPos + 0.5);
        doc.setTextColor(0, 0, 0);
      }

      doc.setFont('helvetica', 'normal');
      const lines = item.text.split('\n');
      lines.forEach((line, index) => {
        doc.text(line, 27, yPos + (index * 5));
      });

      yPos += (lines.length * 5) + 5;
    });

    yPos += 10;

    // Terms acceptance
    doc.setFont('helvetica', 'bold');
    doc.rect(20, yPos - 3, 4, 4);
    if (agreement.signature?.accepted) {
      doc.setFillColor(40, 167, 69);
      doc.rect(20, yPos - 3, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('✓', 21, yPos + 0.5);
      doc.setTextColor(0, 0, 0);
    }
    doc.text('Acepto los términos del acuerdo de entrega', 27, yPos);
    yPos += 12;

    // Signature section
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Este documento certifica la aprobación de la adopción.', 15, yPos);
    yPos += 10;

    doc.line(15, yPos, 95, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Firma del Dueño Original', 15, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const signDate = agreement.signature?.timestamp ? new Date(agreement.signature.timestamp).toLocaleString('es-ES') : new Date().toLocaleString('es-ES');
    doc.text(`Firmado digitalmente el ${signDate}`, 15, yPos);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, footerY, pageWidth, 20, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Patitas en Casa - Sistema de Adopción Responsable', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text(`Documento ID: ${agreement.petId.substring(0, 8)}`, pageWidth / 2, footerY + 13, { align: 'center' });

    return doc.output('blob');
  }

  /**
   * Generate PDF for Handover Receipt document
   */
  async generateHandoverReceiptPDF(receipt: Partial<HandoverReceipt>): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- Header ---
    // Green background
    doc.setFillColor(40, 167, 69); // #28a745
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo
    try {
      const logoUrl = 'assets/imgs/logo.png';
      const logoImg = await this.loadImage(logoUrl);
      doc.addImage(logoImg, 'PNG', margin, 5, 30, 30);
    } catch (e) {
      console.warn('Could not load logo', e);
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Recibo de Entrega', pageWidth - margin, 18, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. ${receipt.receiptNumber}`, pageWidth - margin, 28, { align: 'right' });
    doc.text('Patitas en Casa', pageWidth - margin, 35, { align: 'right' });

    // --- Content ---
    doc.setTextColor(0, 0, 0);
    let yPos = 55;

    // 1. Delivery Info (Centered)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalles de la Entrega', pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const deliveryDate = receipt.delivery?.date ? new Date(receipt.delivery.date).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Fecha no registrada';

    doc.text(`Fecha: ${deliveryDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Lugar: ${receipt.delivery?.location || 'No especificado'}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // 2. Parties (2 Columns)
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;
    const colWidth = (pageWidth - (margin * 2) - 20) / 2;

    // Column 1: Owner
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Dueño Original (Entregador)', col1X, yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.owner?.name || 'N/A', col1X, yPos + 6);

    const ownerDate = receipt.owner?.confirmationDate ? new Date(receipt.owner.confirmationDate).toLocaleDateString('es-ES') : 'Pendiente';
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Confirmado: ${ownerDate}`, col1X, yPos + 11);
    doc.setTextColor(0, 0, 0);

    // Column 2: Adopter
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Adoptante (Receptor)', col2X, yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.adopter?.name || 'N/A', col2X, yPos + 6);

    const adopterDate = receipt.adopter?.confirmationDate ? new Date(receipt.adopter.confirmationDate).toLocaleDateString('es-ES') : 'Pendiente';
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Confirmado: ${adopterDate}`, col2X, yPos + 11);
    doc.setTextColor(0, 0, 0);

    yPos += 25;

    // 3. Pet Details Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Mascota Entregada', margin, yPos);
    yPos += 5;

    const petData = [
      ['Nombre', receipt.petName || 'N/A'],
      ['Raza', receipt.petDetails?.breed || 'N/A'],
      ['Edad', receipt.petDetails?.age || 'N/A'],
      ['Color', receipt.petDetails?.color || 'N/A'],
      ['Sexo', receipt.petDetails?.sex || 'N/A']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: petData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 4. Checklist (Simplified)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Verificación', margin, yPos);
    yPos += 8;

    // Checkbox style
    doc.setDrawColor(40, 167, 69);
    doc.setFillColor(40, 167, 69);
    doc.rect(margin, yPos - 4, 5, 5, 'FD'); // Filled and outlined

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('X', margin + 1.2, yPos - 0.5); // Checkmark simulation

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Mascota entregada físicamente y en buen estado', margin + 8, yPos);

    yPos += 15;

    // 5. Additional Notes
    if (receipt.delivery?.additionalNotes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notas Adicionales:', margin, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(receipt.delivery.additionalNotes, pageWidth - (margin * 2));
      doc.text(notesLines, margin, yPos);
      yPos += notesLines.length * 5 + 10;
    }

    // 6. Signatures
    // Push to bottom of page but leave space for footer
    const signatureY = pageHeight - 60;

    // Draw lines
    doc.setDrawColor(0, 0, 0);
    doc.line(col1X, signatureY, col1X + colWidth - 10, signatureY);
    doc.line(col2X, signatureY, col2X + colWidth - 10, signatureY);

    // Labels
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma Dueño Original', col1X, signatureY + 5);
    doc.text('Firma Adoptante', col2X, signatureY + 5);

    // Names under signatures
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.owner?.name || '', col1X, signatureY + 10);
    doc.text(receipt.adopter?.name || '', col2X, signatureY + 10);

    // Digital signature note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Firmado digitalmente', col1X, signatureY + 15);
    doc.text('Firmado digitalmente', col2X, signatureY + 15);

    // --- Footer ---
    const footerY = pageHeight - 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Patitas en Casa - Sistema de Adopción Responsable', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} - ID: ${receipt.receiptNumber}`, pageWidth / 2, footerY + 5, { align: 'center' });

    return doc.output('blob');
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  }

  /**
   * Upload PDF to Firebase Storage
   */
  async uploadDocument(blob: Blob, path: string): Promise<string> {
    const ref = this.storage.ref(path);
    await ref.put(blob);
    return await ref.getDownloadURL().toPromise();
  }

  /**
   * Save commitment document to Firestore
   */
  async saveCommitmentDocument(commitment: Partial<AdoptionCommitment>, pdfUrl: string): Promise<string> {
    const docRef = await this.firestore.collection('adoption-commitments').add({
      ...commitment,
      documentUrl: pdfUrl,
      createdAt: new Date()
    });
    return docRef.id;
  }

  /**
   * Save handover agreement to Firestore
   */
  async saveHandoverAgreement(agreement: HandoverAgreement, pdfUrl: string): Promise<string> {
    const docRef = await this.firestore.collection('adoption-handover-agreements').add({
      ...agreement,
      documentUrl: pdfUrl,
      createdAt: new Date()
    });
    return docRef.id;
  }

  /**
   * Save handover receipt to Firestore
   */
  async saveHandoverReceipt(receipt: HandoverReceipt, pdfUrl: string): Promise<string> {
    const docRef = await this.firestore.collection('adoption-receipts').add({
      ...receipt,
      documentUrl: pdfUrl,
      createdAt: new Date()
    });
    return docRef.id;
  }

  /**
   * Get all documents for a specific adoption (by petId and adopteeId)
   */
  getAdoptionDocuments(petId: string, adopteeId: string) {
    return {
      commitment: this.firestore.collection('adoption-commitments', ref =>
        ref.where('petId', '==', petId)
          .where('adopterId', '==', adopteeId)
      ).valueChanges({ idField: 'id' }),

      agreement: this.firestore.collection('adoption-handover-agreements', ref =>
        ref.where('petId', '==', petId)
      ).valueChanges({ idField: 'id' }),

      receipt: this.firestore.collection('adoption-receipts', ref =>
        ref.where('petId', '==', petId)
      ).valueChanges({ idField: 'id' })
    };
  }
}
