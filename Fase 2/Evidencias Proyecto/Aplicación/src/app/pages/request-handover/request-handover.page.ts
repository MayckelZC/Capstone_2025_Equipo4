import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HandoverService } from '../../services/handover.service';
import { AdoptionService } from '../../services/adoption.service';
import { AdoptionRequest } from '../../models/AdoptionRequest';
import { Handover } from '../../models/Handover';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Observable } from 'rxjs';
import { doc, onSnapshot } from '@angular/fire/firestore';
import { DocumentSnapshot } from 'firebase/firestore';

@Component({
  selector: 'app-request-handover',
  templateUrl: './request-handover.page.html',
  styleUrls: ['./request-handover.page.scss'],
})
export class RequestHandoverPage implements OnInit {
  requestId: string;
  request: AdoptionRequest;
  handover: Handover;
  currentUser: User | null;
  currentUserId: string;
  isOwner = false;

  proposedDate: string;
  confirmedDate: string;
  location: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private handoverService: HandoverService,
    private adoptionService: AdoptionService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.requestId = this.route.snapshot.paramMap.get('requestId');
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.currentUserId = user.uid;
        this.authService.getUserData(user.uid).then(currentUser => {
          this.currentUser = currentUser;
        });
      }
    });
    this.loadData();
  }

  async loadData() {
    try {
      const requestDoc = await this.adoptionService.getAdoptionRequest(this.requestId);
      if (requestDoc) {
        this.request = requestDoc as AdoptionRequest;
        if (this.request.handoverId) {
          this.handoverService.getHandover(this.request.handoverId).subscribe((handoverDoc: DocumentSnapshot<Handover>) => {
            if (handoverDoc.exists()) {
              this.handover = handoverDoc.data();
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async requestHandover() {
    try {
      const handoverRef = await this.handoverService.createHandover(this.request, new Date(this.proposedDate));
      await this.adoptionService.linkHandoverToRequest(this.requestId, handoverRef.id);
      this.loadData(); // Refresh data
    } catch (error) {
      console.error("Error requesting handover:", error);
    }
  }

  async confirmHandover() {
    try {
      await this.handoverService.confirmHandover(this.handover.id, new Date(this.confirmedDate), this.location);
      this.loadData(); // Refresh data
    } catch (error) {
      console.error("Error confirming handover:", error);
    }
  }

  async completeHandover() {
    try {
      await this.handoverService.completeHandover(this.handover.id);
      this.loadData(); // Refresh data
    } catch (error) {
      console.error("Error completing handover:", error);
    }
  }

  isAdopter(): boolean {
    return this.request && this.currentUserId === this.request.applicantId;
  }

  isPetOwner(): boolean {
    return this.request && this.currentUserId === this.request.creatorId;
  }
}
