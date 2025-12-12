import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
import { CardModule } from '../../../../components/card/card.module';
import { PipesModule } from '../../../../pipes/pipes.module';
import { SharedComponentsModule } from '../../../../components/shared-components.module';
import { FilterModalPageModule } from '../filter-modal/filter-modal.module';

const routes: Routes = [{ path: '', component: HomePage }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    CardModule,
    PipesModule,
    SharedComponentsModule,
    FilterModalPageModule
  ],
  declarations: [HomePage]
})
export class HomePageModule { }

