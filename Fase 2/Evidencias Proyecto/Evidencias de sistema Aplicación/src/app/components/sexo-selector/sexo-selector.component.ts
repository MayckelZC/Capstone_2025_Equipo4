export class SexoSelectorComponent {
  sexoSeleccionado: string = '';

  seleccionarSexo(sexo: string) {
    this.sexoSeleccionado = sexo;
  }
}
