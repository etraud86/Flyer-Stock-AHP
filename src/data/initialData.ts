import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
} from '../types';

export const INITIAL_FLYER_TYPES: FlyerType[] = [
  {
    id: 'flyer-1',
    sku: 'AHP-MAP-01',
    name: 'Mapa Oficial & Roteiro das 12 Aldeias Históricas',
    category: 'Mapa Geral & Circuito',
    language: 'Multilingual (PT/EN/ES/FR)',
    warehouseStock: 16500,
    minThreshold: 4000,
    unitCost: 0.14,
    color: '#2563eb', // Blue
    description: 'Guia desdobrável com o mapa oficial da rede das 12 Aldeias Históricas de Portugal, vias de acesso e pontos de interesse.',
  },
  {
    id: 'flyer-2',
    sku: 'AHP-GAS-02',
    name: 'Guia de Gastronomia, Sabores & Azeite da Beira',
    category: 'Gastronomia & Vinhos',
    language: 'Português / Espanhol / Inglês',
    warehouseStock: 9200,
    minThreshold: 2500,
    unitCost: 0.18,
    color: '#b91c1c', // Deep red
    description: 'Restaurantes típicos, adegas, queijo da serra, azeite virgem extra, e doces conventuais da região.',
  },
  {
    id: 'flyer-3',
    sku: 'AHP-GR22-03',
    name: 'GR22 Grande Rota das Aldeias Históricas (Caminhada & BTT)',
    category: 'Percursos & Outdoor',
    language: 'Inglês / Francês / Alemão',
    warehouseStock: 7800,
    minThreshold: 3000,
    unitCost: 0.16,
    color: '#0d9488', // Teal
    description: 'Guia técnico e altimétrico dos cerca de 600 km da Grande Rota pedestre e ciclável GR22 com selo Leading Quality Trails.',
  },
  {
    id: 'flyer-4',
    sku: 'AHP-JUD-04',
    name: 'Castelos, Muralhas & Herança Judaica das Beiras',
    category: 'História & Cultura',
    language: 'Multilingual (PT/EN/HE/FR)',
    warehouseStock: 8400,
    minThreshold: 2000,
    unitCost: 0.22,
    color: '#7c3aed', // Purple
    description: 'Centros de interpretação judaica, castelos góticos e manuelinos, e comunas sefarditas históricas.',
  },
  {
    id: 'flyer-5',
    sku: 'AHP-FAM-05',
    name: 'Família, Lendas & Festas Tradicionais',
    category: 'Família & Tradições',
    language: 'Português / Espanhol',
    warehouseStock: 6100,
    minThreshold: 2000,
    unitCost: 0.15,
    color: '#ea580c', // Orange
    description: 'Programas com crianças, lendas e mitos de cada aldeia, e calendário de feiras medievais.',
  },
  {
    id: 'flyer-6',
    sku: 'AHP-NAT-06',
    name: 'Natureza, Geoparques da UNESCO & Fauna Serrana',
    category: 'Natureza & Geoparks',
    language: 'Português / Inglês / Alemão',
    warehouseStock: 6900,
    minThreshold: 1800,
    unitCost: 0.16,
    color: '#15803d', // Green
    description: 'Património geológico, Geopark Naturtejo, Estrela Geopark Mundial da UNESCO e birdwatching.',
  },
];

