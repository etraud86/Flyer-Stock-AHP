import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
} from '../types';

// Real flyer catalog initialized with Roteiro (10,000 units in Central Warehouse)
export const INITIAL_FLYER_TYPES: FlyerType[] = [
  {
    id: 'flyer-ahp-rot-45',
    sku: 'AHP-ROT-45',
    name: 'Roteiro',
    category: 'Mapa Geral & Circuito',
    language: 'Multilingual (PT/EN/ES/FR)',
    warehouseStock: 10000,
    minThreshold: 2000,
    unitCost: 0.16,
    color: '#059669',
    description: 'Roteiro e Guia Oficial da Rede das Aldeias Históricas de Portugal.',
  },
];
export const SAMPLE_DEMO_FLYERS: FlyerType[] = [];

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
    id: 'off-monsanto',
    code: 'AHP-MONS',
    name: 'Monsanto',
    zone: 'Aldeia Mais Portuguesa (Idanha-a-Nova)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Monsanto',
    email: 'turismo.monsanto@aldeiashistoricasdeportugal.com',
    phone: '+351 277 314 601',
    address: 'Rua Marquês da Graciosa, 6060-091 Monsanto',
  },
  {
    id: 'off-marialva',
    code: 'AHP-MARI',
    name: 'Marialva',
    zone: 'Castelo & Cidadela Histórica (Mêda)',
    footfallTier: 'Medium',
    contactPerson: 'Posto de Turismo de Marialva',
    email: 'turismo.marialva@aldeiashistoricasdeportugal.com',
    phone: '+351 279 883 456',
    address: 'Largo do Corro, 6430-081 Marialva',
  },
  {
    id: 'off-castelo-rodrigo',
    code: 'AHP-CROD',
    name: 'Castelo Rodrigo',
    zone: 'Fronteira & Miradouros de Riba-Côa',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Castelo Rodrigo',
    email: 'turismo.castelorodrigo@aldeiashistoricasdeportugal.com',
    phone: '+351 271 513 142',
    address: 'Largo da Igreja, 6440-031 Castelo Rodrigo',
  },
  {
    id: 'off-almeida',
    code: 'AHP-ALME',
    name: 'Almeida',
    zone: 'Praça-Forte Estrela (Vilar Formoso)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Almeida',
    email: 'turismo.almeida@aldeiashistoricasdeportugal.com',
    phone: '+351 271 574 229',
    address: 'Praça da Liberdade, 6350-130 Almeida',
  },
  {
    id: 'off-piodao',
    code: 'AHP-PIOD',
    name: 'Piódão',
    zone: 'Serra do Açor / Xisto e Janelas Azuis (Arganil)',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo do Piódão',
    email: 'turismo.piodao@aldeiashistoricasdeportugal.com',
    phone: '+351 235 732 787',
    address: 'Largo Cónego Manuel Fernandes Nogueira, 3300-340 Piódão',
  },
  {
    id: 'off-castelo-mendo',
    code: 'AHP-CMEN',
    name: 'Castelo Mendo',
    zone: 'Muralhas D. Dinis & Berroas (Almeida)',
    footfallTier: 'Low',
    contactPerson: 'Posto de Turismo de Castelo Mendo',
    email: 'turismo.castelomendo@aldeiashistoricasdeportugal.com',
    phone: '+351 271 571 112',
    address: 'Largo do Pelourinho, 6355-030 Castelo Mendo',
  },
  {
    id: 'off-idanhaveha',
    code: 'AHP-IVEL',
    name: 'Idanha-a-Velha',
    zone: 'Sé Catedral Egitânia & Museu Romano',
    footfallTier: 'Medium',
    contactPerson: 'Posto de Turismo de Idanha-a-Velha',
    email: 'turismo.idanhaavelha@aldeiashistoricasdeportugal.com',
    phone: '+351 277 914 280',
    address: 'Largo do Espírito Santo, 6060-041 Idanha-a-Velha',
  },
  {
    id: 'off-trancoso',
    code: 'AHP-TRAN',
    name: 'Trancoso',
    zone: 'Portas d\'El Rei & Judiaria Histórica',
    footfallTier: 'High',
    contactPerson: 'Posto de Turismo de Trancoso',
    email: 'turismo.trancoso@aldeiashistoricasdeportugal.com',
    phone: '+351 271 829 120',
    address: 'Largo D. Dinis, 6420-058 Trancoso',
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

// Clean slate: 0 example deliveries
export const INITIAL_DELIVERIES: DeliveryRecord[] = [];
export const SAMPLE_DEMO_DELIVERIES: DeliveryRecord[] = [];

// Initial central warehouse stock batch: 10,000 units of Roteiro
export const INITIAL_BATCHES: StockInBatch[] = [
  {
    id: 'bat-init-rot-45',
    batchRef: 'PO-2026-PRINT-001',
    date: '2026-09-01',
    flyerTypeId: 'flyer-ahp-rot-45',
    quantity: 10000,
    printerName: 'Lote Central AHP - Gráfica Oficial',
    unitCost: 0.16,
  },
];
export const SAMPLE_DEMO_BATCHES: StockInBatch[] = [];

// Clean slate: 0 example fairs
export const INITIAL_FAIRS: TourismFair[] = [];
export const SAMPLE_DEMO_FAIRS: TourismFair[] = [];

// Clean slate: 0 example other deliveries
export const INITIAL_OTHER_DELIVERIES: OtherDeliveryRecord[] = [];
export const SAMPLE_DEMO_OTHER_DELIVERIES: OtherDeliveryRecord[] = [];
