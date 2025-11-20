import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-image-viewer',
  templateUrl: 'image-viewer.modal.html',
  styleUrls: ['image-viewer.modal.scss']
})
export class ImageViewerModalComponent implements OnInit {
  @Input() images: string[] = [];
  @Input() index = 0;

  current = 0;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.current = this.index || 0;
  }

  get currentImage(): string {
    return (this.images && this.images.length) ? this.images[this.current] : '';
  }

  next() {
    if (this.images && this.current < this.images.length - 1) {
      this.current++;
    }
  }

  prev() {
    if (this.images && this.current > 0) {
      this.current--;
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