export const INITIAL_OFFICES: TourismOffice[] = [
  {
    id: 'off-headquarters-ahp',
    code: 'AHP-HQ',
    name: 'Headquarters AHP',
    zone: 'Sede Central AHP (Aldeias Históricas de Portugal)',
    footfallTier: 'High',
    contactPerson: 'Sede Central & Logística AHP',
    email: 'portal.ahp@gmail.com',
    phone: '+351 275 771 450',
    address: 'Rua do Relógio, Sede AHP, 6250-088 Belmonte',
  },
  {
    id: 'off-castelo-novo',
    code: 'AHP-CNOV',
    name: 'Castelo Novo',
    zone: 'Serra da Gardunha (Fundão)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Castelo Novo',
    email: 'turismo.castelonovo@aldeiashistoricasdeportugal.com',
    phone: '+351 275 752 489',
    address: 'Largo da Bica, 6230-160 Castelo Novo',
  },
  {
    id: 'off-almeida',
    code: 'AHP-ALM',
    name: 'Almeida',
    zone: 'Fortaleza Abaluartada (Almeida)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Almeida',
    email: 'turismo.almeida@aldeiashistoricasdeportugal.com',
    phone: '+351 271 574 229',
    address: 'Praça da Liberdade, 6350-130 Almeida',
  },
  {
    id: 'off-castelo-mendo',
    code: 'AHP-CMEN',
    name: 'Castelo Mendo',
    zone: 'Fronteira & Vale do Côa (Almeida)',
    footfallTier: 'Medium',
    contactPerson: 'Posto de Turismo de Castelo Mendo',
    email: 'turismo.castelomendo@aldeiashistoricasdeportugal.com',
    phone: '+351 271 574 140',
    address: 'Porta da Vila, 6350-013 Castelo Mendo',
  },
  {
    id: 'off-monsanto',
    code: 'AHP-MONS',
    name: 'Monsanto',
    zone: 'Aldeia Mais Portuguesa (Idanha-a-Nova)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Monsanto',
    email: 'turismo.monsanto@aldeiashistoricasdeportugal.com',
    phone: '+351 277 314 642',
    address: 'Rua Marquês da Graciosa, 6060-091 Monsanto',
  },
  {
    id: 'off-idanha-a-velha',
    code: 'AHP-IDV',
    name: 'Idanha a Velha',
    zone: 'Egitânia / Geopark (Idanha-a-Nova)',
    footfallTier: 'Medium',
    contactPerson: 'Posto de Turismo de Idanha a Velha',
    email: 'turismo.idanhaavelha@aldeiashistoricasdeportugal.com',
    phone: '+351 277 914 280',
    address: 'Largo do Espírito Santo, 6060-041 Idanha a Velha',
  },
  {
    id: 'off-trancoso',
    code: 'AHP-TRC',
    name: 'Trancoso',
    zone: 'Planalto Beirão / Centro Judaico (Trancoso)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Trancoso',
    email: 'turismo.trancoso@aldeiashistoricasdeportugal.com',
    phone: '+351 271 829 120',
    address: 'Largo D. Dinis, 6420-001 Trancoso',
  },
  {
    id: 'off-marialva',
    code: 'AHP-MAR',
    name: 'Marialva',
    zone: 'Cidadela Medieval (Mêda)',
    footfallTier: 'Medium',
    contactPerson: 'Posto de Turismo de Marialva',
    email: 'turismo.marialva@aldeiashistoricasdeportugal.com',
    phone: '+351 279 883 456',
    address: 'Largo da Praça, 6430-081 Marialva',
  },
  {
    id: 'off-castelo-rodrigo',
    code: 'AHP-CROD',
    name: 'Castelo Rodrigo',
    zone: 'Alto Douro / Riba Côa (Figueira de Castelo Rodrigo)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Castelo Rodrigo',
    email: 'turismo.castelorodrigo@aldeiashistoricasdeportugal.com',
    phone: '+351 271 311 277',
    address: 'Rua do Relógio, 6440-031 Castelo Rodrigo',
  },
  {
    id: 'off-piodao',
    code: 'AHP-PIOD',
    name: 'Piódão',
    zone: 'Serra do Açor / Aldeia Presépio (Arganil)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Piódão',
    email: 'turismo.piodao@aldeiashistoricasdeportugal.com',
    phone: '+351 235 732 787',
    address: 'Largo Cónego Manuel Fernandes Nogueira, 3380-151 Piódão',
  },
  {
    id: 'off-linhares',
    code: 'AHP-LINH',
    name: 'Linhares da Beira',
    zone: 'Serra da Estrela / Capital Parapente (Celorico)',
    footfallTier: 'Medium',
    contactPerson: 'Posto de Turismo de Linhares da Beira',
    email: 'turismo.linhares@aldeiashistoricasdeportugal.com',
    phone: '+351 271 776 397',
    address: 'Largo de São Roque, 6360-080 Linhares da Beira',
  },
  {
    id: 'off-sortelha',
    code: 'AHP-SORT',
    name: 'Sortelha',
    zone: 'Cintura Amuralhada Granítica (Sabugal)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Sortelha',
    email: 'turismo.sortelha@aldeiashistoricasdeportugal.com',
    phone: '+351 271 684 390',
    address: 'Largo do Pelourinho, 6320-530 Sortelha',
  },
  {
    id: 'off-belmonte',
    code: 'AHP-BELM',
    name: 'Belmonte',
    zone: 'Terra de Pedro Álvares Cabral & Judiaria',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Belmonte',
    email: 'turismo.belmonte@aldeiashistoricasdeportugal.com',
    phone: '+351 275 911 488',
    address: 'Avenida Pedro Álvares Cabral, 6250-088 Belmonte',
  },
];

