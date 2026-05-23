import type { Place } from '../types';
import { sicilyBarsPubs } from './sicilyBarsPubs';
import { sicilyNightclubs } from './sicilyNightclubs';
import { sicilyOsmVenues } from './sicilyOsmVenues';

const img = (fileName: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=900`;
const DEFAULT_SOURCE_URL = 'https://en.wikipedia.org/wiki/Sicily';
const DEFAULT_IMAGE_CREDIT = 'Wikimedia Commons';

const PROVINCE_FALLBACK_IMAGE: Record<string, string> = {
  PA: img('Mondello palermo.jpg'),
  CT: img('Catania - Piazza Stesicoro.jpg'),
  ME: img('Taormina Piazza IX Aprile 8-2-21.jpg'),
  TP: img('Trapani.jpg'),
  AG: img('Valle dei Templi Agrigento.jpg'),
  CL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Caltanissetta_Panorama_2018.jpg/900px-Caltanissetta_Panorama_2018.jpg',
  EN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Enna_Alta_%281356824462%29.jpg/900px-Enna_Alta_%281356824462%29.jpg',
  SR: img('Ortigia.jpg'),
  RG: img('Ragusa Ibla.jpg'),
};

// I luoghi specifici (locali nominati) restano senza imageUrl così la UI mostra
// una "brand card" col nome del locale invece di una foto generica fuorviante.
// Le aree geografiche (lungomare, piazze, isole) tengono la foto Wikimedia
// quando esplicitamente impostata.
const enrichPlaceMedia = (place: Place): Place => ({
  ...place,
  imageCredit: place.imageCredit ?? (place.imageUrl ? DEFAULT_IMAGE_CREDIT : undefined),
  sourceUrl: place.sourceUrl ?? (place.imageUrl ? DEFAULT_SOURCE_URL : undefined),
});

// Filtro nomi "Camera di Commercio" — ragioni sociali estratte da directory
// invece di nomi reali del locale visibili al cliente.
// Esempi rifiutati: "Tizio S.n.c. di Caio", "Mario & C.", "di Rossi Giovanni".
const BUSINESS_NAME_PATTERNS = [
  /\bS\.\s*n\.\s*c\./i,
  /\bS\.\s*r\.\s*l\./i,
  /\bS\.\s*a\.\s*s\./i,
  /\bS\.\s*p\.\s*a\./i,
  /\bS\.\s*c\.\s*a\.\s*r\.\s*l\./i,
  /\b&\s*C\.?/,
  /\bdi\s+[A-ZÀ-Ý][a-zà-ÿ']+(?:'\s|\s)+[A-ZÀ-Ý][a-zà-ÿ']+/,
  /\bdi\s+[A-ZÀ-Ý][a-zà-ÿ']+\s+&\s+[A-ZÀ-Ý][a-zà-ÿ']+/,
];

function looksLikeRagioneSociale(name: string): boolean {
  return BUSINESS_NAME_PATTERNS.some((re) => re.test(name));
}

const coreSicilyPlaces: Place[] = [
  {
    id: 'place-pa-vucciria',
    name: 'Vucciria / Piazza Caracciolo',
    category: 'Movida market',
    description: 'Il classico punto di ritrovo palermitano dopo cena: street food, drink veloci, piazza piena e flusso continuo fino a tardi.',
    city: 'Palermo', province: 'PA', region: 'Sicilia', country: 'Italia', latitude: 38.1175, longitude: 13.3631, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['movida', 'street food', 'after midnight'], imageUrl: img('Mercato Vucciria, Castellammare, Palermo, Sicily, Italy - panoramio (1).jpg'), imageCredit: 'Wikimedia Commons / trolvag / CC BY-SA 3.0', sourceUrl: 'https://www.apartmentincatania.com/en/catania-nightlife/', popularityScore: 146, isActive: true, factoid: 'La Vucciria nasce come mercato arabo del IX secolo. Oggi la piazza è il salotto notturno di Palermo: si beve in piedi e si urla.',
  },
  {
    id: 'place-pa-santanna',
    name: "Piazza Sant'Anna / Champagneria",
    category: 'Piazza',
    description: 'Zona compatta tra cocktail bar e piazzette: ideale per capire subito se Palermo centro e acceso.',
    city: 'Palermo', province: 'PA', region: 'Sicilia', country: 'Italia', latitude: 38.1156, longitude: 13.3646, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['cocktail', 'piazza', 'centro storico'], imageUrl: img("Piazza sant'anna, concerto roy paci.jpg"), imageCredit: 'Wikimedia Commons / Dedda71 / CC BY 3.0', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 104, isActive: true,
  },
  {
    id: 'place-pa-mondello',
    name: 'Mondello lungomare',
    category: 'Beach bars',
    description: 'Spiaggia, passeggio e locali sul mare: in estate e il radar piu immediato per gruppi e serate leggere.',
    city: 'Palermo', province: 'PA', region: 'Sicilia', country: 'Italia', latitude: 38.2046, longitude: 13.3235, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['mare', 'summer', 'aperitivo'], imageUrl: img('Mondello palermo.jpg'), imageCredit: 'Wikimedia Commons / Dedda71 / CC BY 3.0', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 95, isActive: true, factoid: 'Mondello era una palude bonificata a inizio Novecento. Lo stabilimento liberty è del 1913: ancora oggi è il salotto del mare a Palermo.',
  },
  {
    id: 'place-pa-cefalu',
    name: 'Cefalu centro e lungomare',
    category: 'Borgo mare',
    description: 'Passeggio pieno, locali sul lungomare e centro storico compatto: molto frequentato nei weekend e in alta stagione.',
    city: 'Cefalu', province: 'PA', region: 'Sicilia', country: 'Italia', latitude: 38.0394, longitude: 14.0229, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['beach town', 'passeggio', 'weekend'], imageUrl: img('Cefalu Beach BW 2012-10-11 15-12-24 1.jpg'), imageCredit: 'Wikimedia Commons / Berthold Werner / CC BY-SA 3.0', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 88, isActive: true,
  },
  {
    id: 'place-pa-terrasini',
    name: 'Terrasini Piazza Duomo',
    category: 'Piazza mare',
    description: 'Piazza e locali vicini al mare, molto usata come alternativa occidentale a Palermo per aperitivi e serate estive.',
    city: 'Terrasini', province: 'PA', region: 'Sicilia', country: 'Italia', latitude: 38.1464, longitude: 13.0836, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['piazza', 'mare', 'aperitivo'], imageUrl: img('Torre Alba (Terrasini) 02.jpg'), imageCredit: 'Wikimedia Commons / Superchilum / CC BY-SA 4.0', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 42, isActive: true,
  },
  {
    id: 'place-ct-teatro-massimo',
    name: 'Piazza Teatro Massimo Bellini',
    category: 'Nightlife hub',
    description: 'Il cuore della movida catanese: bar hopping, musica, studenti universitari e locali raggiungibili a piedi.',
    city: 'Catania', province: 'CT', region: 'Sicilia', country: 'Italia', latitude: 37.5064, longitude: 15.0915, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['studenti', 'bar hopping', 'musica'], imageUrl: img('Teatro Massimo Vincenzo Bellini, Catania, Sicily - Italy 2008.JPG'), imageCredit: 'Wikimedia Commons / Jacopo Werther / CC BY-SA 3.0', sourceUrl: 'https://www.apartmentincatania.com/en/catania-nightlife/', popularityScore: 132, isActive: true,
  },
  {
    id: 'place-ct-san-berillo',
    name: 'San Berillo district',
    category: 'Creative nightlife',
    description: 'Quartiere alternativo e artistico, con cocktail bar, street art e atmosfera piu sperimentale rispetto alle piazze classiche.',
    city: 'Catania', province: 'CT', region: 'Sicilia', country: 'Italia', latitude: 37.5076, longitude: 15.0901, timezone: 'Europe/Rome', heroColor: '#c2ff45', vibeTags: ['alternative', 'street art', 'cocktail'], imageUrl: img('Catania - Piazza Stesicoro.jpg'), imageCredit: 'Wikimedia Commons / Luca Aless / CC BY-SA 4.0', sourceUrl: 'https://www.citymapsicilia.it/en/guide/through-san-berillo/', popularityScore: 86, isActive: true,
  },
  {
    id: 'place-ct-aci-trezza',
    name: 'Aci Trezza lungomare',
    category: 'Lungomare',
    description: 'Ritrovo sul mare con locali, passeggio e vista Faraglioni: molto scelto quando Catania si sposta verso la costa.',
    city: 'Aci Trezza', province: 'CT', region: 'Sicilia', country: 'Italia', latitude: 37.5608, longitude: 15.1606, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['mare', 'passeggio', 'cocktail'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg/900px-Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 64, isActive: true,
  },
  {
    id: 'place-ct-playa',
    name: 'La Playa beach clubs',
    category: 'Beach club',
    description: 'La fascia estiva dei beach club catanesi: serate, dj set e gruppi che si muovono dal centro verso il mare.',
    city: 'Catania', province: 'CT', region: 'Sicilia', country: 'Italia', latitude: 37.4669, longitude: 15.0899, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['beach club', 'dj set', 'summer'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg/900px-Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.apartmentincatania.com/en/catania-nightlife/', popularityScore: 78, isActive: true,
  },
  {
    id: 'place-ct-acireale',
    name: 'Acireale Piazza Duomo',
    category: 'Centro storico',
    description: 'Piazza centrale, bar e passeggio: buona scelta per serate piu locali tra Catania, Etna e costa ionica.',
    city: 'Acireale', province: 'CT', region: 'Sicilia', country: 'Italia', latitude: 37.6128, longitude: 15.1658, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['piazza', 'locals', 'aperitivo'], imageUrl: img('Acireale, piazza del duomo.JPG'), imageCredit: 'Wikimedia Commons / Sailko / CC BY-SA 3.0', sourceUrl: 'https://www.apartmentincatania.com/en/catania-nightlife/', popularityScore: 52, isActive: true,
  },
  {
    id: 'place-me-taormina',
    name: 'Taormina Piazza IX Aprile',
    category: 'Upscale walk',
    description: 'La serata piu scenografica della provincia: cocktail, passeggio elegante e flusso turistico alto.',
    city: 'Taormina', province: 'ME', region: 'Sicilia', country: 'Italia', latitude: 37.8528, longitude: 15.2864, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['upscale', 'passeggio', 'view'], imageUrl: img('Taormina Piazza IX Aprile 8-2-21.jpg'), imageCredit: 'Wikimedia Commons / Jeanne Griffin / CC BY-SA 4.0', sourceUrl: 'https://www.apartmentincatania.com/en/catania-nightlife/', popularityScore: 127, isActive: true,
  },
  {
    id: 'place-me-giardini-naxos',
    name: 'Giardini Naxos lungomare',
    category: 'Beach nightlife',
    description: 'Lungomare molto frequentato sotto Taormina, con lidi, bar e gruppi che restano sul mare fino a tardi.',
    city: 'Giardini Naxos', province: 'ME', region: 'Sicilia', country: 'Italia', latitude: 37.8276, longitude: 15.2675, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['lidi', 'mare', 'estate'], imageUrl: img('Ferragosto Giardini Naxos 2021.jpg'), imageCredit: 'Wikimedia Commons / Jeanne Griffin / CC BY-SA 4.0', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 76, isActive: true,
  },
  {
    id: 'place-me-milazzo',
    name: 'Milazzo marina e porto',
    category: 'Marina',
    description: 'Bar, porto e partenza/ritorno dalle Eolie: molto attiva nei weekend estivi e nelle sere di rientro.',
    city: 'Milazzo', province: 'ME', region: 'Sicilia', country: 'Italia', latitude: 38.2212, longitude: 15.2415, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['marina', 'eolie', 'weekend'], imageUrl: img('Milazzo.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 58, isActive: true,
  },
  {
    id: 'place-me-capo-orlando',
    name: "Capo d'Orlando lungomare",
    category: 'Lungomare',
    description: 'Passeggio, locali e lidi sul Tirreno: riferimento serale per la costa nord della provincia.',
    city: "Capo d'Orlando", province: 'ME', region: 'Sicilia', country: 'Italia', latitude: 38.1565, longitude: 14.7458, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['lungomare', 'lidi', 'locals'], imageUrl: img('Santuario capo d orlando d.jpg'), imageCredit: 'Wikimedia Commons / CC BY-SA 2.5', sourceUrl: 'https://www.movidasicilia.it/', popularityScore: 45, isActive: true,
  },
  {
    id: 'place-me-panarea',
    name: 'Panarea porto San Pietro',
    category: 'Island nightlife',
    description: 'La meta eoliana piu mondana: aperitivi, bar vista mare e serate ad alta densita in alta stagione.',
    city: 'Panarea', province: 'ME', region: 'Sicilia', country: 'Italia', latitude: 38.6384, longitude: 15.0774, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['isola', 'upscale', 'estate'], imageUrl: img('StromboliFromPanarea.JPG'), imageCredit: 'Wikimedia Commons / CC BY 2.5', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 84, isActive: true,
  },
  {
    id: 'place-tp-san-vito',
    name: 'San Vito Lo Capo centro e spiaggia',
    category: 'Beach town',
    description: 'Estate molto affollata tra spiaggia, bar del centro, musica live e passeggio serale.',
    city: 'San Vito Lo Capo', province: 'TP', region: 'Sicilia', country: 'Italia', latitude: 38.1741, longitude: 12.7359, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['beach', 'summer', 'live music'], imageUrl: img('San Vito Lo Capo (1).jpg'), imageCredit: 'Wikimedia Commons / Roberto Fontana / CC BY 2.0', sourceUrl: 'https://www.itregolfi.com/en/what-to-do-in-san-vito-lo-capo-blog/san-vito-lo-capo-nightlife/', popularityScore: 115, isActive: true,
  },
  {
    id: 'place-tp-favignana',
    name: 'Favignana Piazza Madrice',
    category: 'Island square',
    description: "Piazza e porto si riempiono dopo mare e cena: ideale per capire dove si concentra l'isola.",
    city: 'Favignana', province: 'TP', region: 'Sicilia', country: 'Italia', latitude: 37.9303, longitude: 12.3282, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['egadi', 'piazza', 'mare'], imageUrl: img('PiazzaMatrice.jpg'), imageCredit: 'Wikimedia Commons / Jakub Jodlowski / CC BY-SA 4.0', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 91, isActive: true,
  },
  {
    id: 'place-tp-trapani',
    name: 'Trapani centro storico',
    category: 'Centro storico',
    description: 'Tra porto, via Torrearsa e locali del centro: la base piu comoda per serate urbane nella provincia.',
    city: 'Trapani', province: 'TP', region: 'Sicilia', country: 'Italia', latitude: 38.0176, longitude: 12.5362, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['centro', 'porto', 'cocktail'], imageUrl: img('Trapani.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.itregolfi.com/en/what-to-do-in-san-vito-lo-capo-blog/san-vito-lo-capo-nightlife/', popularityScore: 67, isActive: true,
  },
  {
    id: 'place-tp-marsala',
    name: 'Marsala centro storico',
    category: 'Wine bar',
    description: 'Piazze, enoteche e cocktail bar: piu elegante e diffusa, ma molto viva nei weekend.',
    city: 'Marsala', province: 'TP', region: 'Sicilia', country: 'Italia', latitude: 37.7986, longitude: 12.4362, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['wine bar', 'centro', 'weekend'], imageUrl: img('Marsala.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.movidasicilia.it/', popularityScore: 61, isActive: true,
  },
  {
    id: 'place-tp-castellammare',
    name: 'Castellammare del Golfo marina',
    category: 'Marina',
    description: 'Porticciolo, ristoranti e locali: molto scelto da gruppi tra costa, Scopello e San Vito.',
    city: 'Castellammare del Golfo', province: 'TP', region: 'Sicilia', country: 'Italia', latitude: 38.0266, longitude: 12.8815, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['marina', 'aperitivo', 'summer'], imageUrl: img('Marina di Castellammare del Golfo - Panorama.jpg'), imageCredit: 'Wikimedia Commons / Daniele Pugliesi / CC BY-SA 3.0', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 54, isActive: true,
  },
  {
    id: 'place-ag-san-leone',
    name: 'San Leone lungomare',
    category: 'Lungomare',
    description: 'Il punto serale piu immediato di Agrigento: lidi, bar e passeggio sul mare dopo cena.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2617, longitude: 13.5852, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['mare', 'lidi', 'agrigento'], imageUrl: img('San Leone Agrigento.JPG'), imageCredit: 'Vista lungomare · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/Category:San_Leone_(Agrigento)', popularityScore: 72, isActive: true, factoid: 'A San Leone le serate iniziano alle 22 e finiscono all\'alba: chioschi, lidi e passeggiate sul molo Vivaldi.',
  },
  {
    id: 'place-ag-scala-turchi',
    name: 'Scala dei Turchi / Realmonte',
    category: 'Sunset beach',
    description: 'Tramonto, beach bar e flussi turistici fortissimi: ottimo segnale per serate estive in zona Realmonte.',
    city: 'Realmonte', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2908, longitude: 13.4728, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['sunset', 'beach', 'tourism'], imageUrl: img('Scala dei Turchi.jpg'), imageCredit: 'Scala dei Turchi · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Scala_dei_Turchi', popularityScore: 69, isActive: true, factoid: 'Il nome "Scala dei Turchi" viene dalle incursioni saracene del XVI secolo: la falesia di marna bianca era il loro punto di sbarco.',
  },
  {
    id: 'place-ag-sciacca',
    name: 'Sciacca porto e centro',
    category: 'Porto',
    description: 'Porto, centro storico e locali stagionali: uno dei poli piu vivi della costa agrigentina.',
    city: 'Sciacca', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.5061, longitude: 13.0832, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['porto', 'centro', 'summer'], imageUrl: img('Sciacca port - panoramio.jpg'), imageCredit: 'Porto di Sciacca · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Sciacca', popularityScore: 48, isActive: true,
  },
  {
    id: 'place-ag-lampedusa',
    name: 'Lampedusa Via Roma',
    category: 'Island center',
    description: "La via serale dell'isola: passeggio, bar e rientri dal mare concentrano quasi tutti qui.",
    city: 'Lampedusa', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 35.5019, longitude: 12.6098, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['isola', 'passeggio', 'estate'], imageUrl: img('SPIAGGIA DEI CONIGLI LAMPEDUSA 2.jpg'), imageCredit: 'Spiaggia dei Conigli · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Lampedusa', popularityScore: 83, isActive: true,
  },
  {
    id: 'place-ag-porto-empedocle',
    name: 'Porto Empedocle marina',
    category: 'Marina',
    description: 'Porto, passeggio e ristorazione: alternativa serale tra Agrigento, Scala dei Turchi e San Leone.',
    city: 'Porto Empedocle', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2899, longitude: 13.5269, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['marina', 'food', 'coast'], imageUrl: img('Porto Empedocle - Torre di Carlo V.jpg'), imageCredit: 'Torre di Carlo V sul porto · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Porto_Empedocle', popularityScore: 35, isActive: true,
  },
  {
    id: 'place-ag-san-leone-oceanomare',
    name: 'Oceanomare',
    category: 'Beach lounge',
    description: 'Storico chiosco-lounge sul lungomare di San Leone: aperitivo, cocktail e musica fronte mare.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2613, longitude: 13.5818, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['lounge', 'lungomare', 'aperitivo'], popularityScore: 81, isActive: true, factoid: 'Oceanomare è uno dei capisaldi del lungomare: aperitivo lento al tramonto, musica live d\'estate.',
  },
  {
    id: 'place-ag-san-leone-la-terza',
    name: 'La Terza',
    category: 'Beach lounge',
    description: 'Chiosco-lounge storico sulla terza spiaggia di San Leone: musica, cocktail e movida estiva.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2594, longitude: 13.5915, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['lounge', 'beach', 'estate'], popularityScore: 78, isActive: true, factoid: 'La "terza spiaggia" di San Leone deve il nome alle tre lingue di sabbia oltre il porticciolo: La Terza è la più affollata.',
  },
  {
    id: 'place-ag-san-leone-la-rotta',
    name: 'La Rotta',
    category: 'Cocktail bar',
    description: 'Cocktail bar di riferimento del lungomare San Leone: serate piene da maggio a settembre.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2603, longitude: 13.5873, timezone: 'Europe/Rome', heroColor: '#c2ff45', vibeTags: ['cocktail', 'lungomare', 'estate'], popularityScore: 74, isActive: true,
  },
  {
    id: 'place-ag-san-leone-tropical-bar',
    name: 'Tropical Bar',
    category: 'Cocktail bar',
    description: 'Cocktail bar storico del lungomare San Leone: serate piene e ritrovo classico delle estati agrigentine.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2585, longitude: 13.5940, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['cocktail', 'lungomare', 'san leone'], popularityScore: 73, isActive: true,
  },
  {
    id: 'place-ag-san-leone-holiday-park',
    name: 'Holiday Park',
    category: 'Beach club',
    description: 'Lido e beach club di San Leone: piscina, musica e cocktail dal pomeriggio fino a tarda sera.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2578, longitude: 13.5961, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['beach club', 'piscina', 'san leone'], popularityScore: 76, isActive: true,
  },
  {
    id: 'place-ag-mia-garden',
    name: 'Mia Garden',
    category: 'Discoteca',
    description: 'Discoteca-garden della zona Agrigento: pista all\'aperto, dj set e una delle serate piu seguite dell\'estate.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2706, longitude: 13.6080, timezone: 'Europe/Rome', heroColor: '#c2ff45', vibeTags: ['discoteca', 'garden', 'dj set'], popularityScore: 85, isActive: true,
  },
  {
    id: 'place-ag-koveed',
    name: 'Koveed',
    category: 'Discoteca',
    description: 'Discoteca della zona Agrigento: pista, dj set e serate piene nei weekend e in estate.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2641, longitude: 13.5880, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['discoteca', 'dj set', 'nightlife'], popularityScore: 79, isActive: true,
  },
  {
    id: 'place-ag-fabrik',
    name: 'Fabrik',
    category: 'Discoteca',
    description: 'Discoteca-fabbrica nella provincia di Agrigento: pista grande, dj internazionali e serate a tema.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2885, longitude: 13.5740, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['discoteca', 'dj', 'industrial'], popularityScore: 88, isActive: true,
  },
  {
    id: 'place-ag-acquaselz',
    name: 'Acquaselz',
    category: 'Beach club',
    description: 'Lido e beach club della costa agrigentina: piscina, aperitivo e serate musicali sul mare.',
    city: 'Agrigento', province: 'AG', region: 'Sicilia', country: 'Italia', latitude: 37.2599, longitude: 13.5995, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['beach club', 'piscina', 'lungomare'], popularityScore: 72, isActive: true,
  },
  {
    id: 'place-cl-piazza-garibaldi',
    name: 'Caltanissetta Piazza Garibaldi',
    category: 'Centro',
    description: 'Il punto piu naturale per capire se il centro e vivo: bar, passeggio e gruppi locali.',
    city: 'Caltanissetta', province: 'CL', region: 'Sicilia', country: 'Italia', latitude: 37.4914, longitude: 14.0624, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['centro', 'locals', 'piazza'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Caltanissetta_Panorama_2018.jpg/900px-Caltanissetta_Panorama_2018.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.movidasicilia.it/', popularityScore: 39, isActive: true,
  },
  {
    id: 'place-cl-lanificium',
    name: 'Lanificium 93100',
    category: 'Cocktail spot',
    description: 'Locale citato nelle guide locali di movida: utile per intercettare serate e aperitivi a Caltanissetta.',
    city: 'Caltanissetta', province: 'CL', region: 'Sicilia', country: 'Italia', latitude: 37.4909, longitude: 14.0621, timezone: 'Europe/Rome', heroColor: '#c2ff45', vibeTags: ['cocktail', 'aperitivo', 'locals'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Caltanissetta_Panorama_2018.jpg/900px-Caltanissetta_Panorama_2018.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.movidasicilia.it/', popularityScore: 31, isActive: true,
  },
  {
    id: 'place-cl-gela',
    name: 'Gela lungomare',
    category: 'Lungomare',
    description: 'Passeggio serale, lidi e bar estivi: il punto piu affollato della costa nissena.',
    city: 'Gela', province: 'CL', region: 'Sicilia', country: 'Italia', latitude: 37.0742, longitude: 14.2404, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['mare', 'lidi', 'passeggio'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Gela_Panorama.png/900px-Gela_Panorama.png', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 47, isActive: true,
  },
  {
    id: 'place-cl-mussomeli',
    name: 'Mussomeli centro',
    category: 'Borgo',
    description: "Centro storico e ritrovi locali: utile per coprire l'area interna della provincia.",
    city: 'Mussomeli', province: 'CL', region: 'Sicilia', country: 'Italia', latitude: 37.5804, longitude: 13.7546, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['borgo', 'locals', 'interno'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Mussomeli_Panorama.jpg/900px-Mussomeli_Panorama.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 20, isActive: true,
  },
  {
    id: 'place-cl-niscemi',
    name: 'Niscemi centro',
    category: 'Centro',
    description: 'Piazza e bar di paese, scelti per serate locali e ritrovi prima di spostarsi verso Gela o Caltanissetta.',
    city: 'Niscemi', province: 'CL', region: 'Sicilia', country: 'Italia', latitude: 37.1488, longitude: 14.3862, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['centro', 'locals', 'pre-serata'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Niscemi.jpg/900px-Niscemi.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 24, isActive: true,
  },
  {
    id: 'place-en-piazza-vittorio',
    name: 'Enna centro alto',
    category: 'Centro storico',
    description: 'Bar e passeggio nel centro alto: il riferimento piu semplice per capire se Enna si sta muovendo.',
    city: 'Enna', province: 'EN', region: 'Sicilia', country: 'Italia', latitude: 37.5656, longitude: 14.2754, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['centro', 'locals', 'alta quota'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Enna_Alta_%281356824462%29.jpg/900px-Enna_Alta_%281356824462%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.movidasicilia.it/', popularityScore: 32, isActive: true,
  },
  {
    id: 'place-en-al-kenisa',
    name: 'Al Kenisa Caffe Letterario',
    category: 'Pub letterario',
    description: 'Citato tra i locali della provincia: posto da aperitivo, chiacchiere e serata piu raccolta.',
    city: 'Enna', province: 'EN', region: 'Sicilia', country: 'Italia', latitude: 37.5662, longitude: 14.2791, timezone: 'Europe/Rome', heroColor: '#c2ff45', vibeTags: ['pub', 'aperitivo', 'letterario'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Enna_Alta_%281356824462%29.jpg/900px-Enna_Alta_%281356824462%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.movidasicilia.it/', popularityScore: 22, isActive: true,
  },
  {
    id: 'place-en-pergusa',
    name: 'Pergusa lago e autodromo',
    category: 'Event area',
    description: 'Area eventi e ritrovi estivi intorno al lago, utile quando il centro si svuota verso spazi aperti.',
    city: 'Pergusa', province: 'EN', region: 'Sicilia', country: 'Italia', latitude: 37.5178, longitude: 14.3060, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['eventi', 'lago', 'estate'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lago_di_Pergusa.jpg/900px-Lago_di_Pergusa.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 28, isActive: true,
  },
  {
    id: 'place-en-piazza-armerina',
    name: 'Piazza Armerina centro',
    category: 'Centro storico',
    description: 'Passeggio, turismo e bar del centro: uno dei poli piu leggibili della provincia dopo Enna.',
    city: 'Piazza Armerina', province: 'EN', region: 'Sicilia', country: 'Italia', latitude: 37.3844, longitude: 14.3674, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['centro', 'turismo', 'passeggio'], imageUrl: img('Piazza Armerina.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 30, isActive: true,
  },
  {
    id: 'place-en-leonforte',
    name: 'Leonforte centro',
    category: 'Piazza locale',
    description: "Piazze e bar per ritrovi locali nell'area interna, con picchi nelle feste e nei weekend.",
    city: 'Leonforte', province: 'EN', region: 'Sicilia', country: 'Italia', latitude: 37.6410, longitude: 14.3970, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['locals', 'piazza', 'weekend'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Enna_Alta_%281356824462%29.jpg/900px-Enna_Alta_%281356824462%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 18, isActive: true,
  },
  {
    id: 'place-sr-ortigia',
    name: 'Ortigia lungomare e piazze',
    category: 'Historic island',
    description: 'Aperitivi al tramonto, wine bar e passeggio: la zona piu densa e desiderata di Siracusa.',
    city: 'Siracusa', province: 'SR', region: 'Sicilia', country: 'Italia', latitude: 37.0607, longitude: 15.2932, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['aperitivo', 'lungomare', 'wine bar'], imageUrl: img('Ortigia.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 108, isActive: true, factoid: 'Ortigia è un\'isola dentro l\'isola: 1 km² di vicoli barocchi sul mare. Al tramonto al Castello Maniace, di notte vino in piazza Duomo.',
  },
  {
    id: 'place-sr-marzamemi',
    name: 'Marzamemi Piazza Regina Margherita',
    category: 'Borgo mare',
    description: 'Uno dei borghi piu affollati nelle sere estive: cena, drink, foto e passeggio nella piazza.',
    city: 'Marzamemi', province: 'SR', region: 'Sicilia', country: 'Italia', latitude: 36.7426, longitude: 15.1184, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['borgo', 'summer', 'piazza'], imageUrl: img('Marzamemi.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 93, isActive: true,
  },
  {
    id: 'place-sr-fontane-bianche',
    name: 'Fontane Bianche lidi',
    category: 'Beach clubs',
    description: 'Lidi, spiaggia e serate estive: forte concentrazione di gruppi quando Siracusa cerca il mare.',
    city: 'Fontane Bianche', province: 'SR', region: 'Sicilia', country: 'Italia', latitude: 36.9703, longitude: 15.2086, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['beach club', 'summer', 'mare'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg/900px-Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 59, isActive: true,
  },
  {
    id: 'place-sr-noto',
    name: 'Noto Corso Vittorio Emanuele',
    category: 'Passeggio barocco',
    description: 'Corso centrale, cocktail bar e turismo serale: elegante ma molto frequentato in stagione.',
    city: 'Noto', province: 'SR', region: 'Sicilia', country: 'Italia', latitude: 36.8919, longitude: 15.0701, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['barocco', 'passeggio', 'cocktail'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg/900px-Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 68, isActive: true,
  },
  {
    id: 'place-sr-avola',
    name: 'Avola lungomare',
    category: 'Lungomare',
    description: 'Bar, passeggio e lidi: una scelta piu locale tra Siracusa, Noto e Marzamemi.',
    city: 'Avola', province: 'SR', region: 'Sicilia', country: 'Italia', latitude: 36.9084, longitude: 15.1398, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['mare', 'locals', 'aperitivo'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg/900px-Noto_BW_2025-04-26_10-12-43_%28cropped%29.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 43, isActive: true,
  },
  {
    id: 'place-rg-marina',
    name: 'Marina di Ragusa lungomare',
    category: 'Beach nightlife',
    description: 'Uno dei punti estivi piu affollati del sud-est: locali, lidi, passeggio e gruppi sul mare.',
    city: 'Marina di Ragusa', province: 'RG', region: 'Sicilia', country: 'Italia', latitude: 36.7856, longitude: 14.5547, timezone: 'Europe/Rome', heroColor: '#ff7a1a', vibeTags: ['mare', 'lidi', 'summer'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Scicli%2C_Ragusa%2C_Italy.jpg/900px-Scicli%2C_Ragusa%2C_Italy.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 102, isActive: true,
  },
  {
    id: 'place-rg-ibla',
    name: 'Ragusa Ibla Piazza Duomo',
    category: 'Barocco night',
    description: 'Serata piu elegante e fotografica: piazza, locali e passeggio nel cuore di Ibla.',
    city: 'Ragusa', province: 'RG', region: 'Sicilia', country: 'Italia', latitude: 36.9258, longitude: 14.7417, timezone: 'Europe/Rome', heroColor: '#61d095', vibeTags: ['barocco', 'piazza', 'passeggio'], imageUrl: img('Ragusa Ibla.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 63, isActive: true,
  },
  {
    id: 'place-rg-modica',
    name: 'Modica Corso Umberto I',
    category: 'Centro storico',
    description: 'Bar, pasticcerie e passeggio serale: molto frequentato da giovani e turisti nel weekend.',
    city: 'Modica', province: 'RG', region: 'Sicilia', country: 'Italia', latitude: 36.8583, longitude: 14.7600, timezone: 'Europe/Rome', heroColor: '#81a8ff', vibeTags: ['centro', 'dessert', 'weekend'], imageUrl: img('Modica.jpg'), imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 57, isActive: true,
  },
  {
    id: 'place-rg-scicli',
    name: 'Scicli Via Mormino Penna',
    category: 'Centro barocco',
    description: 'Via scenografica, locali e passeggio: una delle serate piu belle della provincia di Ragusa.',
    city: 'Scicli', province: 'RG', region: 'Sicilia', country: 'Italia', latitude: 36.7901, longitude: 14.7064, timezone: 'Europe/Rome', heroColor: '#f3d35b', vibeTags: ['barocco', 'locals', 'cocktail'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Scicli%2C_Ragusa%2C_Italy.jpg/900px-Scicli%2C_Ragusa%2C_Italy.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://www.viandantesiculo.it/serate-movida-sicilia/', popularityScore: 46, isActive: true,
  },
  {
    id: 'place-rg-punta-secca',
    name: 'Punta Secca lungomare',
    category: 'Seaside village',
    description: 'Borgo sul mare, bar e passeggio fotografico: piu tranquillo, ma molto pieno nelle sere estive.',
    city: 'Punta Secca', province: 'RG', region: 'Sicilia', country: 'Italia', latitude: 36.7882, longitude: 14.4925, timezone: 'Europe/Rome', heroColor: '#f26d8f', vibeTags: ['mare', 'borgo', 'summer'], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Scicli%2C_Ragusa%2C_Italy.jpg/900px-Scicli%2C_Ragusa%2C_Italy.jpg', imageCredit: 'Wikimedia Commons', sourceUrl: 'https://en.wikipedia.org/wiki/Sicily', popularityScore: 40, isActive: true,
  },
];

export const sicilyPlaces: Place[] = [...coreSicilyPlaces, ...sicilyBarsPubs, ...sicilyNightclubs, ...sicilyOsmVenues]
  .filter((place) => !looksLikeRagioneSociale(place.name))
  .map(enrichPlaceMedia);
