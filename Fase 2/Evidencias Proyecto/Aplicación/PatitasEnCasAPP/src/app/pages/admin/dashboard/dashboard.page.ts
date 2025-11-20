import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../../../services/user.service';
import { PetsService } from '../../../services/pets.service';
import { AdoptionService } from '../../../services/adoption.service';
// import { DonationService } from '../../../services/donation.service'; // Commented out
import { ReportService } from '../../../services/report.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {

  userCount$: Observable<number>;
  petCount$: Observable<number>;
  adoptionCount$: Observable<number>;
  // donationCount$: Observable<number>; // Commented out
  reportCount$: Observable<number>;
  newUsersThisWeekCount$: Observable<number>;
  newPetsThisWeekCount$: Observable<number>;
  newAdoptionsThisWeekCount$: Observable<number>;
  // newDonationsThisWeekCount$: Observable<number>; // Commented out
  newReportsThisWeekCount$: Observable<number>;

  constructor(
    private userService: UserService,
    private petsService: PetsService,
    private adoptionService: AdoptionService,
    // private donationService: DonationService, // Commented out
    private reportService: ReportService
  ) { }

  ngOnInit() {
    this.userCount$ = this.userService.getUsers().pipe(map(users => users.length));
    this.petCount$ = this.petsService.getCount();
    this.adoptionCount$ = this.adoptionService.getCount();
    // this.donationCount$ = this.donationService.getCount(); // Commented out
    this.reportCount$ = this.reportService.getPendingReportsCount(); // Asumiendo que este método existe
    this.newUsersThisWeekCount$ = this.userService.getNewUsersCountThisWeek();
    this.newPetsThisWeekCount$ = this.petsService.getNewPetsCountThisWeek();
    this.newAdoptionsThisWeekCount$ = this.adoptionService.getNewApprovedAdoptionsCountThisWeek();
    // this.newDonationsThisWeekCount$ = this.donationService.getNewDonationsCountThisWeek(); // Commented out
    this.newReportsThisWeekCount$ = this.reportService.getNewPendingReportsCountThisWeek();
  }
}