export const INITIAL_DELIVERIES: DeliveryRecord[] = [
  // 0. HEADQUARTERS AHP (Sede Central)
  {
    id: 'del-hq-1',
    deliveryRef: 'DEL-2026-0601-HQ1',
    date: '2026-06-01',
    officeId: 'off-headquarters-ahp',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 3500,
    courier: 'Logística Central AHP',
    notes: 'Acolhimento central de operadores turísticos e delegações.',
    depletedDate: '2026-07-10', // 39 dias
    newRequestDate: '2026-07-10',
  },
  {
    id: 'del-hq-2',
    deliveryRef: 'DEL-2026-0715-HQ2',
    date: '2026-07-15',
    officeId: 'off-headquarters-ahp',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 4000,
    courier: 'Logística Central AHP',
    notes: 'Reforço de época alta de Verão na Sede.',
  },
  {
    id: 'del-hq-3',
    deliveryRef: 'DEL-2026-0615-HQ3',
    date: '2026-06-15',
    officeId: 'off-headquarters-ahp',
    flyerTypeId: 'flyer-2', // Gastronomia & Vinhos
    quantityDelivered: 2000,
    courier: 'Logística Central AHP',
    notes: 'Degustações e promoção de produtos regionais na receção da Sede.',
    depletedDate: '2026-08-05',
    newRequestDate: '2026-08-05',
  },
  {
    id: 'del-hq-4',
    deliveryRef: 'DEL-2026-0808-HQ4',
    date: '2026-08-08',
    officeId: 'off-headquarters-ahp',
    flyerTypeId: 'flyer-2', // Gastronomia & Vinhos
    quantityDelivered: 2200,
    courier: 'Logística Central AHP',
    notes: 'Novo lote de guias gastronómicos.',
  },
  {
    id: 'del-hq-5',
    deliveryRef: 'DEL-2026-0701-HQ5',
    date: '2026-07-01',
    officeId: 'off-headquarters-ahp',
    flyerTypeId: 'flyer-3', // GR22 Grande Rota
    quantityDelivered: 2500,
    courier: 'Logística Central AHP',
    notes: 'Guias da Grande Rota GR22 para caminheiros e ciclistas BTT.',
  },
  // 1. CASTELO NOVO
  {
    id: 'del-cnov-1',
    deliveryRef: 'DEL-2026-0610-01',
    date: '2026-06-10',
    officeId: 'off-castelo-novo',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 1200,
    courier: 'Equipa Logística AHP - Carrinha Beira',
    notes: 'Início da época turística de Verão na Gardunha.',
    depletedDate: '2026-07-15', // 35 dias => 34.3 flyers/dia
    newRequestDate: '2026-07-15',
  },
  {
    id: 'del-cnov-2',
    deliveryRef: 'DEL-2026-0718-01',
    date: '2026-07-18',
    officeId: 'off-castelo-novo',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 1400,
    courier: 'Equipa Logística AHP - Carrinha Beira',
    notes: 'Reforço de verão e passeios pedestres.',
    depletedDate: '2026-08-25', // 38 dias => 36.8 flyers/dia
    newRequestDate: '2026-08-25',
  },
  {
    id: 'del-cnov-3',
    deliveryRef: 'DEL-2026-0827-01',
    date: '2026-08-27',
    officeId: 'off-castelo-novo',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 1000,
    courier: 'Equipa Logística AHP - Carrinha Beira',
    notes: 'Lote ativo. 12 dias decorridos.',
  },
  {
    id: 'del-cnov-4',
    deliveryRef: 'DEL-2026-0720-02',
    date: '2026-07-20',
    officeId: 'off-castelo-novo',
    flyerTypeId: 'flyer-3', // GR22
    quantityDelivered: 600,
    courier: 'Estafeta Regional',
    notes: 'Afluência de caminhantes no trilho Gardunha-Castelo Novo.',
    depletedDate: '2026-08-28',
    newRequestDate: '2026-08-28', // 39 dias decorridos
  },

  // 2. ALMEIDA
  {
    id: 'del-alm-1',
    deliveryRef: 'DEL-2026-0615-02',
    date: '2026-06-15',
    officeId: 'off-almeida',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 1500,
    courier: 'Transporte Regional Riba-Côa',
    depletedDate: '2026-07-20', // 35 dias => 42.8 flyers/dia
    newRequestDate: '2026-07-20',
  },
  {
    id: 'del-alm-2',
    deliveryRef: 'DEL-2026-0722-02',
    date: '2026-07-22',
    officeId: 'off-almeida',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 1800,
    courier: 'Transporte Regional Riba-Côa',
    notes: 'Preparação para a Recriação Histórica do Cerco de Almeida.',
    depletedDate: '2026-08-28', // 37 dias => 48.6 flyers/dia
    newRequestDate: '2026-08-28',
  },
  {
    id: 'del-alm-3',
    deliveryRef: 'DEL-2026-0830-02',
    date: '2026-08-30',
    officeId: 'off-almeida',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1500,
    courier: 'Transporte Regional Riba-Côa',
    notes: 'Lote ativo pós-evento.',
  },
  {
    id: 'del-alm-4',
    deliveryRef: 'DEL-2026-0710-03',
    date: '2026-07-10',
    officeId: 'off-almeida',
    flyerTypeId: 'flyer-4', // Castelos & Judaica
    quantityDelivered: 1000,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-16', // 37 dias => 27 flyers/dia
    newRequestDate: '2026-08-16',
  },

  // 3. CASTELO MENDO
  {
    id: 'del-cmen-1',
    deliveryRef: 'DEL-2026-0620-03',
    date: '2026-06-20',
    officeId: 'off-castelo-mendo',
    flyerTypeId: 'flyer-1', // Mapa
    quantityDelivered: 700,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-01', // 42 dias => 16.6 flyers/dia
    newRequestDate: '2026-08-01',
  },
  {
    id: 'del-cmen-2',
    deliveryRef: 'DEL-2026-0805-03',
    date: '2026-08-05',
    officeId: 'off-castelo-mendo',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 800,
    courier: 'Equipa Logística AHP',
    notes: 'Lote ativo. Distribuição moderada e sustentada.',
  },
  {
    id: 'del-cmen-3',
    deliveryRef: 'DEL-2026-0715-04',
    date: '2026-07-15',
    officeId: 'off-castelo-mendo',
    flyerTypeId: 'flyer-5', // Família & Lendas
    quantityDelivered: 500,
    courier: 'Estafeta Regional',
    depletedDate: '2026-08-25', // 41 dias => 12.2 flyers/dia
    newRequestDate: '2026-08-25',
  },

  // 4. MONSANTO (Elevada Procura - "Aldeia Mais Portuguesa")
  {
    id: 'del-mons-1',
    deliveryRef: 'DEL-2026-0612-04',
    date: '2026-06-12',
    officeId: 'off-monsanto',
    flyerTypeId: 'flyer-1', // Mapa
    quantityDelivered: 2000,
    courier: 'Transporte Expresso Beira Baixa',
    notes: 'Pico de turismo nacional e internacional (House of the Dragon e geoturismo).',
    depletedDate: '2026-07-10', // 28 dias => 71.4 flyers/dia
    newRequestDate: '2026-07-10',
  },
  {
    id: 'del-mons-2',
    deliveryRef: 'DEL-2026-0712-04',
    date: '2026-07-12',
    officeId: 'off-monsanto',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 2500,
    courier: 'Transporte Expresso Beira Baixa',
    depletedDate: '2026-08-14', // 33 dias => 75.7 flyers/dia
    newRequestDate: '2026-08-14',
  },
  {
    id: 'del-mons-3',
    deliveryRef: 'DEL-2026-0816-04',
    date: '2026-08-16',
    officeId: 'off-monsanto',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 2000,
    courier: 'Transporte Expresso Beira Baixa',
    notes: 'Esgotou rapidamente com fluxo de visitantes de final de Agosto!',
    depletedDate: '2026-09-06', // Esgotado há 2 dias!
    newRequestDate: '2026-09-06', // Novo pedido urgente submetido pelo posto
  },
  {
    id: 'del-mons-4',
    deliveryRef: 'DEL-2026-0708-05',
    date: '2026-07-08',
    officeId: 'off-monsanto',
    flyerTypeId: 'flyer-2', // Gastronomia
    quantityDelivered: 1000,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-10', // 33 dias => 30.3 flyers/dia
    newRequestDate: '2026-08-10',
  },
  {
    id: 'del-mons-5',
    deliveryRef: 'DEL-2026-0812-05',
    date: '2026-08-12',
    officeId: 'off-monsanto',
    flyerTypeId: 'flyer-2',
    quantityDelivered: 900,
    courier: 'Equipa Logística AHP',
    // 27 dias decorridos a ~30/dia => restam menos de 90 flyers (Crítico!)
  },

  // 5. IDANHA A VELHA
  {
    id: 'del-idv-1',
    deliveryRef: 'DEL-2026-0625-05',
    date: '2026-06-25',
    officeId: 'off-idanha-a-velha',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 800,
    courier: 'Estafeta Regional Beira Baixa',
    depletedDate: '2026-08-05', // 41 dias => 19.5 flyers/dia
    newRequestDate: '2026-08-05',
  },
  {
    id: 'del-idv-2',
    deliveryRef: 'DEL-2026-0808-05',
    date: '2026-08-08',
    officeId: 'off-idanha-a-velha',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 900,
    courier: 'Estafeta Regional Beira Baixa',
    notes: 'Lote ativo. Visitas guiadas ao arquivo arqueológico e Sé Catedralícia.',
  },
  {
    id: 'del-idv-3',
    deliveryRef: 'DEL-2026-0710-06',
    date: '2026-07-10',
    officeId: 'off-idanha-a-velha',
    flyerTypeId: 'flyer-6', // Geopark & Natureza
    quantityDelivered: 600,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-18', // 39 dias => 15.4 flyers/dia
    newRequestDate: '2026-08-18',
  },

  // 6. TRANCOSO
  {
    id: 'del-trc-1',
    deliveryRef: 'DEL-2026-0618-06',
    date: '2026-06-18',
    officeId: 'off-trancoso',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 1800,
    courier: 'Transporte Beira Alta',
    depletedDate: '2026-07-22', // 34 dias => 52.9 flyers/dia
    newRequestDate: '2026-07-22',
  },
  {
    id: 'del-trc-2',
    deliveryRef: 'DEL-2026-0725-06',
    date: '2026-07-25',
    officeId: 'off-trancoso',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 2000,
    courier: 'Transporte Beira Alta',
    notes: 'Preparação para a Feira de São Bartolomeu.',
    depletedDate: '2026-08-28', // 34 dias => 58.8 flyers/dia
    newRequestDate: '2026-08-28',
  },
  {
    id: 'del-trc-3',
    deliveryRef: 'DEL-2026-0830-06',
    date: '2026-08-30',
    officeId: 'off-trancoso',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1800,
    courier: 'Transporte Beira Alta',
    notes: 'Lote ativo de transição outono.',
  },
  {
    id: 'del-trc-4',
    deliveryRef: 'DEL-2026-0715-07',
    date: '2026-07-15',
    officeId: 'off-trancoso',
    flyerTypeId: 'flyer-4', // Herança Judaica
    quantityDelivered: 1200,
    courier: 'Equipa Logística AHP',
    notes: 'Centro de Interpretação Judaica Isaac Cardoso.',
    depletedDate: '2026-08-20', // 36 dias => 33.3 flyers/dia
    newRequestDate: '2026-08-20',
  },
  {
    id: 'del-trc-5',
    deliveryRef: 'DEL-2026-0822-07',
    date: '2026-08-22',
    officeId: 'off-trancoso',
    flyerTypeId: 'flyer-4',
    quantityDelivered: 1000,
    courier: 'Equipa Logística AHP',
  },

  // 7. MARIALVA
  {
    id: 'del-mar-1',
    deliveryRef: 'DEL-2026-0622-07',
    date: '2026-06-22',
    officeId: 'off-marialva',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 800,
    courier: 'Transporte Regional Mêda',
    depletedDate: '2026-07-30', // 38 dias => 21 flyers/dia
    newRequestDate: '2026-07-30',
  },
  {
    id: 'del-mar-2',
    deliveryRef: 'DEL-2026-0802-07',
    date: '2026-08-02',
    officeId: 'off-marialva',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 900,
    courier: 'Transporte Regional Mêda',
    depletedDate: '2026-09-04', // 33 dias => 27.2 flyers/dia
    newRequestDate: '2026-09-04', // Pedido recebido!
  },
  {
    id: 'del-mar-3',
    deliveryRef: 'DEL-2026-0710-08',
    date: '2026-07-10',
    officeId: 'off-marialva',
    flyerTypeId: 'flyer-4', // Castelos
    quantityDelivered: 600,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-20', // 41 dias => 14.6 flyers/dia
    newRequestDate: '2026-08-20',
  },

  // 8. CASTELO RODRIGO
  {
    id: 'del-crod-1',
    deliveryRef: 'DEL-2026-0615-08',
    date: '2026-06-15',
    officeId: 'off-castelo-rodrigo',
    flyerTypeId: 'flyer-1', // Mapa
    quantityDelivered: 1600,
    courier: 'Transporte Côa & Douro',
    depletedDate: '2026-07-20', // 35 dias => 45.7 flyers/dia
    newRequestDate: '2026-07-20',
  },
  {
    id: 'del-crod-2',
    deliveryRef: 'DEL-2026-0723-08',
    date: '2026-07-23',
    officeId: 'off-castelo-rodrigo',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1800,
    courier: 'Transporte Côa & Douro',
    notes: 'Elevada procura de turistas espanhóis e do Douro.',
    depletedDate: '2026-08-28', // 36 dias => 50 flyers/dia
    newRequestDate: '2026-08-28',
  },
  {
    id: 'del-crod-3',
    deliveryRef: 'DEL-2026-0830-08',
    date: '2026-08-30',
    officeId: 'off-castelo-rodrigo',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1500,
    courier: 'Transporte Côa & Douro',
  },
  {
    id: 'del-crod-4',
    deliveryRef: 'DEL-2026-0712-09',
    date: '2026-07-12',
    officeId: 'off-castelo-rodrigo',
    flyerTypeId: 'flyer-2', // Gastronomia & Vinhos
    quantityDelivered: 1000,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-15', // 34 dias => 29.4 flyers/dia
    newRequestDate: '2026-08-15',
  },

  // 9. PIÓDÃO
  {
    id: 'del-piod-1',
    deliveryRef: 'DEL-2026-0610-09',
    date: '2026-06-10',
    officeId: 'off-piodao',
    flyerTypeId: 'flyer-1', // Mapa
    quantityDelivered: 1500,
    courier: 'Estafeta Serra do Açor',
    depletedDate: '2026-07-18', // 38 dias => 39.4 flyers/dia
    newRequestDate: '2026-07-18',
  },
  {
    id: 'del-piod-2',
    deliveryRef: 'DEL-2026-0720-09',
    date: '2026-07-20',
    officeId: 'off-piodao',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1800,
    courier: 'Estafeta Serra do Açor',
    depletedDate: '2026-08-26', // 37 dias => 48.6 flyers/dia
    newRequestDate: '2026-08-26',
  },
  {
    id: 'del-piod-3',
    deliveryRef: 'DEL-2026-0828-09',
    date: '2026-08-28',
    officeId: 'off-piodao',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1400,
    courier: 'Estafeta Serra do Açor',
    notes: 'Lote ativo. Aldeia de Xisto com grande afluência de fim de semana.',
  },
  {
    id: 'del-piod-4',
    deliveryRef: 'DEL-2026-0715-10',
    date: '2026-07-15',
    officeId: 'off-piodao',
    flyerTypeId: 'flyer-6', // Natureza & Serras
    quantityDelivered: 800,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-20', // 36 dias => 22.2 flyers/dia
    newRequestDate: '2026-08-20',
  },

  // 10. LINHARES DA BEIRA
  {
    id: 'del-linh-1',
    deliveryRef: 'DEL-2026-0618-10',
    date: '2026-06-18',
    officeId: 'off-linhares',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1000,
    courier: 'Transporte Serra da Estrela',
    depletedDate: '2026-07-26', // 38 dias => 26.3 flyers/dia
    newRequestDate: '2026-07-26',
  },
  {
    id: 'del-linh-2',
    deliveryRef: 'DEL-2026-0728-10',
    date: '2026-07-28',
    officeId: 'off-linhares',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1200,
    courier: 'Transporte Serra da Estrela',
    notes: 'Festival de Parapente de Linhares e turismo ativo.',
    depletedDate: '2026-09-02', // 36 dias => 33.3 flyers/dia
    newRequestDate: '2026-09-02', // Pedido para reposição
  },
  {
    id: 'del-linh-3',
    deliveryRef: 'DEL-2026-0712-11',
    date: '2026-07-12',
    officeId: 'off-linhares',
    flyerTypeId: 'flyer-3', // GR22
    quantityDelivered: 700,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-22', // 41 dias => 17 flyers/dia
    newRequestDate: '2026-08-22',
  },

  // 11. SORTELHA
  {
    id: 'del-sort-1',
    deliveryRef: 'DEL-2026-0612-11',
    date: '2026-06-12',
    officeId: 'off-sortelha',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1600,
    courier: 'Transporte Sabugal & Raia',
    depletedDate: '2026-07-18', // 36 dias => 44.4 flyers/dia
    newRequestDate: '2026-07-18',
  },
  {
    id: 'del-sort-2',
    deliveryRef: 'DEL-2026-0720-11',
    date: '2026-07-20',
    officeId: 'off-sortelha',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 2000,
    courier: 'Transporte Sabugal & Raia',
    notes: 'Feira Medieval "Muralhas com História".',
    depletedDate: '2026-08-26', // 37 dias => 54 flyers/dia
    newRequestDate: '2026-08-26',
  },
  {
    id: 'del-sort-3',
    deliveryRef: 'DEL-2026-0828-11',
    date: '2026-08-28',
    officeId: 'off-sortelha',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 1500,
    courier: 'Transporte Sabugal & Raia',
    notes: 'Lote ativo.',
  },
  {
    id: 'del-sort-4',
    deliveryRef: 'DEL-2026-0715-12',
    date: '2026-07-15',
    officeId: 'off-sortelha',
    flyerTypeId: 'flyer-5', // Família & Lendas
    quantityDelivered: 900,
    courier: 'Equipa Logística AHP',
    depletedDate: '2026-08-22', // 38 dias => 23.6 flyers/dia
    newRequestDate: '2026-08-22',
  },

  // 12. BELMONTE
  {
    id: 'del-belm-1',
    deliveryRef: 'DEL-2026-0615-12',
    date: '2026-06-15',
    officeId: 'off-belmonte',
    flyerTypeId: 'flyer-1', // Mapa Oficial
    quantityDelivered: 2200,
    courier: 'Transporte Regional Cova da Beira',
    depletedDate: '2026-07-20', // 35 dias => 62.8 flyers/dia
    newRequestDate: '2026-07-20',
  },
  {
    id: 'del-belm-2',
    deliveryRef: 'DEL-2026-0722-12',
    date: '2026-07-22',
    officeId: 'off-belmonte',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 2500,
    courier: 'Transporte Regional Cova da Beira',
    notes: 'Rede de Museus de Belmonte e Castelo dos Cabrais.',
    depletedDate: '2026-08-26', // 35 dias => 71.4 flyers/dia
    newRequestDate: '2026-08-26',
  },
  {
    id: 'del-belm-3',
    deliveryRef: 'DEL-2026-0828-12',
    date: '2026-08-28',
    officeId: 'off-belmonte',
    flyerTypeId: 'flyer-1',
    quantityDelivered: 2200,
    courier: 'Transporte Regional Cova da Beira',
    notes: 'Lote ativo de transição.',
  },
  {
    id: 'del-belm-4',
    deliveryRef: 'DEL-2026-0708-13',
    date: '2026-07-08',
    officeId: 'off-belmonte',
    flyerTypeId: 'flyer-4', // Herança Judaica & Museus
    quantityDelivered: 1500,
    courier: 'Equipa Logística AHP',
    notes: 'Museu Judaico de Belmonte e Sinagoga Bet Eliahu.',
    depletedDate: '2026-08-12', // 35 dias => 42.8 flyers/dia
    newRequestDate: '2026-08-12',
  },
  {
    id: 'del-belm-5',
    deliveryRef: 'DEL-2026-0815-13',
    date: '2026-08-15',
    officeId: 'off-belmonte',
    flyerTypeId: 'flyer-4',
    quantityDelivered: 1400,
    courier: 'Equipa Logística AHP',
    // 24 dias decorridos a ~43/dia => restam ~370 (Crítico!)
  },
];

