import { Injectable } from '@angular/core';
import { vaccinesBySpecies, Vaccine } from '../data/vaccines.data';

@Injectable({ providedIn: 'root' })
export class VaccinesService {
  constructor() {}

  getAll(): Record<'perro' | 'gato', Vaccine[]> {
    return vaccinesBySpecies;
  }

  getBySpecies(species: 'perro' | 'gato'): Vaccine[] {
    return vaccinesBySpecies[species] || [];
  }

  findById(species: 'perro' | 'gato', id: string): Vaccine | undefined {
    return this.getBySpecies(species).find(v => v.id === id);
  }
}
