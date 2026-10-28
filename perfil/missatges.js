// Tots els missatges d'error i d'estat de la pàgina de l'explorador, en un sol lloc. Mai no s'hi mostra l'error tècnic.
export const MISSATGES = {
  senseServidor: 'La web encara no està connectada al servidor. Torna-ho a provar més endavant.',
  noCarrega: "Ara mateix no es pot carregar el perfil. Torna-ho a provar d'aquí a una estona.",
  noTrobat: 'No hi ha cap explorador amb aquest nom.',
  senseDades: "Ara mateix no es poden carregar el mapa ni les comarques. Torna-ho a provar d'aquí a una estona.",
  cercaFalla: "Ara mateix no es pot buscar. Torna-ho a provar d'aquí a una estona.",
  cercaCurta: 'Escriu com a mínim 3 lletres del nom.',
  cercaCaracters: 'Els noms d\'usuari només tenen lletres sense accents, xifres i _.',
  cercaBuida: 'No hi ha cap explorador que comenci així.',
  ranquingFalla: "Ara mateix no es pot carregar el rànquing. Torna-ho a provar d'aquí a una estona.",
  ranquingBuit: 'Encara no hi ha cap explorador que comparteixi la seva posició.',
  nomesNom: 'Aquest explorador de moment només comparteix el seu nom.',
  privatParcial: 'És un compte privat: només es veu el que ha triat compartir.',
};

/** L'error que es pot ensenyar: el missatge del servidor no surt mai a la pàgina. */
export class ErrorPerfil extends Error {
  constructor(clau) {
    super(MISSATGES[clau]);
    this.clau = clau;
  }
}
