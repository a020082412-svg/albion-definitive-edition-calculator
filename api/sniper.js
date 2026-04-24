const TAX = 0.03;
const API_WEST = "https://west.albion-online-data.com/api/v2/stats/prices";
const CITIES = ["Caerleon","Bridgewatch","Fort Sterling","Lymhurst","Martlock","Thetford"];

const SNIPER_ITEMS = [
  { id:"T4_PLANKS", name:"Tablas T4", cat:"recurso" },
  { id:"T5_PLANKS", name:"Tablas T5", cat:"recurso" },
  { id:"T6_PLANKS", name:"Tablas T6", cat:"recurso" },
  { id:"T4_ORE", name:"Mineral T4", cat:"recurso" },
  { id:"T5_ORE", name:"Mineral T5", cat:"recurso" },
  { id:"T6_ORE", name:"Mineral T6", cat:"recurso" },
  { id:"T4_FIBER", name:"Fibra T4", cat:"recurso" },
  { id:"T5_FIBER", name:"Fibra T5", cat:"recurso" },
  { id:"T6_FIBER", name:"Fibra T6", cat:"recurso" },
  { id:"T4_HIDE", name:"Cuero T4", cat:"recurso" },
  { id:"T5_HIDE", name:"Cuero T5", cat:"recurso" },
  { id:"T6_HIDE", name:"Cuero T6", cat:"recurso" },
  { id:"T4_WOOD", name:"Madera T4", cat:"recurso" },
  { id:"T5_WOOD", name:"Madera T5", cat:"recurso" },
  { id:"T6_WOOD", name:"Madera T6", cat:"recurso" },
  { id:"T4_METALBAR", name:"Barra Metal T4", cat:"recurso" },
  { id:"T5_METALBAR", name:"Barra Metal T5", cat:"recurso" },
  { id:"T4_LEATHER", name:"Cuero Proc T4", cat:"recurso" },
  { id:"T5_LEATHER", name:"Cuero Proc T5", cat:"recurso" },
  { id:"T4_CLOTH", name:"Tela T4", cat:"recurso" },
  { id:"T5_CLOTH", name:"Tela T5", cat:"recurso" },
  { id:"T4_MAIN_SWORD", name:"Espada T4", cat:"arma" },
  { id:"T5_MAIN_SWORD", name:"Espada T5", cat:"arma" },
  { id:"T6_MAIN_SWORD", name:"Espada T6", cat:"arma" },
  { id:"T4_2H_BOW", name:"Arco T4", cat:"arma" },
  { id:"T5_2H_BOW", name:"Arco T5", cat:"arma" },
  { id:"T4_MAIN_FIRESTAFF", name:"Baston Fuego T4", cat:"arma" },
  { id:"T5_MAIN_FIRESTAFF", name:"Baston Fuego T5", cat:"arma" },
  { id:"T4_ARMOR_PLATE_SET1", name:"Pecho Placa T4", cat:"armadura" },
  { id:"T5_ARMOR_PLATE_SET1", name:"Pecho Placa T5", cat:"armadura" },
  { id:"T4_ARMOR_LEATHER_SET1", name:"Armadura Cuero T4", cat:"armadura" },
  { id:"T4_ARMOR_CLOTH_SET1", name:"Tunica T4", cat:"armadura" },
];

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const capital = parseInt(req.query.capital) || 500000;

  try {
    const chunks = chunkArray(SNIPER_ITEMS, 20);
    const results = await Promise.all(
      chunks.map(chunk =>
        fetch(`${API_WEST}/${chunk.map(i => i.id).join(",")}?locations=${CITIES.join(",")}&qualities=1`)
          .then(r => r.json())
      )
    );
    const data = results.flat();

    const grouped = {};
    data.forEach(e => {
      if (!grouped[e.item_id]) grouped[e.item_id] = [];
      grouped[e.item_id].push(e);
    });

    const opps = [];
    Object.entries(grouped).forEach(([itemId, entries]) => {
      const buys  = entries.filter(e => e.sell_price_min > 0);
      const sells = entries.filter(e => e.buy_price_max > 0);
      if (buys.length < 2 || sells.length < 2) return;

      const cheapest = buys.reduce((a, b) => a.sell_price_min < b.sell_price_min ? a : b);
      const highest  = sells.reduce((a, b) => a.buy_price_max > b.buy_price_max ? a : b);
      if (cheapest.city === highest.city) return;

      const gross = highest.buy_price_max - cheapest.sell_price_min;
      const tax   = highest.buy_price_max * TAX;
      const net   = gross - tax;
      const roi   = (net / cheapest.sell_price_min) * 100;
      if (net < 500 || roi < 5) return;

      const meta        = SNIPER_ITEMS.find(i => i.id === itemId);
      const maxQty      = Math.floor(capital / cheapest.sell_price_min);
      const totalProfit = Math.round(net * maxQty);
      const score       = totalProfit * (roi / 100);

      opps.push({
        name: meta.name, cat: meta.cat,
        city_buy: cheapest.city, city_sell: highest.city,
        buy: cheapest.sell_price_min, sell: highest.buy_price_max,
        profit: Math.round(net), totalProfit,
        roi: roi.toFixed(1), maxQty, score
      });
    });

    opps.sort((a, b) => b.score - a.score);
    res.status(200).json(opps.slice(0, 20));

  } catch (e) {
    res.status(500).json({ error: "Error al consultar Albion API" });
  }
}