export const INITIAL_BATCHES: StockInBatch[] = [
  {
    id: 'bat-1',
    batchRef: 'PO-2026-PRINT-881',
    date: '2026-06-01',
    flyerTypeId: 'flyer-1',
    quantity: 35000,
    printerName: 'Tipografia Central das Beiras',
    unitCost: 0.14,
  },
  {
    id: 'bat-2',
    batchRef: 'PO-2026-PRINT-882',
    date: '2026-06-05',
    flyerTypeId: 'flyer-2',
    quantity: 18000,
    printerName: 'Gráfica Regional da Serra',
    unitCost: 0.18,
  },
  {
    id: 'bat-3',
    batchRef: 'PO-2026-PRINT-883',
    date: '2026-06-10',
    flyerTypeId: 'flyer-3',
    quantity: 15000,
    printerName: 'Tipografia Central das Beiras',
    unitCost: 0.16,
  },
  {
    id: 'bat-4',
    batchRef: 'PO-2026-PRINT-884',
    date: '2026-06-15',
    flyerTypeId: 'flyer-4',
    quantity: 16000,
    printerName: 'Artes Gráficas do Centro',
    unitCost: 0.22,
  },
  {
    id: 'bat-5',
    batchRef: 'PO-2026-PRINT-885',
    date: '2026-06-20',
    flyerTypeId: 'flyer-5',
    quantity: 12000,
    printerName: 'Gráfica Regional da Serra',
    unitCost: 0.15,
  },
  {
    id: 'bat-6',
    batchRef: 'PO-2026-PRINT-886',
    date: '2026-06-22',
    flyerTypeId: 'flyer-6',
    quantity: 14000,
    printerName: 'Tipografia Central das Beiras',
    unitCost: 0.16,
  },
];

