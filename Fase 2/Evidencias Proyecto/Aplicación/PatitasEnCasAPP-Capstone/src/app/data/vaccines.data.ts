export interface Vaccine {
  id: string;
  nombre: string;
  tipo: 'core' | 'recomendada' | 'no-core' | string;
  esquema: {
    inicio: string;
    refuerzos: string;
  };
  recomendadoEnChile: boolean;
  comentarioChile?: string;
  notas?: string;
}

export const vaccinesBySpecies: Record<'perro' | 'gato', Vaccine[]> = {
  perro: [
    {
      id: 'dapp',
      nombre: 'DAPP (Moquillo / Hepatitis / Parvovirus / Parainfluenza)',
      tipo: 'core',
      esquema: {
        inicio: '6-8 semanas',
        refuerzos: 'Cada 2-4 semanas hasta 14-16 semanas; refuerzo a los 12 meses; luego 1-3 años según vacuna y fabricante'
      },
      recomendadoEnChile: true,
      comentarioChile: 'Vacuna múltiple estándar; debe incluirse en la rutina de cachorro y continuar con refuerzos según fabricante.'
    },
    {
      id: 'rabia',
      nombre: 'Rabia',
      tipo: 'core (según normativa local)',
      esquema: {
        inicio: '12-16 semanas (según producto y normativa)',
        refuerzos: 'A los 12 meses; luego 1-3 años según vacuna y normativa local'
      },
      recomendadoEnChile: true,
      comentarioChile: 'En Chile muchas comunas exigen o recomiendan la vacuna antirrábica. Verificar con SAG/municipalidad.'
    },
    {
      id: 'lepto',
      nombre: 'Leptospirosis',
      tipo: 'recomendada',
      esquema: {
        inicio: '8-12 semanas (según producto)',
        refuerzos: 'Por lo general anual; en zonas de alto riesgo puede ser semestral'
      },
      recomendadoEnChile: true,
      comentarioChile: 'Recomendada en regiones con riesgo (contacto con roedores/agua estancada). Evaluar exposición local.'
    },
    {
      id: 'bordetella',
      nombre: 'Bordetella bronchiseptica (Tos de las perreras)',
      tipo: 'no-core',
      esquema: {
        inicio: 'Según riesgo y producto (intranasal/oral/parenteral)',
        refuerzos: 'Según producto; en entornos de alto contacto puede requerir refuerzos frecuentes'
      },
      recomendadoEnChile: false,
      comentarioChile: 'Útil para perros en guarderías, refugios, criaderos o actividades con contacto frecuente entre perros.'
    },
    {
      id: 'coronavirus',
      nombre: 'Coronavirus canino (CCoV)',
      tipo: 'no-core',
      esquema: {
        inicio: 'Según producto',
        refuerzos: 'Según fabricante y riesgo'
      },
      recomendadoEnChile: false,
      comentarioChile: 'Vacuna no incluida en esquema core; uso poco frecuente.'
    }
  ],

  gato: [
    {
      id: 'fvrcp',
      nombre: 'FVRCP (Panleucopenia / Rinotraqueítis / Calicivirus)',
      tipo: 'core',
      esquema: {
        inicio: '6-8 semanas',
        refuerzos: 'Cada 2-4 semanas hasta 14-16 semanas; refuerzo a los 12 meses; luego 1-3 años según vacuna y fabricante'
      },
      recomendadoEnChile: true,
      comentarioChile: 'Vacuna básica para todos los gatos; priorizar en kittens y gatos con acceso al exterior.'
    },
    {
      id: 'rabia',
      nombre: 'Rabia',
      tipo: 'core (según normativa/localización)',
      esquema: {
        inicio: '12-16 semanas (según producto y normativa)',
        refuerzos: 'A los 12 meses; luego 1-3 años según vacuna y normativa local'
      },
      recomendadoEnChile: true,
      comentarioChile: 'Recomendado para gatos de exterior; confirmar exigencias municipales y de SAG.'
    },
    {
      id: 'felv',
      nombre: 'Leucemia felina (FeLV)',
      tipo: 'recomendada',
      esquema: {
        inicio: '8-12 semanas (dos dosis con 2-4 semanas de intervalo)',
        refuerzos: 'Refuerzo anual si el gato está en riesgo'
      },
      recomendadoEnChile: true,
      comentarioChile: 'Recomendada para gatos jóvenes y gatos que salen al exterior; testear antes de vacunar en adultos cuando sea posible.'
    },
    {
      id: 'chlamydia',
      nombre: 'Chlamydophila felis',
      tipo: 'no-core',
      esquema: {
        inicio: 'Según producto',
        refuerzos: 'Según producto'
      },
      recomendadoEnChile: false,
      comentarioChile: 'Usada en criaderos o durante brotes respiratorios.'
    },
    {
      id: 'fip',
      nombre: 'Vacuna FIP (Peritonitis infecciosa felina)',
      tipo: 'no-core / controversial',
      esquema: {
        inicio: 'Según producto y criterio veterinario',
        refuerzos: 'Según producto'
      },
      recomendadoEnChile: false,
      comentarioChile: 'No es de uso masivo; eficacia y uso discutido. Consultar con especialista.'
    }
  ]
};
