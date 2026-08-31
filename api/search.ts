import type { VercelRequest, VercelResponse } from '@vercel/node';

const LABS = [
  { name: 'National Test House (NTH) - Eastern Region', location: 'Kolkata, West Bengal', state: 'West Bengal', products: ['Electronics', 'Steel', 'Cement', 'Textiles'], nabl: true, bis: true, phone: '033-2321-1312', website: 'nth.gov.in' },
  { name: 'National Test House (NTH) - Western Region', location: 'Mumbai, Maharashtra', state: 'Maharashtra', products: ['Chemicals', 'Plastics', 'Paints', 'Food'], nabl: true, bis: true, phone: '022-2491-9920', website: 'nth.gov.in' },
  { name: 'National Test House (NTH) - Northern Region', location: 'Ghaziabad, Uttar Pradesh', state: 'Uttar Pradesh', products: ['Automobiles', 'Electrical', 'Mechanical'], nabl: true, bis: true, phone: '0120-278-2250', website: 'nth.gov.in' },
  { name: 'Central Power Research Institute (CPRI)', location: 'Bangalore, Karnataka', state: 'Karnataka', products: ['Electrical Equipment', 'Transformers', 'Cables'], nabl: true, bis: true, phone: '080-2360-7200', website: 'cpri.in' },
  { name: 'Central Leather Research Institute (CLRI)', location: 'Chennai, Tamil Nadu', state: 'Tamil Nadu', products: ['Leather', 'Footwear', 'Leather Goods'], nabl: true, bis: false, phone: '044-2491-9920', website: 'clri.res.in' },
  { name: 'Indian Rubber Manufacturers Research Association', location: 'Thane, Maharashtra', state: 'Maharashtra', products: ['Rubber', 'Tyres', 'Hoses'], nabl: true, bis: true, phone: '022-2581-7410', website: 'irmra.org' },
  { name: 'Electronics Regional Test Laboratory (ERTL) North', location: 'New Delhi, Delhi', state: 'Delhi', products: ['Electronics', 'IT Equipment', 'Telecom'], nabl: true, bis: true, phone: '011-2647-0220', website: 'ertldelhi.gov.in' },
  { name: 'Gujarat State Fertilizers & Chemicals (GSFC) Lab', location: 'Vadodara, Gujarat', state: 'Gujarat', products: ['Fertilizers', 'Chemicals', 'Pesticides'], nabl: true, bis: false, phone: '0265-222-0551', website: 'gsfcltd.com' },
  { name: 'Shriram Institute for Industrial Research', location: 'New Delhi, Delhi', state: 'Delhi', products: ['Petroleum', 'Lubricants', 'Polymers', 'Textiles'], nabl: true, bis: true, phone: '011-2747-2400', website: 'shriraminstitute.org' },
  { name: 'TIFAC CORE - Textile Lab', location: 'Coimbatore, Tamil Nadu', state: 'Tamil Nadu', products: ['Textiles', 'Garments', 'Fibres'], nabl: true, bis: false, phone: '0422-257-2177', website: 'tifac.org.in' },
];

const STANDARDS = [
  { code: 'IS 10500:2012', title: 'Drinking Water - Specification', category: 'Food & Water', mandatory: true, scheme: 'ISI Mark' },
  { code: 'IS 1239:2004', title: 'Mild Steel Tubes, Tubulars and Other Wrought Steel Fittings', category: 'Steel & Metals', mandatory: true, scheme: 'ISI Mark' },
  { code: 'IS 616:2010', title: 'Electric Ceiling Fans and Regulators', category: 'Electrical', mandatory: true, scheme: 'CRS' },
  { code: 'IS 694:2010', title: 'PVC Insulated Cables for Working Voltages', category: 'Electrical', mandatory: true, scheme: 'ISI Mark' },
  { code: 'IS 4151:1993', title: 'Protective Helmets for Cyclists', category: 'Safety', mandatory: true, scheme: 'ISI Mark' },
  { code: 'IS 456:2000', title: 'Plain and Reinforced Concrete - Code of Practice', category: 'Construction', mandatory: false, scheme: 'Voluntary' },
  { code: 'IS 3624:1987', title: 'Pressure Gauges - Specification', category: 'Industrial', mandatory: false, scheme: 'Voluntary' },
  { code: 'IS 15820:2009', title: 'Gold and Gold Alloy Jewellery and Artefacts - Hallmarking', category: 'Hallmarking', mandatory: true, scheme: 'Hallmarking' },
  { code: 'IS 1860:2010', title: 'Induction Motors - Three Phase - Squirrel Cage', category: 'Electrical', mandatory: false, scheme: 'ISI Mark' },
  { code: 'IS 14489:2018', title: 'Occupational Health and Safety Management Systems', category: 'Safety', mandatory: false, scheme: 'Voluntary' },
  { code: 'IS 13428:2005', title: 'Packaged Natural Mineral Water', category: 'Food & Water', mandatory: true, scheme: 'ISI Mark' },
  { code: 'IS 14543:2016', title: 'Packaged Drinking Water (Other than Packaged Natural Mineral Water)', category: 'Food & Water', mandatory: true, scheme: 'ISI Mark' },
  { code: 'IS 2062:2011', title: 'Hot Rolled Medium and High Tensile Structural Steel', category: 'Steel & Metals', mandatory: false, scheme: 'ISI Mark' },
  { code: 'IS 383:2016', title: 'Coarse and Fine Aggregate for Concrete', category: 'Construction', mandatory: false, scheme: 'Voluntary' },
  { code: 'IS 1489:2015', title: 'Portland Pozzolana Cement', category: 'Construction', mandatory: true, scheme: 'ISI Mark' },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { type } = req.query;

  if (type === 'labs') {
    const { state, product } = req.query;
    let results = LABS;
    if (state && typeof state === 'string') {
      results = results.filter(l => l.state.toLowerCase().includes(state.toLowerCase()));
    }
    if (product && typeof product === 'string') {
      results = results.filter(l => l.products.some(p => p.toLowerCase().includes(product.toLowerCase())));
    }
    return res.status(200).json({ labs: results.length ? results : LABS.slice(0, 5) });
  }

  if (type === 'standards') {
    const { q, category } = req.query;
    let results = STANDARDS;
    if (q && typeof q === 'string' && q.length > 1) {
      const query = q.toLowerCase();
      results = results.filter(s =>
        s.code.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }
    if (category && typeof category === 'string') {
      results = results.filter(s => s.category === category);
    }
    return res.status(200).json({ standards: results, total: results.length });
  }

  return res.status(400).json({ error: 'Invalid type. Use type=labs or type=standards' });
}
