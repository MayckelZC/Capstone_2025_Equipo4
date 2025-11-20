import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PetsService } from 'src/app/services/pets.service';
import { VaccinesService } from 'src/app/services/vaccines.service';
import { Adopcion } from 'src/app/models/Adopcion';
import { Vaccine } from 'src/app/data/vaccines.data';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-vaccines',
  templateUrl: './vaccines.page.html',
  styleUrls: ['./vaccines.page.scss'],
})
export class VaccinesPage implements OnInit {
  pets$: Observable<Adopcion[]> = of([]);
  selectedPetId: string | null = null;
  pet: Adopcion | null = null;
  species: 'perro' | 'gato' = 'perro';
  vaccines: Vaccine[] = [];

  constructor(
    private petsService: PetsService,
    private vaccinesService: VaccinesService
  ) {}

  ngOnInit() {
    this.pets$ = this.petsService.getAllPets();
  }

  onPetChange() {
    if (!this.selectedPetId) {
      this.pet = null;
      this.vaccines = [];
      return;
    }

    this.petsService.getPet(this.selectedPetId).pipe(take(1)).subscribe(p => {
      if (p) {
        this.pet = p;
        this.species = this.normalizeSpecies(p.tipoMascota);
        this.loadVaccines();
      }
    });
  }

  normalizeSpecies(tipo: string | undefined): 'perro' | 'gato' {
    if (!tipo) return 'perro';
    const t = tipo.toLowerCase();
    if (t.includes('gato') || t.includes('felino')) return 'gato';
    return 'perro';
  }

  loadVaccines() {
    this.vaccines = this.vaccinesService.getBySpecies(this.species);
  }

  isApplied(vacId: string): { applied: boolean; date?: any } {
    if (!this.pet || !(this as any).pet.vacunas) return { applied: false };
    const rec = (this as any).pet.vacunas.find((v: any) => v.id === vacId);
    return rec ? { applied: !!rec.applied, date: rec.date } : { applied: false };
  }

  async toggleApplied(vac: Vaccine, applied: boolean) {
    if (!this.pet) return;
    const current = (this as any).pet.vacunas || [];
    const idx = current.findIndex((v: any) => v.id === vac.id);
    if (idx >= 0) {
      current[idx].applied = applied;
      if (!applied) current[idx].date = null;
    } else {
      current.push({ id: vac.id, applied, date: applied ? new Date().toISOString() : null });
    }

    try {
      await this.petsService.updatePet(this.pet.id, { vacunas: current });
      // refresh local pet
      this.pet.vacunas = current as any;
    } catch (err) {
      console.error('Error updating pet vaccines', err);
    }
  }

  async setAppliedDate(vacId: string, isoDate: string | string[]) {
    if (!this.pet) return;
    const current = (this as any).pet.vacunas || [];
    const idx = current.findIndex((v: any) => v.id === vacId);
    // Normalize isoDate which may be string or string[] (ion-datetime can return array)
    let dateStr: string | null = null;
    if (Array.isArray(isoDate)) {
      dateStr = isoDate.length > 0 ? String(isoDate[0]) : null;
    } else if (isoDate) {
      dateStr = String(isoDate);
    }

    if (idx >= 0) {
      current[idx].date = dateStr;
    } else {
      current.push({ id: vacId, applied: true, date: dateStr });
    }

    try {
      await this.petsService.updatePet(this.pet.id, { vacunas: current });
      this.pet.vacunas = current as any;
    } catch (err) {
      console.error('Error updating vaccine date', err);
    }
  }

  /**
   * Normalize stored date value to an ISO string suitable for ion-datetime [value].
   */
  getAppliedDate(vacId: string): string | undefined {
    if (!this.pet || !(this as any).pet.vacunas) return undefined;
    const rec = (this as any).pet.vacunas.find((v: any) => v.id === vacId);
    if (!rec || !rec.date) return undefined;
    const d = rec.date;
    // If it's already a string, return it. If Date, return ISO. If array, take first string element.
    if (Array.isArray(d)) {
      return d.length > 0 ? String(d[0]) : undefined;
    }
    if (d instanceof Date) return d.toISOString();
    return typeof d === 'string' ? d : String(d);
  }
}