export const INITIAL_FAIRS: TourismFair[] = [
  {
    id: 'fair-1',
    name: 'BTL 2026 – Bolsa de Turismo de Lisboa',
    city: 'Lisboa',
    country: 'Portugal',
    startDate: '2026-02-28',
    endDate: '2026-03-03',
    standNumber: 'Pavilhão 1 - Stand Centro de Portugal / Aldeias Históricas',
    attendingStaff: 'Equipa de Promoção AHP',
    items: [
      {
        flyerTypeId: 'flyer-1', // Mapa Oficial
        quantityTaken: 4000,
        quantityReturned: 350,
        quantitySpent: 3650,
      },
      {
        flyerTypeId: 'flyer-2', // Gastronomia & Vinhos
        quantityTaken: 2500,
        quantityReturned: 180,
        quantitySpent: 2320,
      },
      {
        flyerTypeId: 'flyer-3', // GR22
        quantityTaken: 2000,
        quantityReturned: 120,
        quantitySpent: 1880,
      },
    ],
    totalFlyersSpent: 7850,
    notes: 'Grande afluência no fim de semana ao stand das 12 Aldeias Históricas com promoção da Rota GR22 e pacotes de estadia.',
  },
  {
    id: 'fair-2',
    name: 'FITUR 2026 – Feria Internacional de Turismo de Madrid',
    city: 'Madrid',
    country: 'Espanha',
    startDate: '2026-01-21',
    endDate: '2026-01-25',
    standNumber: 'Pabellón 4 - Stand Turismo Centro de Portugal',
    attendingStaff: 'Coordenação AHP & Guias Bilingues',
    items: [
      {
        flyerTypeId: 'flyer-1', // Mapa
        quantityTaken: 3500,
        quantityReturned: 280,
        quantitySpent: 3220,
      },
      {
        flyerTypeId: 'flyer-4', // Castelos & Fronteira
        quantityTaken: 2500,
        quantityReturned: 190,
        quantitySpent: 2310,
      },
    ],
    totalFlyersSpent: 5530,
    notes: 'Elevado interesse de operadores espanhóis nas fortificações raianas (Almeida, Castelo Rodrigo, Sortelha, Castelo Mendo).',
  },
  {
    id: 'fair-3',
    name: 'FIT Guarda 2026 – Feira Ibérica de Turismo',
    city: 'Guarda',
    country: 'Portugal',
    startDate: '2026-05-14',
    endDate: '2026-05-17',
    standNumber: 'Pavilhão Principal - Stand Rede AHP',
    attendingStaff: 'Técnicos dos Postos de Turismo AHP',
    items: [
      {
        flyerTypeId: 'flyer-1',
        quantityTaken: 2500,
        quantityReturned: 150,
        quantitySpent: 2350,
      },
      {
        flyerTypeId: 'flyer-3',
        quantityTaken: 1500,
        quantityReturned: 110,
        quantitySpent: 1390,
      },
      {
        flyerTypeId: 'flyer-6',
        quantityTaken: 1200,
        quantityReturned: 95,
        quantitySpent: 1105,
      },
    ],
    totalFlyersSpent: 4845,
    notes: 'Promoção do turismo de natureza e percursos de trekking nas serras envolventes (Açor, Estrela, Gardunha).',
  },
  {
    id: 'fair-4',
    name: 'Xantar 2026 – Feira Internacional de Turismo Gastronómico',
    city: 'Ourense',
    country: 'Espanha',
    startDate: '2026-03-12',
    endDate: '2026-03-15',
    standNumber: 'Espaço Sabores de Portugal',
    attendingStaff: 'Equipa AHP',
    items: [
      {
        flyerTypeId: 'flyer-2', // Gastronomia & Vinhos
        quantityTaken: 1800,
        quantityReturned: 120,
        quantitySpent: 1680,
      },
      {
        flyerTypeId: 'flyer-1',
        quantityTaken: 1200,
        quantityReturned: 140,
        quantitySpent: 1060,
      },
    ],
    totalFlyersSpent: 2740,
    notes: 'Degustação e distribuição de roteiros de azeite, queijo da serra e vinhos da Beira Interior.',
  },
];

