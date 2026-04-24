const API_WEST = "https://west.albion-online-data.com/api/v2/stats/prices";
const API_EAST = "https://east.albion-online-data.com/api/v2/stats/prices";
const CITIES = ["Caerleon","Bridgewatch","Fort Sterling","Lymhurst","Martlock","Thetford"];

const CROSS_ITEMS = [
  { id:"T4_PLANKS", name:"Tablas T4" },
  { id:"T5_PLANKS", name:"Tablas T5" },
  { id:"T6_PLANKS", name:"Tablas T6" },
  { id:"T4_ORE", name:"Mineral T4" },
  { id:"T5_ORE", name:"Mineral T5" },
  { id:"T6_ORE", name:"Mineral T6" },
  { id:"T4_FIBER", name:"Fibra T4" },
  { id:"T5_FIBER", name:"Fibra T5" },
  { id:"T4_HIDE", name:"Cuero T4" },
  { id:"T5_HIDE", name:"Cuero T5" },
  { id:"T4_WOOD", name:"Madera T4" },
  { id:"T5_WOOD", name:"Madera T5" },
  { id:"T4_METALBAR", name:"Barra Metal T4" },
  { id:"T5_METALBAR", name:"Barra Metal T5" },
  { id:"T4_CLOTH", name:"Tela T4" },
  { id:"T5_CLOTH", name:"Tela T5" },
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const playerServer = req.query.server || "west";

  try {
    const ids = CROSS_ITEMS.map(i => i.id).join(",");
    const loc = CITIES.join(",");

    const [westData, eastData] = await Promise.all([
      fetch(`${API_WEST}/${ids}?locations=${loc}&qualities=1`).then(r => r.json()),
      fetch(`${API_EAST}/${ids}?locations=${loc}&qualities=1`).then(r => r.json()),
    ]);

    const avgPrice = (data, itemId) => {
      const rows = data.filter(e => e.item_id === itemId && e.sell_price_min > 0);
      if (!rows.length) return 0;
      return rows.reduce((s, e) => s + e.sell_price_min, 0) / rows.length;
    };

    const signals = [];
    CROSS_ITEMS.forEach(item => {
      const westNow = avgPrice(westData, item.id);
      const eastNow = avgPrice(eastData, item.id);
      if (!westNow || !eastNow) return;

      const priceDiff    = Math.abs(westNow - eastNow);
      const priceDiffPct = (priceDiff / Math.min(westNow, eastNow)) * 100;
      if (priceDiffPct < 8) return;

      const leadingServer = westNow > eastNow ? "West" : "East";
      const confidence    = priceDiffPct > 15 ? "alta" : priceDiffPct > 8 ? "media" : "baja";

      signals.push({
        name: item.name,
        westPrice: Math.round(westNow),
        eastPrice: Math.round(eastNow),
        priceDiffPct: priceDiffPct.toFixed(1),
        leadingServer,
        confidence,
        action: playerServer === "west"
          ? (westNow < eastNow ? `Compra ${item.name} en West, está más barato` : `${item.name} está más caro en West`)
          : (eastNow < westNow ? `Compra ${item.name} en East, está más barato` : `${item.name} está más caro en East`),
      });
    });

    signals.sort((a, b) => parseFloat(b.priceDiffPct) - parseFloat(a.priceDiffPct));
    res.status(200).json(signals.slice(0, 12));

  } catch (e) {
    res.status(500).json({ error: "Error al consultar Albion API" });
  }
}