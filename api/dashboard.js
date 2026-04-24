const API_WEST = "https://west.albion-online-data.com/api/v2/stats/prices";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const items = "T5_PLANKS,T5_HIDE,T5_ORE,T5_FIBER,T5_WOOD,T6_PLANKS,T6_HIDE,T6_ORE,T6_FIBER,T6_WOOD";
    const data = await fetch(
      `${API_WEST}/${items}?locations=Caerleon,Bridgewatch,Lymhurst,Fort Sterling&qualities=1`
    ).then(r => r.json());

    const filtered = data
      .filter(p => p.sell_price_min > 0 || p.buy_price_max > 0)
      .slice(0, 16);

    res.status(200).json(filtered);

  } catch (e) {
    res.status(500).json({ error: "Error al consultar Albion API" });
  }
}