export const INITIAL_OTHER_DELIVERIES: OtherDeliveryRecord[] = [
  {
    id: 'oth-1',
    ref: 'NOC-2026-0618-01',
    date: '2026-06-18',
    category: 'guided_tour',
    title: 'Visita Guiada Especial: Circuito das Muralhas de Sortelha',
    flyerTypeId: 'flyer-1',
    quantity: 65,
    deliveredBy: 'Guia Oficial AHP',
    recipientOrGroup: 'Associação Cultural de Coimbra (Grupo Excursionista)',
    notes: 'Entregue na Porta da Vila de Sortelha no início da visita acompanhada.',
  },
  {
    id: 'oth-2',
    ref: 'NOC-2026-0701-02',
    date: '2026-07-01',
    category: 'historical_village_office',
    title: 'Sede Central da Associação Aldeias Históricas de Portugal (Balcão de Atendimento)',
    flyerTypeId: 'flyer-1',
    quantity: 1200,
    deliveredBy: 'Equipa de Distribuição AHP',
    recipientOrGroup: 'Receção e Atendimento Geral ao Visitante',
    notes: 'Distribuição direta de balcão a visitantes e turistas que passam na sede da rede.',
  },
  {
    id: 'oth-3',
    ref: 'NOC-2026-0701-03',
    date: '2026-07-01',
    category: 'historical_village_office',
    title: 'Sede Central AHP: Guias Gastronómicos & Rotas do Azeite',
    flyerTypeId: 'flyer-2',
    quantity: 600,
    deliveredBy: 'Equipa de Distribuição AHP',
    recipientOrGroup: 'Receção e Atendimento Geral ao Visitante',
    notes: 'Disponibilizado no expositor central para turistas gastronómicos.',
  },
  {
    id: 'oth-4',
    ref: 'NOC-2026-0812-04',
    date: '2026-08-12',
    category: 'event',
    title: 'Feira Medieval de Belmonte & Recriação Renascentista',
    flyerTypeId: 'flyer-4',
    quantity: 1500,
    deliveredBy: 'Comissão de Festas & Eventos AHP',
    recipientOrGroup: 'Pórticos de Entrada no Castelo e Mercado Histórico',
    notes: 'Distribuído durante os 3 dias do evento medieval nos pontos de controlo.',
  },
  {
    id: 'oth-5',
    ref: 'NOC-2026-0520-05',
    date: '2026-05-20',
    category: 'school_educational',
    title: 'Programa Educativo: Descobrir as Fortalezas de Almeida e Castelo Rodrigo',
    flyerTypeId: 'flyer-1',
    quantity: 240,
    deliveredBy: 'Serviço Educativo AHP',
    recipientOrGroup: 'Agrupamento de Escolas da Guarda e Fundão (4 turmas)',
    notes: 'Kits pedagógicos de história e património entregues aos professores e alunos.',
  },
  {
    id: 'oth-6',
    ref: 'NOC-2026-0715-06',
    date: '2026-07-15',
    category: 'protocol_vip',
    title: 'Press Trip Internacional: Jornalistas e Criadores de Conteúdo Europeus',
    flyerTypeId: 'flyer-2',
    quantity: 50,
    deliveredBy: 'Gabinete de Comunicação e Relações Públicas AHP',
    recipientOrGroup: 'Delegação de Jornalistas de Viagens (Espanha, França e Reino Unido)',
    notes: 'Kits de boas-vindas entregues durante o jantar comemorativo em Castelo Novo.',
  },
  {
    id: 'oth-7',
    ref: 'NOC-2026-0805-07',
    date: '2026-08-05',
    category: 'guided_tour',
    title: 'Percurso Nocturno de Monsanto: Lendas das Pedras e Castelo Templário',
    flyerTypeId: 'flyer-5',
    quantity: 90,
    deliveredBy: 'Guia Local Credenciado',
    recipientOrGroup: 'Visitantes do Passeio Noturno Sob as Estrelas',
    notes: 'Entregue no miradouro de São Salvador antes da subida ao castelo.',
  },
];
