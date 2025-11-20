import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdvancedSearchPageRoutingModule } from './advanced-search-routing.module';

import { AdvancedSearchPage } from './advanced-search.page';
import { CardModule } from '../../components/card/card.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdvancedSearchPageRoutingModule,
    CardModule
  ],
  declarations: [AdvancedSearchPage]
})
export class AdvancedSearchPageModule {}
