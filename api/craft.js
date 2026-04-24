const API_WEST = "https://west.albion-online-data.com/api/v2/stats/prices";
const TAX = 0.03;

const CRAFT_RECIPES = [
  { id:"T4_METALBAR", name:"Barra Metal T4", mat:[{id:"T4_ORE",qty:8}], fee:100 },
  { id:"T5_METALBAR", name:"Barra Metal T5", mat:[{id:"T5_ORE",qty:8}], fee:200 },
  { id:"T6_METALBAR", name:"Barra Metal T6", mat:[{id:"T6_ORE",qty:8}], fee:400 },
  { id:"T4_PLANKS",   name:"Tablas T4",      mat:[{id:"T4_WOOD",qty:8}], fee:100 },
  { id:"T5_PLANKS",   name:"Tablas T5",      mat:[{id:"T5_WOOD",qty:8}], fee:200 },
  { id:"T6_PLANKS",   name:"Tablas T6",      mat:[{id:"T6_WOOD",qty:8}], fee:400 },
  { id:"T4_LEATHER",  name:"Cuero Proc T4",  mat:[{id:"T4_HIDE",qty:8}], fee:100 },
  { id:"T5_LEATHER",  name:"Cuero Proc T5",  mat:[{id:"T5_HIDE",qty:8}], fee:200 },
  { id:"T4_CLOTH",    name:"Tela T4",        mat:[{id:"T4_FIBER",qty:8}], fee:100 },
  { id:"T5_CLOTH",    name:"Tela T5",        mat:[{id:"T5_FIBER",qty:8}], fee:200 },
  { id:"T6_CLOTH",    name:"Tela T6",        mat:[{id:"T6_FIBER",qty:8}], fee:400 },
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { recipeId, qty = 1 } = req.query;

  const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return res.status(404).json({ error: "Receta no encontrada" });

  try {
    const allIds = [...recipe.mat.map(m => m.id), recipe.id].join(",");
    const data = await fetch(
      `${API_WEST}/${allIds}?locations=Caerleon,Bridgewatch,Lymhurst,Fort Sterling&qualities=1`
    ).then(r => r.json());

    const prices = {};
    data.forEach(p => {
      if (!prices[p.item_id]) prices[p.item_id] = {};
      if (p.sell_price_min > 0)
        prices[p.item_id].buy = Math.min(prices[p.item_id].buy || Infinity, p.sell_price_min);
      if (p.buy_price_max > 0)
        prices[p.item_id].sell = Math.max(prices[p.item_id].sell || 0, p.buy_price_max);
    });

    let matCost = 0;
    for (const mat of recipe.mat) {
      const p = prices[mat.id]?.buy;
      if (!p) return res.status(200).json({ error: "Sin precios disponibles" });
      matCost += p * mat.qty * qty;
    }

    const fee      = recipe.fee * qty;
    const totalCost = matCost + fee;
    const sellPrice = prices[recipe.id]?.sell;
    if (!sellPrice) return res.status(200).json({ error: "Sin precio de venta" });

    const revenue = sellPrice * qty;
    const taxAmt  = revenue * TAX;
    const net     = revenue - taxAmt - totalCost;

    res.status(200).json({
      matCost: Math.round(matCost),
      fee,
      totalCost: Math.round(totalCost),
      revenue: Math.round(revenue),
      tax: Math.round(taxAmt),
      net: Math.round(net),
      roi: ((net / totalCost) * 100).toFixed(1),
    });

  } catch (e) {
    res.status(500).json({ error: "Error al consultar Albion API" });
  }
}