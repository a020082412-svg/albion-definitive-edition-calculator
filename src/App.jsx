import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   ALBION JARVIS v5.0 — ECONOMIC INTELLIGENCE SUITE
   Full-stack market tool for Albion Online
═══════════════════════════════════════════════════════════ */

const CITIES = ["Caerleon","Bridgewatch","Fort Sterling","Lymhurst","Martlock","Thetford"];
const SERVERS = [
  { id:"west",  label:"América",  flag:"🌎", url:"https://west.albion-online-data.com/api/v2/stats/prices" },
  { id:"east",  label:"Asia",     flag:"🌏", url:"https://east.albion-online-data.com/api/v2/stats/prices" },
  { id:"europe",label:"Europa",   flag:"🌍", url:"https://europe.albion-online-data.com/api/v2/stats/prices" },
];

// ── Item Builders ──────────────────────────────────────────
const RAW = [
  {prefix:"FIBER",name:"Fibra"},{prefix:"WOOD",name:"Madera"},
  {prefix:"ORE",name:"Mineral"},{prefix:"HIDE",name:"Cuero"},{prefix:"ROCK",name:"Piedra"},
];
const PROC = [
  {prefix:"PLANKS",name:"Tablas"},{prefix:"METALBAR",name:"Barra Metal"},
  {prefix:"LEATHER",name:"Cuero Proc"},{prefix:"CLOTH",name:"Tela"},
  {prefix:"STONEBLOCK",name:"Bloque Piedra"},
];
const buildRaw = () => RAW.flatMap(({prefix,name})=>
  Array.from({length:(prefix==="ROCK"?6:7)},(_,i)=>({id:`T${i+2}_${prefix}`,name:`${name} T${i+2}`,cat:"recurso",tier:i+2})));
const buildProc = () => PROC.flatMap(({prefix,name})=>
  Array.from({length:(prefix==="STONEBLOCK"?6:7)},(_,i)=>({id:`T${i+2}_${prefix}`,name:`${name} T${i+2}`,cat:"recurso",tier:i+2})));

const WEAPON_LIST = [
  {id:"MAIN_SWORD",name:"Espada"},{id:"2H_CLAYMORE",name:"Mandoble"},
  {id:"MAIN_AXE",name:"Hacha"},{id:"2H_AXE",name:"Hacha 2M"},
  {id:"MAIN_MACE",name:"Maza"},{id:"2H_MACE",name:"Maza 2M"},
  {id:"MAIN_DAGGER",name:"Daga"},{id:"2H_DAGGERPAIR",name:"Dagas Dobles"},
  {id:"2H_BOW",name:"Arco"},{id:"2H_CROSSBOW",name:"Ballesta"},
  {id:"MAIN_SPEAR",name:"Lanza"},{id:"2H_SPEAR",name:"Lanza 2M"},
  {id:"MAIN_FIRESTAFF",name:"Baston Fuego"},{id:"2H_FIRESTAFF",name:"Baston Fuego 2M"},
  {id:"MAIN_HOLYSTAFF",name:"Baston Sagrado"},{id:"2H_HOLYSTAFF",name:"Baston Sagrado 2M"},
  {id:"MAIN_ARCANESTAFF",name:"Baston Arcano"},{id:"2H_ARCANESTAFF",name:"Baston Arcano 2M"},
  {id:"MAIN_FROSTSTAFF",name:"Baston Hielo"},{id:"2H_FROSTSTAFF",name:"Baston Hielo 2M"},
  {id:"MAIN_NATURESTAFF",name:"Baston Natura"},{id:"2H_NATURESTAFF",name:"Baston Natura 2M"},
  {id:"2H_CURSEDSTAFF",name:"Baston Maldito"},{id:"MAIN_QUARTERSTAFF",name:"Baston Cuarteron"},
  {id:"2H_HALBERD",name:"Alabarda"},{id:"2H_GLAIVE",name:"Guadaña"},
  {id:"2H_HAMMER",name:"Martillo 2M"},{id:"MAIN_HAMMER",name:"Martillo"},
  {id:"2H_WARBOW",name:"Arco de Guerra"},{id:"2H_INFERNOSTAFF",name:"Baston Infierno"},
];
const buildWeapons = () => WEAPON_LIST.flatMap(({id,name})=>
  [4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"arma",tier:t})));

const ARMOR_LIST = [
  {type:"HEAD_CLOTH_SET1",name:"Capucha Tela"},{type:"ARMOR_CLOTH_SET1",name:"Tunica"},
  {type:"SHOES_CLOTH_SET1",name:"Sandalias"},{type:"HEAD_LEATHER_SET1",name:"Casco Cuero"},
  {type:"ARMOR_LEATHER_SET1",name:"Armadura Cuero"},{type:"SHOES_LEATHER_SET1",name:"Botas Cuero"},
  {type:"HEAD_PLATE_SET1",name:"Yelmo Placa"},{type:"ARMOR_PLATE_SET1",name:"Pecho Placa"},
  {type:"SHOES_PLATE_SET1",name:"Botas Placa"},
];
const buildArmors = () => ARMOR_LIST.flatMap(({type,name})=>
  [4,5,6,7,8].map(t=>({id:`T${t}_${type}`,name:`${name} T${t}`,cat:"armadura",tier:t})));

const OFF_LIST = [
  {id:"OFF_SHIELD",name:"Escudo"},{id:"OFF_TORCH",name:"Antorcha"},
  {id:"OFF_HORN",name:"Cuerno"},{id:"OFF_BOOK",name:"Libro"},
  {id:"OFF_ORB",name:"Orbe"},{id:"OFF_DAGGER",name:"Daga Off"},
];
const buildOffHand = () => OFF_LIST.flatMap(({id,name})=>
  [4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"armadura",tier:t})));

const ALL_ITEMS = [...buildRaw(),...buildProc(),...buildWeapons(),...buildArmors(),...buildOffHand()];
const TRANSPORT_ITEMS = [...buildRaw(),...buildProc()];

// ── Craft Recipes ─────────────────────────────────────────
const PROC_RECIPES = PROC.flatMap(({prefix,name})=>
  Array.from({length:(prefix==="STONEBLOCK"?5:6)},(_,i)=>{
    const t=i+3;
    const rawPrefix = {PLANKS:"WOOD",METALBAR:"ORE",LEATHER:"HIDE",CLOTH:"FIBER",STONEBLOCK:"ROCK"}[prefix];
    const rawName = RAW.find(r=>r.prefix===rawPrefix)?.name||rawPrefix;
    return {id:`T${t}_${prefix}`,name:`${name} T${t}`,cat:"recurso",
      mat:[{id:`T${t}_${rawPrefix}`,name:`${rawName} T${t}`,qty:8}],
      out:1,fee:{3:50,4:100,5:200,6:400,7:800,8:1600}[t]};
  }));

// ── Item Weights ──────────────────────────────────────────
const ITEM_WEIGHTS = {};
RAW.forEach(r=>{for(let t=2;t<=8;t++) ITEM_WEIGHTS[`T${t}_${r.prefix}`]=0.1;});
["PLANKS","LEATHER","CLOTH"].forEach(p=>{for(let t=2;t<=8;t++) ITEM_WEIGHTS[`T${t}_${p}`]=0.3;});
["METALBAR","STONEBLOCK"].forEach(p=>{for(let t=2;t<=8;t++) ITEM_WEIGHTS[`T${t}_${p}`]=0.5;});

// ── Black Zone Builds ─────────────────────────────────────
const BZ_BUILDS = [
  {id:"bz1",name:"Fantasma Recolector",rol:"Escape / Farmeo",tier:"T6",costo:350000,riesgo:"bajo",silver_h:1400000,icon:"👻",color:"#4ade80",
   arma:"Hacha T6 / Baston Cuarteron T6",cabeza:"Capucha Recolector T6",pecho:"Armadura Recolector T6",
   botas:"Botas Mercader T6",offhand:"—",capa:"Fort Sterling T4",montura:"Lobo Feroz T6",
   descripcion:"El más seguro para zona negra. Prioriza escape sobre DPS.",
   consejos:["Nunca lleves más de lo que puedas perder","Farmea en bordes del mapa","Usa el dash antes que la capa","Sal si ves 2+ enemigos"]},
  {id:"bz2",name:"Asesino Solitario",rol:"PvP / Ganker",tier:"T6-T7",costo:750000,riesgo:"medio",silver_h:2100000,icon:"🗡️",color:"#f97316",
   arma:"Dagas Dobles T6 / Arco T6",cabeza:"Casco Cuero T6",pecho:"Armadura Cuero T6",
   botas:"Botas Cazador T6",offhand:"—",capa:"Bridgewatch T4",montura:"Lobo Feroz T6",
   descripcion:"Para jugadores con experiencia PvP. Mata recolectores y toma su loot.",
   consejos:["Solo ataca recolectores solos","Guarda E para escapar","Retírate antes de que lleguen sus amigos","Usa cobertura para emboscar"]},
  {id:"bz3",name:"Tanque Dungeons",rol:"PvE Dungeon",tier:"T7",costo:1200000,riesgo:"medio",silver_h:2800000,icon:"🛡️",color:"#60a5fa",
   arma:"Maza 2M T7 / Baston Sagrado T7",cabeza:"Yelmo Placa T7",pecho:"Pecho Placa T7",
   botas:"Botas Placa T7",offhand:"Escudo T7",capa:"Martlock T4",montura:"Caballo Armado T7",
   descripcion:"Para farmear Dungeons Randomizados solo. Chests con el mejor loot del juego.",
   consejos:["Entra solo al dungeon","Limpia de adentro hacia afuera","Los chests dorados son el objetivo","Sal si ves otro jugador entrar"]},
  {id:"bz4",name:"Mago del Caos",rol:"AoE PvP Ganker",tier:"T6-T7",costo:900000,riesgo:"alto",silver_h:3200000,icon:"🔥",color:"#ef4444",
   arma:"Baston Fuego 2M T7 / Baston Maldito T7",cabeza:"Capucha Tela T7",pecho:"Tunica Arcana T7",
   botas:"Sandalias Mago T7",offhand:"—",capa:"Thetford T4",montura:"Lobo Feroz T7",
   descripcion:"Alto riesgo, máximo daño AoE. Necesita grupo con healer.",
   consejos:["NUNCA vayas solo","Mantente atrás","Burst grupal, no 1v1","Discord obligatorio para coordinación"]},
];

const FARM_ZONES = [
  {name:"Highland Cross",tier:"T5-T6",resource:"Piedra/Mineral",risk:"bajo",time:20,silver:290000,pvp:false,zone:"Fort Sterling"},
  {name:"Deepwood",tier:"T5",resource:"Madera/Fibra",risk:"bajo",time:22,silver:310000,pvp:false,zone:"Lymhurst"},
  {name:"Swamp Cross",tier:"T5-T6",resource:"Fibra",risk:"medio",time:25,silver:380000,pvp:false,zone:"Thetford"},
  {name:"Forest Cross",tier:"T6",resource:"Madera/Fibra",risk:"medio",time:28,silver:410000,pvp:false,zone:"Lymhurst"},
  {name:"Sunsteppe",tier:"T6",resource:"Cuero",risk:"medio",time:30,silver:430000,pvp:true,zone:"Bridgewatch"},
  {name:"Steppe Cross",tier:"T6-T7",resource:"Cuero",risk:"alto",time:30,silver:520000,pvp:true,zone:"Bridgewatch"},
  {name:"Frostpeak",tier:"T6-T7",resource:"Mineral/Piedra",risk:"alto",time:38,silver:610000,pvp:true,zone:"Fort Sterling"},
  {name:"Mountain Cross",tier:"T7",resource:"Mineral",risk:"alto",time:35,silver:680000,pvp:true,zone:"Martlock"},
  {name:"Caerleon Roads",tier:"T7-T8",resource:"Todos",risk:"muy alto",time:45,silver:950000,pvp:true,zone:"Caerleon"},
];

// ── Helpers ───────────────────────────────────────────────
const riskColor = r=>({bajo:"#4ade80",medio:"#facc15",alto:"#f97316","muy alto":"#ef4444"}[r]||"#fff");
const riskBg    = r=>({bajo:"#052e16",medio:"#422006",alto:"#431407","muy alto":"#450a0a"}[r]||"#111");
const fmt = n => typeof n==="number" ? n.toLocaleString("es-MX") : n;
const fmtM = n => n>=1000000?`${(n/1000000).toFixed(2)}M`:n>=1000?`${(n/1000).toFixed(0)}k`:String(n);

function Spinner({size=16}){
  return <div style={{display:"inline-block",width:size,height:size,border:`2px solid #2a2a2a`,borderTop:`2px solid #f59e0b`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;
}

// ── Storage helpers ───────────────────────────────────────
const LS = {
  get:(k,d)=>{ try{const v=localStorage.getItem(k); return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════ */

// ── Donation Button ───────────────────────────────────────
function DonationBtn(){
  const [show,setShow]=useState(false);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setShow(s=>!s)} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",color:"#000",padding:"8px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,letterSpacing:1,display:"flex",alignItems:"center",gap:6,transition:"transform .2s",boxShadow:"0 0 12px #f59e0b44"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        ☕ Donar
      </button>
      {show&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"#111",border:"1px solid #f59e0b44",borderRadius:12,padding:20,minWidth:240,zIndex:200,boxShadow:"0 12px 40px rgba(0,0,0,.8)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#f59e0b",marginBottom:6}}>☕ Apoya Albion Jarvis</div>
          <div style={{fontSize:12,color:"#71717a",marginBottom:14,lineHeight:1.5}}>Si te ayudó a ganar silver, considera invitarme un café. ¡Gracias!</div>
          <div style={{display:"grid",gap:8}}>
            {[
              {label:"☕ PayPal",url:"https://paypal.me/albionjarvis",color:"#0070ba"},
              {label:"💛 Ko-fi",url:"https://ko-fi.com/albionjarvis",color:"#ff5e5b"},
              {label:"🎮 Patreon",url:"https://patreon.com/albionjarvis",color:"#ff424d"},
            ].map(b=>(
              <a key={b.label} href={b.url} target="_blank" rel="noreferrer"
                style={{display:"block",padding:"10px 14px",background:b.color+"22",border:`1px solid ${b.color}44`,borderRadius:8,color:b.color,textDecoration:"none",fontSize:13,fontWeight:700,textAlign:"center",transition:"background .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=b.color+"44"}
                onMouseLeave={e=>e.currentTarget.style.background=b.color+"22"}>
                {b.label}
              </a>
            ))}
          </div>
          <div style={{marginTop:12,fontSize:11,color:"#52525b",textAlign:"center"}}>100% gratis · sin anuncios · hecho con ❤️</div>
        </div>
      )}
    </div>
  );
}

// ── API Hook ──────────────────────────────────────────────
function usePrices(apiBase){
  const cache = useRef({});
  const fetch_ = useCallback(async(ids,opts={})=>{
    const key=ids+JSON.stringify(opts);
    if(cache.current[key]&&Date.now()-cache.current[key].ts<60000) return cache.current[key].data;
    try{
      const cities=(opts.cities||CITIES).join(",");
      const r=await fetch(`${apiBase}/${ids}?locations=${cities}&qualities=1`);
      const d=await r.json();
      cache.current[key]={data:d,ts:Date.now()};
      return d;
    }catch{return [];}
  },[apiBase]);
  return fetch_;
}

// ── Watchlist ─────────────────────────────────────────────
function WatchlistTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [list,setList]=useState(()=>LS.get("jarvis_watchlist",[]));
  const [search,setSearch]=useState("");
  const [prices,setPrices]=useState({});
  const [loading,setLoading]=useState(false);

  const addItem=(item)=>{
    if(list.find(x=>x.id===item.id)) return;
    const updated=[...list,item];
    setList(updated); LS.set("jarvis_watchlist",updated);
  };
  const removeItem=(id)=>{
    const updated=list.filter(x=>x.id!==id);
    setList(updated); LS.set("jarvis_watchlist",updated);
  };

  const refreshPrices=useCallback(async()=>{
    if(!list.length) return;
    setLoading(true);
    const ids=list.map(x=>x.id).join(",");
    const data=await fetchPrices(ids);
    const p={};
    data.forEach(e=>{
      if(!p[e.item_id]) p[e.item_id]={};
      if(e.sell_price_min>0) p[e.item_id].sell=Math.min(p[e.item_id].sell||Infinity,e.sell_price_min);
      if(e.buy_price_max>0) p[e.item_id].buy=Math.max(p[e.item_id].buy||0,e.buy_price_max);
      if(!p[e.item_id].bySell) p[e.item_id].bySell={};
      if(!p[e.item_id].byBuy) p[e.item_id].byBuy={};
      if(e.sell_price_min>0) p[e.item_id].bySell[e.city]=e.sell_price_min;
      if(e.buy_price_max>0) p[e.item_id].byBuy[e.city]=e.buy_price_max;
    });
    setPrices(p); setLoading(false);
  },[list,fetchPrices]);

  useEffect(()=>{refreshPrices();},[list.length]);

  const filtered=ALL_ITEMS.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())).slice(0,20);

  return(
    <div>
      <SectionHeader title="⭐ WATCHLIST" sub="Monitorea tus items favoritos en tiempo real"/>
      <div className="card" style={{marginBottom:14}}>
        <div className="label" style={{marginBottom:8}}>Buscar y agregar item</div>
        <input placeholder="Ej: Fibra T6, Espada T7..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:search?8:0}}/>
        {search&&(
          <div style={{maxHeight:200,overflowY:"auto",background:"#0d0d0d",borderRadius:8,border:"1px solid #27272a"}}>
            {filtered.map(item=>(
              <div key={item.id} onClick={()=>{addItem(item);setSearch("");}}
                style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #1a1a1a",display:"flex",justifyContent:"space-between",color:"#d4d4d8"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span>{item.name}</span>
                <span style={{color:"#52525b",fontSize:11}}>{item.cat}</span>
              </div>
            ))}
            {filtered.length===0&&<div style={{padding:12,color:"#52525b",fontSize:13}}>Sin resultados</div>}
          </div>
        )}
      </div>

      {list.length>0&&(
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
          <button className="btn-sm" onClick={refreshPrices} disabled={loading}>
            {loading?<Spinner/>:"🔄 Actualizar precios"}
          </button>
        </div>
      )}

      {list.length===0?(
        <EmptyState icon="⭐" text="Agrega items para monitorearlos"/>
      ):(
        <div style={{display:"grid",gap:10}}>
          {list.map(item=>{
            const p=prices[item.id]||{};
            const spread=p.buy&&p.sell?(p.buy-p.sell):null;
            const roi=spread&&p.sell?((spread/p.sell)*100).toFixed(1):null;
            return(
              <div key={item.id} className="card" style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{item.name}</div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    <div><span style={{color:"#52525b",fontSize:11}}>COMPRA MIN </span><span style={{color:"#4ade80",fontWeight:700}}>{p.sell?fmt(p.sell):"—"}</span></div>
                    <div><span style={{color:"#52525b",fontSize:11}}>VENTA MAX </span><span style={{color:"#f59e0b",fontWeight:700}}>{p.buy?fmt(p.buy):"—"}</span></div>
                    {spread!==null&&<div><span style={{color:"#52525b",fontSize:11}}>SPREAD </span><span style={{color:spread>0?"#60a5fa":"#ef4444",fontWeight:700}}>{spread>0?"+":""}{fmt(spread)}</span></div>}
                    {roi!==null&&<div><span style={{color:"#52525b",fontSize:11}}>ROI </span><span style={{color:parseFloat(roi)>0?"#4ade80":"#ef4444",fontWeight:700}}>{roi}%</span></div>}
                  </div>
                </div>
                <button onClick={()=>removeItem(item.id)} style={{background:"transparent",border:"1px solid #3f3f46",color:"#71717a",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Item Search ───────────────────────────────────────────
function ItemSearchTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState(null);
  const [prices,setPrices]=useState([]);
  const [loading,setLoading]=useState(false);

  const results=useMemo(()=>ALL_ITEMS.filter(i=>
    i.name.toLowerCase().includes(query.toLowerCase())||
    i.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0,30),[query]);

  const selectItem=async(item)=>{
    setSelected(item); setLoading(true);
    const data=await fetchPrices(item.id);
    setPrices(data); setLoading(false);
  };

  const bestBuy=prices.filter(p=>p.sell_price_min>0).sort((a,b)=>a.sell_price_min-b.sell_price_min)[0];
  const bestSell=prices.filter(p=>p.buy_price_max>0).sort((a,b)=>b.buy_price_max-a.buy_price_max)[0];

  return(
    <div>
      <SectionHeader title="🔎 BUSCADOR DE ITEMS" sub="Precio en todas las ciudades de cualquier item"/>
      <div className="card" style={{marginBottom:14}}>
        <input placeholder="Busca cualquier item: arma, recurso, armadura..." value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);setPrices([]);}}/>
        {query&&!selected&&(
          <div style={{marginTop:8,maxHeight:240,overflowY:"auto",background:"#0d0d0d",borderRadius:8,border:"1px solid #27272a"}}>
            {results.map(item=>(
              <div key={item.id} onClick={()=>selectItem(item)}
                style={{padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1a1a1a",transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:"#d4d4d8",fontSize:14,fontWeight:600}}>{item.name}</span>
                <span style={{fontSize:11,color:"#52525b",padding:"2px 8px",background:"#27272a",borderRadius:10}}>{item.cat} · T{item.tier}</span>
              </div>
            ))}
            {results.length===0&&<div style={{padding:14,color:"#52525b",fontSize:13}}>Sin resultados para "{query}"</div>}
          </div>
        )}
      </div>

      {loading&&<div style={{textAlign:"center",padding:30}}><Spinner size={28}/></div>}

      {selected&&prices.length>0&&!loading&&(
        <div>
          <div className="card" style={{marginBottom:14,borderColor:"#f59e0b33"}}>
            <div style={{fontSize:20,fontWeight:700,color:"#f59e0b",marginBottom:4}}>{selected.name}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
              {bestBuy&&<div style={{padding:"8px 14px",background:"#052e16",border:"1px solid #4ade8033",borderRadius:8,fontSize:13}}>
                <div className="label">Mejor precio de compra</div>
                <div style={{fontWeight:700,color:"#4ade80",fontSize:16}}>{fmt(bestBuy.sell_price_min)} — <span style={{color:"#71717a"}}>{bestBuy.city}</span></div>
              </div>}
              {bestSell&&<div style={{padding:"8px 14px",background:"#422006",border:"1px solid #f59e0b33",borderRadius:8,fontSize:13}}>
                <div className="label">Mejor precio de venta</div>
                <div style={{fontWeight:700,color:"#f59e0b",fontSize:16}}>{fmt(bestSell.buy_price_max)} — <span style={{color:"#71717a"}}>{bestSell.city}</span></div>
              </div>}
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{color:"#52525b"}}>
                {["Ciudad","Compra min","Venta max","Spread","ROI"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",borderBottom:"1px solid #27272a",fontWeight:600,fontSize:11,textTransform:"uppercase"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {CITIES.map(city=>{
                  const row=prices.find(p=>p.city===city)||{};
                  const buy=row.sell_price_min||0;
                  const sell=row.buy_price_max||0;
                  const spread=sell-buy;
                  const roi=buy>0?((spread/buy)*100).toFixed(1):null;
                  return(
                    <tr key={city} style={{borderBottom:"1px solid #18181b"}}>
                      <td style={{padding:"9px 10px",color:"#f59e0b",fontWeight:700}}>{city}</td>
                      <td style={{padding:"9px 10px",color:"#4ade80"}}>{buy>0?fmt(buy):"—"}</td>
                      <td style={{padding:"9px 10px",color:"#60a5fa"}}>{sell>0?fmt(sell):"—"}</td>
                      <td style={{padding:"9px 10px",color:spread>0?"#4ade80":"#ef4444"}}>{spread>0?"+":""}{spread?fmt(spread):"—"}</td>
                      <td style={{padding:"9px 10px",color:parseFloat(roi)>0?"#4ade80":"#71717a"}}>{roi?`${roi}%`:"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!selected&&!loading&&!query&&<EmptyState icon="🔎" text="Escribe para buscar cualquier item del juego"/>}
    </div>
  );
}

// ── Top Profitable Items ──────────────────────────────────
function TopProfitTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(false);
  const [catFilter,setCatFilter]=useState("todos");
  const [scanned,setScanned]=useState(false);
  const [progress,setProgress]=useState(0);

  const scan=async()=>{
    setLoading(true);setItems([]);setScanned(false);setProgress(0);
    const results=[];
    const BATCH=15;
    for(let i=0;i<ALL_ITEMS.length;i+=BATCH){
      const batch=ALL_ITEMS.slice(i,i+BATCH);
      const ids=batch.map(x=>x.id).join(",");
      setProgress(Math.round(((i+BATCH)/ALL_ITEMS.length)*100));
      const data=await fetchPrices(ids);
      const grouped={};
      data.forEach(e=>{if(!grouped[e.item_id])grouped[e.item_id]=[];grouped[e.item_id].push(e);});
      Object.entries(grouped).forEach(([id,entries])=>{
        const withSell=entries.filter(e=>e.sell_price_min>0);
        const withBuy=entries.filter(e=>e.buy_price_max>0);
        if(!withSell.length||!withBuy.length) return;
        const cheapest=withSell.reduce((a,b)=>a.sell_price_min<b.sell_price_min?a:b);
        const priciest=withBuy.reduce((a,b)=>a.buy_price_max>b.buy_price_max?a:b);
        if(cheapest.city===priciest.city) return;
        const profit=priciest.buy_price_max-cheapest.sell_price_min;
        const roi=((profit/cheapest.sell_price_min)*100).toFixed(1);
        if(profit>500&&parseFloat(roi)>5){
          const meta=ALL_ITEMS.find(x=>x.id===id);
          results.push({id,name:meta?.name||id,cat:meta?.cat||"?",tier:meta?.tier||0,
            cityBuy:cheapest.city,cityBell:priciest.city,
            buy:cheapest.sell_price_min,sell:priciest.buy_price_max,profit,roi:parseFloat(roi)});
        }
      });
    }
    results.sort((a,b)=>b.profit-a.profit);
    setItems(results.slice(0,50));setScanned(true);setLoading(false);setProgress(100);
  };

  const filtered=catFilter==="todos"?items:items.filter(x=>x.cat===catFilter);
  const cats=["todos","recurso","arma","armadura"];

  return(
    <div>
      <SectionHeader title="🏆 TOP ITEMS MÁS RENTABLES" sub={`Scanner completo de ${ALL_ITEMS.length} items · mejores oportunidades del mercado`}/>
      <div className="card" style={{marginBottom:14}}>
        <button className="btn" onClick={scan} disabled={loading} style={{width:"100%"}}>
          {loading?<><Spinner/>&nbsp; Escaneando {ALL_ITEMS.length} items ({progress}%)…</>:`🚀 ESCANEAR TODO (${ALL_ITEMS.length} items)`}
        </button>
        {loading&&(
          <div style={{marginTop:10}}>
            <div style={{height:6,background:"#27272a",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#d97706,#4ade80)",borderRadius:4,transition:"width .3s"}}/>
            </div>
          </div>
        )}
      </div>

      {scanned&&(
        <>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)}
                style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${catFilter===c?"#f59e0b":"#27272a"}`,background:catFilter===c?"#f59e0b22":"transparent",color:catFilter===c?"#f59e0b":"#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all .2s"}}>
                {c==="todos"?`Todos (${items.length})`:`${c} (${items.filter(x=>x.cat===c).length})`}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gap:8}}>
            {filtered.map((item,i)=>(
              <div key={item.id} className="card" style={{display:"flex",gap:12,alignItems:"center",borderLeft:`3px solid ${item.roi>50?"#4ade80":item.roi>20?"#f59e0b":"#71717a"}`,padding:"12px 16px"}}>
                <div style={{width:28,height:28,background:"#09090b",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#52525b",flexShrink:0}}>#{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{item.name}</div>
                  <div style={{fontSize:12,color:"#71717a"}}><span style={{color:"#60a5fa"}}>{item.cityBuy}</span> ({fmt(item.buy)}) → <span style={{color:"#f59e0b"}}>{item.cityBell}</span> ({fmt(item.sell)})</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:700,color:"#4ade80",fontFamily:"Oswald"}}>+{fmt(item.profit)}</div>
                  <div style={{fontSize:11,color:"#71717a"}}>ROI {item.roi}%</div>
                </div>
                <div style={{padding:"4px 10px",borderRadius:16,fontSize:11,fontWeight:700,background:item.roi>50?"#052e16":item.roi>20?"#422006":"#18181b",color:item.roi>50?"#4ade80":item.roi>20?"#f59e0b":"#71717a",flexShrink:0}}>
                  {item.roi>50?"🔥 HOT":item.roi>20?"✅ OK":"📊 BAJO"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {!scanned&&!loading&&<EmptyState icon="🏆" text="Presiona Escanear para encontrar los mejores profits del mercado"/>}
    </div>
  );
}

// ── Arbitrage ─────────────────────────────────────────────
function ArbitrageTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState([]);
  const [minProfit,setMinProfit]=useState(5000);
  const [minRoi,setMinRoi]=useState(5);
  const [qty,setQty]=useState(500);
  const [scanned,setScanned]=useState(false);
  const [progress,setProgress]=useState(0);

  const scan=async()=>{
    setLoading(true);setResults([]);setScanned(false);setProgress(0);
    const allOpps=[];
    const BATCH=12;
    for(let i=0;i<TRANSPORT_ITEMS.length;i+=BATCH){
      const batch=TRANSPORT_ITEMS.slice(i,i+BATCH);
      const ids=batch.map(x=>x.id).join(",");
      setProgress(Math.round(((i+BATCH)/TRANSPORT_ITEMS.length)*100));
      const data=await fetchPrices(ids);
      const grouped={};
      data.forEach(e=>{if(!grouped[e.item_id])grouped[e.item_id]=[];grouped[e.item_id].push(e);});
      Object.entries(grouped).forEach(([itemId,entries])=>{
        const withSell=entries.filter(e=>e.sell_price_min>0);
        const withBuy=entries.filter(e=>e.buy_price_max>0);
        if(!withSell.length||!withBuy.length) return;
        withSell.forEach(buyEntry=>{
          withBuy.forEach(sellEntry=>{
            if(buyEntry.city===sellEntry.city) return;
            const buyP=buyEntry.sell_price_min,sellP=sellEntry.buy_price_max;
            if(buyP<=0||sellP<=0) return;
            const inv=buyP*qty,rev=sellP*qty,tax=rev*0.03,net=rev-tax-inv;
            const roi=((net/inv)*100).toFixed(1);
            if(net>=minProfit&&parseFloat(roi)>=minRoi){
              const meta=TRANSPORT_ITEMS.find(x=>x.id===itemId);
              allOpps.push({id:itemId,name:meta?.name||itemId,cityBuy:buyEntry.city,citySell:sellEntry.city,buyPrice:buyP,sellPrice:sellP,inv:Math.round(inv),net:Math.round(net),roi:parseFloat(roi),perUnit:sellP-buyP});
            }
          });
        });
      });
    }
    const deduped={};
    allOpps.forEach(op=>{const k=`${op.id}-${op.cityBuy}-${op.citySell}`;if(!deduped[k]||op.net>deduped[k].net)deduped[k]=op;});
    setResults(Object.values(deduped).sort((a,b)=>b.net-a.net).slice(0,30));
    setScanned(true);setLoading(false);
  };

  return(
    <div>
      <SectionHeader title="📦 ARBITRAJE ENTRE CIUDADES" sub="Compra barato en una ciudad, vende caro en otra"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <div><div className="label">Cantidad</div><input type="number" value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Profit mínimo</div><input type="number" value={minProfit} onChange={e=>setMinProfit(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">ROI mínimo %</div><input type="number" value={minRoi} onChange={e=>setMinRoi(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
        </div>
        <button className="btn" onClick={scan} disabled={loading} style={{width:"100%"}}>
          {loading?<><Spinner/>&nbsp; Escaneando ({progress}%)…</>:`🔍 ESCANEAR ARBITRAJE`}
        </button>
        {loading&&<div style={{marginTop:8,height:4,background:"#27272a",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#f59e0b,#4ade80)",transition:"width .3s"}}/></div>}
      </div>

      {scanned&&results.length===0&&<EmptyState icon="📦" text="Sin rutas que superen los filtros. Baja profit/ROI mínimo."/>}
      {results.length>0&&(
        <div style={{display:"grid",gap:10}}>
          {results.map((op,i)=>{
            const hot=op.roi>=20;
            return(
              <div key={i} className="card" style={{borderLeft:`3px solid ${hot?"#4ade80":"#f59e0b"}`,padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{width:26,height:26,background:"#09090b",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#52525b",flexShrink:0}}>#{i+1}</div>
                  <div style={{flex:1,minWidth:140}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{op.name}</div>
                    <div style={{fontSize:12,color:"#71717a"}}><span style={{color:"#60a5fa"}}>{op.cityBuy}</span> ({fmt(op.buyPrice)}) → <span style={{color:"#f59e0b"}}>{op.citySell}</span> ({fmt(op.sellPrice)})</div>
                    <div style={{fontSize:11,color:"#52525b",marginTop:2}}>Inversión: {fmt(op.inv)} · +{fmt(op.perUnit)}/ud</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:18,fontWeight:700,color:"#4ade80",fontFamily:"Oswald"}}>+{fmt(op.net)}</div>
                    <div style={{fontSize:11,color:"#71717a"}}>ROI: {op.roi}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!scanned&&!loading&&<EmptyState icon="📦" text="Configura los filtros y presiona Escanear"/>}
    </div>
  );
}

// ── Refining Calc ─────────────────────────────────────────
function RefiningTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [tier,setTier]=useState(5);
  const [material,setMaterial]=useState("FIBER");
  const [qty,setQty]=useState(100);
  const [focus,setFocus]=useState(false);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [returnRate,setReturnRate]=useState(36.7);

  const outMap={FIBER:"CLOTH",WOOD:"PLANKS",ORE:"METALBAR",HIDE:"LEATHER",ROCK:"STONEBLOCK"};
  const nameMap={FIBER:"Fibra",WOOD:"Madera",ORE:"Mineral",HIDE:"Cuero",ROCK:"Piedra"};
  const outNameMap={CLOTH:"Tela",PLANKS:"Tablas",METALBAR:"Barra Metal",LEATHER:"Cuero Proc",STONEBLOCK:"Bloque Piedra"};

  const calc=async()=>{
    setLoading(true);setResult(null);
    const outPrefix=outMap[material];
    const ids=`T${tier}_${material},T${tier}_${outPrefix},T${tier-1}_${outPrefix}`;
    const data=await fetchPrices(ids);
    const p={};
    data.forEach(e=>{
      if(!p[e.item_id])p[e.item_id]={};
      if(e.sell_price_min>0)p[e.item_id].buy=Math.min(p[e.item_id].buy||Infinity,e.sell_price_min);
      if(e.buy_price_max>0)p[e.item_id].sell=Math.max(p[e.item_id].sell||0,e.buy_price_max);
    });
    const rawPrice=p[`T${tier}_${material}`]?.buy||0;
    const lowerTier=p[`T${tier-1}_${outPrefix}`]?.buy||0;
    const sellPrice=p[`T${tier}_${outPrefix}`]?.sell||0;
    const fee={3:50,4:100,5:200,6:400,7:800,8:1600}[tier]||0;
    const actualReturn=focus?returnRate:returnRate*0.5;
    const returnedMats=Math.floor(qty*8*(actualReturn/100));
    const totalRawNeeded=qty*8-returnedMats;
    const rawCost=rawPrice*qty*8;
    const lowerCost=lowerTier*returnedMats;
    const totalCost=rawCost-lowerCost+(fee*qty);
    const revenue=sellPrice*qty;
    const tax=revenue*0.03;
    const net=revenue-tax-totalCost;
    const roi=totalCost>0?((net/totalCost)*100).toFixed(1):0;
    setResult({rawPrice,sellPrice,lowerTier,rawCost:Math.round(rawCost),fee:fee*qty,totalCost:Math.round(totalCost),revenue:Math.round(revenue),tax:Math.round(tax),net:Math.round(net),roi,returnedMats,rawMaterial:`T${tier}_${material}`,outItem:`T${tier}_${outPrefix}`});
    setLoading(false);
  };

  return(
    <div>
      <SectionHeader title="⚗️ CALCULADORA DE REFINADO" sub="¿Vale la pena refinar o mejor vender el raw?"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <div className="label">Material</div>
            <select value={material} onChange={e=>setMaterial(e.target.value)}>
              {Object.entries(nameMap).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Tier</div>
            <select value={tier} onChange={e=>setTier(parseInt(e.target.value))}>
              {[3,4,5,6,7,8].filter(t=>!(material==="ROCK"&&t===8)).map(t=><option key={t} value={t}>T{t}</option>)}
            </select>
          </div>
          <div><div className="label">Cantidad a refinar</div><input type="number" value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} onClick={e=>e.stopPropagation()}/></div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
          <div style={{flex:1}}>
            <div className="label">Tasa de retorno (%)</div>
            <input type="number" value={returnRate} onChange={e=>setReturnRate(parseFloat(e.target.value)||0)} onClick={e=>e.stopPropagation()} step="0.1"/>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:16}}>
            <div onClick={()=>setFocus(f=>!f)} style={{width:40,height:22,background:focus?"#f59e0b":"#27272a",borderRadius:11,position:"relative",cursor:"pointer",transition:"background .2s"}}>
              <div style={{width:16,height:16,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:focus?21:3,transition:"left .2s"}}/>
            </div>
            <span style={{fontSize:13,color:focus?"#f59e0b":"#71717a",fontWeight:600}}>Con Focus</span>
          </div>
        </div>
        <button className="btn" onClick={calc} disabled={loading} style={{width:"100%"}}>
          {loading?<><Spinner/>&nbsp; Calculando…</>:"⚗️ CALCULAR REFINADO"}
        </button>
      </div>

      {result&&(
        <div className="card glow" style={{borderColor:result.net>0?"#4ade8055":"#ef444455"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
            {[
              {l:"Raw comprado",v:fmt(result.rawCost),c:"#f97316"},
              {l:"Fee refinado",v:fmt(result.fee),c:"#a78bfa"},
              {l:"Mats devueltos",v:`${result.returnedMats} ud`,c:"#60a5fa"},
              {l:"Costo total neto",v:fmt(result.totalCost),c:"#facc15"},
              {l:"Ingreso venta",v:fmt(result.revenue),c:"#60a5fa"},
              {l:"GANANCIA NETA",v:fmt(result.net),c:result.net>0?"#4ade80":"#ef4444",big:true},
              {l:"ROI",v:`${result.roi}%`,c:parseFloat(result.roi)>0?"#4ade80":"#ef4444",big:true},
            ].map(item=>(
              <div key={item.l} style={{padding:10,background:"#09090b",borderRadius:8}}>
                <div className="label">{item.l}</div>
                <div style={{fontSize:item.big?20:15,fontWeight:700,color:item.c,fontFamily:"Oswald"}}>{item.v}</div>
              </div>
            ))}
          </div>
          <div style={{padding:14,background:result.net>0?"#052e16":"#450a0a",borderRadius:8,fontSize:14,color:result.net>0?"#4ade80":"#f87171"}}>
            {result.net>0
              ?`✅ Refinado rentable. Ganas ${fmt(result.net)} silver neto con ${qty}x ${outNameMap[outMap[material]]}.`
              :`❌ No rentable. Mejor vender el raw directamente o esperar mejores precios.`}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Focus Efficiency ──────────────────────────────────────
function FocusTab(){
  const [focusMax,setFocusMax]=useState(30000);
  const [focusRegen,setFocusRegen]=useState(10000);
  const [focusCost,setFocusCost]=useState(1000);
  const [bonus,setBonus]=useState(43.5);
  const [craft,setCraft]=useState(50);

  const sessionsPerDay=focusRegen>0?Math.floor(focusMax/focusRegen):1;
  const craftsWithFocus=Math.floor(focusMax/focusCost);
  const profitBonus=craftsWithFocus*(bonus/100)*craft;
  const focusEfficiency=(focusRegen/focusMax*100).toFixed(1);

  return(
    <div>
      <SectionHeader title="🎯 CALCULADORA DE FOCUS" sub="Optimiza el uso de tu Focus para máximo profit"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><div className="label">Focus máximo</div><input type="number" value={focusMax} onChange={e=>setFocusMax(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Regeneración diaria</div><input type="number" value={focusRegen} onChange={e=>setFocusRegen(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Costo focus por craft</div><input type="number" value={focusCost} onChange={e=>setFocusCost(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Bonus retorno % (con focus)</div><input type="number" step="0.1" value={bonus} onChange={e=>setBonus(parseFloat(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
          <div style={{gridColumn:"1/-1"}}><div className="label">Profit por craft (silver)</div><input type="number" value={craft} onChange={e=>setCraft(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        {[
          {l:"Crafts con focus/día",v:craftsWithFocus,c:"#f59e0b"},
          {l:"Sesiones estimadas",v:sessionsPerDay,c:"#60a5fa"},
          {l:"Eficiencia focus",v:`${focusEfficiency}%`,c:"#a78bfa"},
          {l:"Bonus profit diario",v:`+${fmt(Math.round(profitBonus))}`,c:"#4ade80"},
        ].map(item=>(
          <div key={item.l} className="card" style={{textAlign:"center"}}>
            <div className="label">{item.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:item.c,fontFamily:"Oswald",marginTop:4}}>{item.v}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{marginTop:14,borderColor:"#f59e0b33"}}>
        <div style={{fontSize:13,color:"#a1a1aa",lineHeight:1.7}}>
          <strong style={{color:"#f59e0b"}}>💡 Tips de Focus:</strong><br/>
          • Premium duplica tu regeneración de Focus diaria.<br/>
          • Usa Focus solo en items de alto tier (T6+) para maximizar retorno.<br/>
          • El Focus con retorno de materiales reduce tu costo de producción en ~43%.<br/>
          • Planifica crafts en batch para no desperdiciar Focus regenerado.
        </div>
      </div>
    </div>
  );
}

// ── Break-Even & Tax Optimizer ────────────────────────────
function BreakEvenTab(){
  const [cost,setCost]=useState("");
  const [tax,setTax]=useState(3);
  const [qty,setQty]=useState(1);
  const [desired,setDesired]=useState("");

  const breakEvenPrice=cost&&qty?(parseFloat(cost)/(parseInt(qty)||1)/(1-tax/100)).toFixed(0):null;
  const profitAtDesired=desired&&cost&&qty?Math.round((parseFloat(desired)*(1-tax/100)-parseFloat(cost)/parseInt(qty||1))*parseInt(qty||1)):null;

  return(
    <div>
      <SectionHeader title="⚖️ BREAK-EVEN & TAX OPTIMIZER" sub="Calcula el precio mínimo de venta y optimiza impuestos"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div className="card">
          <div style={{fontSize:15,fontWeight:700,color:"#f59e0b",marginBottom:12}}>Break-Even Calculator</div>
          <div style={{display:"grid",gap:10}}>
            <div><div className="label">Costo total inversión</div><input type="number" placeholder="500000" value={cost} onChange={e=>setCost(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
            <div><div className="label">Cantidad de items</div><input type="number" placeholder="100" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
            <div><div className="label">Tax % del mercado</div><input type="number" placeholder="3" value={tax} onChange={e=>setTax(parseFloat(e.target.value)||0)} onClick={e=>e.stopPropagation()} step="0.1"/></div>
          </div>
          {breakEvenPrice&&(
            <div style={{marginTop:14,padding:14,background:"#422006",border:"1px solid #f59e0b44",borderRadius:8,textAlign:"center"}}>
              <div className="label">Precio mínimo de venta (break-even)</div>
              <div style={{fontSize:28,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald"}}>{fmt(parseInt(breakEvenPrice))}</div>
              <div style={{fontSize:12,color:"#71717a",marginTop:4}}>Por debajo de este precio pierdes silver</div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{fontSize:15,fontWeight:700,color:"#60a5fa",marginBottom:12}}>Profit a precio deseado</div>
          <div style={{display:"grid",gap:10}}>
            <div><div className="label">Precio de venta deseado</div><input type="number" placeholder="7500" value={desired} onChange={e=>setDesired(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          </div>
          {profitAtDesired!==null&&(
            <div style={{marginTop:14,padding:14,background:profitAtDesired>0?"#052e16":"#450a0a",border:`1px solid ${profitAtDesired>0?"#4ade8044":"#ef444444"}`,borderRadius:8,textAlign:"center"}}>
              <div className="label">Ganancia estimada</div>
              <div style={{fontSize:28,fontWeight:700,color:profitAtDesired>0?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{profitAtDesired>0?"+":""}{fmt(profitAtDesired)}</div>
              <div style={{fontSize:12,color:"#71717a",marginTop:4}}>{profitAtDesired>0?"Rentable ✅":"Pérdidas ❌"}</div>
            </div>
          )}
          <div style={{marginTop:12,padding:12,background:"#0d0d0d",borderRadius:8,fontSize:12,color:"#71717a",lineHeight:1.6}}>
            <strong style={{color:"#a1a1aa"}}>Tax reference:</strong><br/>
            Premium: 3% · Sin premium: 4.5%<br/>
            Caerleon Black Market: 3%<br/>
            Guild hall: reduce hasta 0%
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft vs Buy Analyzer ─────────────────────────────────
function CraftVsBuyTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [itemId,setItemId]=useState("T5_METALBAR");
  const [qty,setQty]=useState(10);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [search,setSearch]=useState("");

  const craftable=PROC_RECIPES;
  const filtered=craftable.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())).slice(0,15);

  const analyze=async(recipe)=>{
    setLoading(true);setResult(null);
    const ids=[recipe.id,...recipe.mat.map(m=>m.id)].join(",");
    const data=await fetchPrices(ids);
    const p={};
    data.forEach(e=>{
      if(!p[e.item_id])p[e.item_id]={};
      if(e.sell_price_min>0)p[e.item_id].buy=Math.min(p[e.item_id].buy||Infinity,e.sell_price_min);
      if(e.buy_price_max>0)p[e.item_id].sell=Math.max(p[e.item_id].sell||0,e.buy_price_max);
    });
    let matCost=0;
    for(const m of recipe.mat){matCost+=(p[m.id]?.buy||0)*m.qty*qty;}
    const fee=recipe.fee*qty;
    const craftCost=matCost+fee;
    const buyPrice=(p[recipe.id]?.buy||0)*qty;
    const sellPrice=(p[recipe.id]?.sell||0)*qty;
    const craftSellRevenue=sellPrice*(1-0.03);
    const craftProfit=craftSellRevenue-craftCost;
    const buyAndSellProfit=craftSellRevenue-buyPrice;
    setResult({craftCost:Math.round(craftCost),buyPrice:Math.round(buyPrice),sellRevenue:Math.round(craftSellRevenue),craftProfit:Math.round(craftProfit),buyAndSellProfit:Math.round(buyAndSellProfit),recommendation:craftProfit>buyAndSellProfit?"craft":"buy",name:recipe.name});
    setLoading(false);
  };

  return(
    <div>
      <SectionHeader title="🔨 CRAFT vs COMPRAR" sub="¿Vale más fabricar o comprar directo en el mercado?"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{marginBottom:12}}>
          <div className="label">Buscar item</div>
          <input placeholder="Ej: Barra Metal T5, Tablas T6..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {search&&(
          <div style={{maxHeight:200,overflowY:"auto",background:"#0d0d0d",borderRadius:8,border:"1px solid #27272a",marginBottom:12}}>
            {filtered.map(r=>(
              <div key={r.id} onClick={()=>{analyze(r);setSearch("");}}
                style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #1a1a1a",fontSize:13,color:"#d4d4d8",transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {r.name} — fee: {fmt(r.fee)}
              </div>
            ))}
          </div>
        )}
        <div><div className="label">Cantidad</div><input type="number" value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} onClick={e=>e.stopPropagation()}/></div>
      </div>

      {loading&&<div style={{textAlign:"center",padding:30}}><Spinner size={28}/></div>}
      {result&&(
        <div>
          <div style={{marginBottom:14,padding:"12px 16px",background:`linear-gradient(135deg,${result.recommendation==="craft"?"#052e16":"#1a0a00"},#0d0d0d)`,border:`1px solid ${result.recommendation==="craft"?"#4ade8044":"#f59e0b44"}`,borderRadius:12,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:result.recommendation==="craft"?"#4ade80":"#f59e0b",marginBottom:4}}>
              {result.recommendation==="craft"?"🔨 RECOMIENDA FABRICAR":"🛒 RECOMIENDA COMPRAR"}
            </div>
            <div style={{fontSize:13,color:"#71717a"}}>{result.name} × {qty}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="card" style={{borderColor:"#4ade8033"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#4ade80",marginBottom:10}}>🔨 FABRICAR</div>
              <div className="label">Costo fabricación</div>
              <div style={{fontSize:16,fontWeight:700,color:"#f97316",marginBottom:8}}>{fmt(result.craftCost)}</div>
              <div className="label">Ganancia al vender</div>
              <div style={{fontSize:20,fontWeight:700,color:result.craftProfit>0?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{result.craftProfit>0?"+":""}{fmt(result.craftProfit)}</div>
            </div>
            <div className="card" style={{borderColor:"#f59e0b33"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#f59e0b",marginBottom:10}}>🛒 COMPRAR Y VENDER</div>
              <div className="label">Costo compra</div>
              <div style={{fontSize:16,fontWeight:700,color:"#f97316",marginBottom:8}}>{fmt(result.buyPrice)}</div>
              <div className="label">Ganancia al revender</div>
              <div style={{fontSize:20,fontWeight:700,color:result.buyAndSellProfit>0?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{result.buyAndSellProfit>0?"+":""}{fmt(result.buyAndSellProfit)}</div>
            </div>
          </div>
        </div>
      )}
      {!result&&!loading&&<EmptyState icon="🔨" text="Busca un item para comparar si conviene fabricar o comprar"/>}
    </div>
  );
}

// ── AI Advisor ────────────────────────────────────────────
function AIAdvisorTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [silver,setSilver]=useState("");
  const [time,setTime]=useState("");
  const [prof,setProf]=useState("crafter");
  const [tier,setTier]=useState("T5");
  const [loading,setLoading]=useState(false);
  const [advice,setAdvice]=useState(null);

  const PROFS={
    crafter:{label:"Crafter",icon:"🔨",strategy:"Fabricar items para vender",items:["METALBAR","PLANKS","CLOTH"]},
    trader:{label:"Trader",icon:"💹",strategy:"Comprar barato, vender caro entre ciudades",items:["FIBER","WOOD","ORE"]},
    refiner:{label:"Refinador",icon:"⚗️",strategy:"Refinar raw materials para vender",items:["HIDE","ROCK","FIBER"]},
    gatherer:{label:"Recolector",icon:"⛏️",strategy:"Farmear recursos y vender",items:["ORE","WOOD","FIBER"]},
  };

  const getAdvice=async()=>{
    setLoading(true);setAdvice(null);
    const profData=PROFS[prof];
    const tNum=parseInt(tier.replace("T",""));
    const ids=profData.items.flatMap(p=>[`T${tNum}_${p}`,`T${tNum+1}_${p}`]).join(",");
    const data=await fetchPrices(ids);
    const prices={};
    data.forEach(e=>{
      if(!prices[e.item_id])prices[e.item_id]={};
      if(e.sell_price_min>0)prices[e.item_id].sell=Math.min(prices[e.item_id].sell||Infinity,e.sell_price_min);
      if(e.buy_price_max>0)prices[e.item_id].buy=Math.max(prices[e.item_id].buy||0,e.buy_price_max);
    });

    const silverNum=parseInt(silver)||0;
    const timeNum=parseInt(time)||60;
    const canDoHighTier=silverNum>=(tNum>=6?500000:200000);

    const recommendations=[];

    if(prof==="crafter"){
      profData.items.forEach(mat=>{
        const id=`T${tNum}_${mat}`;
        const outPrefixes={FIBER:"CLOTH",WOOD:"PLANKS",ORE:"METALBAR",HIDE:"LEATHER",ROCK:"STONEBLOCK"};
        const outId=`T${tNum}_${outPrefixes[mat]}`;
        const rawP=prices[id]?.sell||0;
        const outP=prices[outId]?.buy||0;
        if(rawP>0&&outP>0){
          const craftCost=rawP*8+({3:50,4:100,5:200,6:400,7:800,8:1600}[tNum]||200);
          const net=outP-craftCost;
          if(net>0) recommendations.push({action:`Fabricar ${mat} T${tNum}`,net,roi:((net/craftCost)*100).toFixed(1),detail:`Raw: ${fmt(rawP)} → Output: ${fmt(outP)}`});
        }
      });
    } else if(prof==="trader"){
      profData.items.forEach(mat=>{
        const id=`T${tNum}_${mat}`;
        const rawSell=Math.min(...data.filter(e=>e.item_id===id&&e.sell_price_min>0).map(e=>e.sell_price_min));
        const rawBuy=Math.max(...data.filter(e=>e.item_id===id&&e.buy_price_max>0).map(e=>e.buy_price_max));
        if(rawSell<Infinity&&rawBuy>0&&rawBuy>rawSell){
          const net=rawBuy-rawSell;
          const roi=((net/rawSell)*100).toFixed(1);
          if(net>100) recommendations.push({action:`Arbitraje ${mat} T${tNum}`,net,roi,detail:`Compra: ${fmt(rawSell)} · Vende: ${fmt(rawBuy)}`});
        }
      });
    }

    recommendations.sort((a,b)=>b.net-a.net);

    const summary={
      prof:profData.label,
      icon:profData.icon,
      strategy:profData.strategy,
      silver:silverNum,
      time:timeNum,
      tier,
      canDoHighTier,
      recommendations:recommendations.slice(0,3),
      topAction:recommendations[0]?.action||"No hay datos suficientes ahora",
      estimatedProfit:recommendations.slice(0,3).reduce((s,r)=>s+r.net,0),
      tips:[
        canDoHighTier?`Con ${fmt(silverNum)} silver puedes operar en T${tNum} cómodamente.`:`Considera acumular más silver para operar en tiers más altos.`,
        timeNum<30?`Con ${timeNum} min, enfócate en una sola operación rápida.`:`Con ${timeNum} min tienes tiempo para múltiples operaciones.`,
        `En tu rol de ${profData.label.toLowerCase()}, prioriza calidad sobre cantidad.`,
      ],
    };
    setAdvice(summary);setLoading(false);
  };

  return(
    <div>
      <SectionHeader title="🤖 ASISTENTE IA" sub="Recomendaciones personalizadas según tu perfil y situación"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><div className="label">Tu silver actual</div><input type="number" placeholder="1000000" value={silver} onChange={e=>setSilver(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Tiempo disponible (min)</div><input type="number" placeholder="60" value={time} onChange={e=>setTime(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div>
            <div className="label">Tu profesión</div>
            <select value={prof} onChange={e=>setProf(e.target.value)}>
              {Object.entries(PROFS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Tier objetivo</div>
            <select value={tier} onChange={e=>setTier(e.target.value)}>
              {["T3","T4","T5","T6","T7","T8"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button className="btn" onClick={getAdvice} disabled={loading} style={{width:"100%"}}>
          {loading?<><Spinner/>&nbsp; Analizando mercado…</>:"🤖 OBTENER RECOMENDACIÓN IA"}
        </button>
      </div>

      {advice&&(
        <div>
          <div style={{marginBottom:14,padding:"18px 20px",background:"linear-gradient(135deg,#0a0a14,#0d0d0d)",border:"1px solid #60a5fa33",borderLeft:"4px solid #60a5fa",borderRadius:12}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:28}}>{advice.icon}</span>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:"#60a5fa"}}>{advice.prof} — {advice.tier}</div>
                <div style={{fontSize:12,color:"#52525b"}}>{advice.strategy}</div>
              </div>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:"#f0f0f0",marginBottom:6}}>🎯 Acción recomendada:</div>
            <div style={{fontSize:14,color:"#4ade80",fontWeight:600,marginBottom:12}}>{advice.topAction}</div>

            {advice.recommendations.length>0&&(
              <div style={{display:"grid",gap:8,marginBottom:14}}>
                {advice.recommendations.map((r,i)=>(
                  <div key={i} style={{padding:"10px 14px",background:"#09090b",borderRadius:8,borderLeft:"3px solid #f59e0b",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#d4d4d8"}}>{r.action}</div>
                      <div style={{fontSize:11,color:"#52525b"}}>{r.detail}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#4ade80"}}>+{fmt(r.net)}</div>
                      <div style={{fontSize:11,color:"#71717a"}}>ROI {r.roi}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{borderTop:"1px solid #1a1a1a",paddingTop:12}}>
              <div style={{fontSize:12,fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>💡 Tips personalizados</div>
              {advice.tips.map((tip,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:13,color:"#a1a1aa"}}>
                  <span style={{color:"#f59e0b",flexShrink:0}}>•</span>{tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!advice&&!loading&&<EmptyState icon="🤖" text="Configura tu perfil y obtén recomendaciones personalizadas"/>}
    </div>
  );
}

// ── Portfolio Tracker ─────────────────────────────────────
function PortfolioTab(){
  const [investments,setInvestments]=useState(()=>LS.get("jarvis_portfolio",[]));
  const [form,setForm]=useState({item:"",qty:"",buyPrice:"",currentPrice:"",note:""});

  const add=()=>{
    const qty=parseInt(form.qty),buy=parseInt(form.buyPrice),curr=parseInt(form.currentPrice);
    if(!form.item||!qty||!buy) return;
    const entry={id:Date.now(),item:form.item,qty,buyPrice:buy,currentPrice:curr||buy,note:form.note,date:new Date().toLocaleDateString("es-MX")};
    const updated=[entry,...investments];
    setInvestments(updated);LS.set("jarvis_portfolio",updated);
    setForm({item:"",qty:"",buyPrice:"",currentPrice:"",note:""});
  };
  const remove=(id)=>{const u=investments.filter(x=>x.id!==id);setInvestments(u);LS.set("jarvis_portfolio",u);};
  const update=(id,price)=>{const u=investments.map(x=>x.id===id?{...x,currentPrice:parseInt(price)||x.currentPrice}:x);setInvestments(u);LS.set("jarvis_portfolio",u);};

  const totalInvested=investments.reduce((s,x)=>s+x.buyPrice*x.qty,0);
  const totalCurrent=investments.reduce((s,x)=>s+x.currentPrice*x.qty,0);
  const totalPnL=totalCurrent-totalInvested;
  const pnlPct=totalInvested>0?((totalPnL/totalInvested)*100).toFixed(1):0;

  return(
    <div>
      <SectionHeader title="💼 PORTAFOLIO DE INVERSIONES" sub="Rastrea tus inversiones y P&L en tiempo real"/>

      {investments.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14}}>
          {[
            {l:"Total invertido",v:fmtM(totalInvested),c:"#f97316"},
            {l:"Valor actual",v:fmtM(totalCurrent),c:"#60a5fa"},
            {l:"P&L",v:`${totalPnL>=0?"+":""}${fmtM(Math.round(totalPnL))}`,c:totalPnL>=0?"#4ade80":"#ef4444"},
            {l:"ROI total",v:`${pnlPct}%`,c:parseFloat(pnlPct)>=0?"#4ade80":"#ef4444"},
          ].map(item=>(
            <div key={item.l} className="card" style={{textAlign:"center"}}>
              <div className="label">{item.l}</div>
              <div style={{fontSize:20,fontWeight:700,color:item.c,fontFamily:"Oswald",marginTop:4}}>{item.v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{marginBottom:14}}>
        <div className="label" style={{marginBottom:10}}>+ Nueva inversión</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <input placeholder="Nombre del item" value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} onClick={e=>e.stopPropagation()}/>
          <input type="number" placeholder="Cantidad" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} onClick={e=>e.stopPropagation()}/>
          <input type="number" placeholder="Precio compra" value={form.buyPrice} onChange={e=>setForm(f=>({...f,buyPrice:e.target.value}))} onClick={e=>e.stopPropagation()}/>
          <input type="number" placeholder="Precio actual" value={form.currentPrice} onChange={e=>setForm(f=>({...f,currentPrice:e.target.value}))} onClick={e=>e.stopPropagation()}/>
        </div>
        <button className="btn" onClick={add} style={{width:"100%"}}>AGREGAR AL PORTAFOLIO</button>
      </div>

      {investments.length===0?<EmptyState icon="💼" text="Agrega tu primera inversión para rastrearla"/>:(
        <div style={{display:"grid",gap:10}}>
          {investments.map(inv=>{
            const pnl=(inv.currentPrice-inv.buyPrice)*inv.qty;
            const roi=inv.buyPrice>0?((inv.currentPrice-inv.buyPrice)/inv.buyPrice*100).toFixed(1):0;
            return(
              <div key={inv.id} className="card" style={{borderLeft:`3px solid ${pnl>=0?"#4ade80":"#ef4444"}`}}>
                <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{inv.item}</div>
                    <div style={{fontSize:12,color:"#71717a"}}>
                      {fmt(inv.qty)} ud · Compra: {fmt(inv.buyPrice)} · Actual: 
                      <input type="number" defaultValue={inv.currentPrice} onBlur={e=>update(inv.id,e.target.value)} onClick={e=>e.stopPropagation()} style={{display:"inline",width:80,marginLeft:4,padding:"2px 6px",fontSize:12}}/>
                    </div>
                    {inv.note&&<div style={{fontSize:11,color:"#52525b",marginTop:2}}>{inv.note}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:18,fontWeight:700,color:pnl>=0?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{pnl>=0?"+":""}{fmt(Math.round(pnl))}</div>
                    <div style={{fontSize:11,color:"#71717a"}}>ROI: {roi}%</div>
                  </div>
                  <button onClick={()=>remove(inv.id)} style={{background:"transparent",border:"1px solid #3f3f46",color:"#71717a",borderRadius:6,padding:"5px 9px",cursor:"pointer",fontSize:12}}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Session Tracker ───────────────────────────────────────
function SessionTab(){
  const [sessions,setSessions]=useState(()=>LS.get("jarvis_sessions",[]));
  const [form,setForm]=useState({silverStart:"",silverEnd:"",duration:"",activity:"Farmeo",note:""});
  const [goal,setGoal]=useState(()=>LS.get("jarvis_goal",""));
  const ACTIVITIES=["Farmeo","Transporte","Crafting","Trading","Sniper","Zona Negra","Dungeons","Arbitraje","Otro"];

  const add=()=>{
    const start=parseInt(form.silverStart),end=parseInt(form.silverEnd),dur=parseInt(form.duration);
    if(isNaN(start)||isNaN(end)||isNaN(dur)||dur<=0) return;
    const gained=end-start,perHour=Math.round((gained/dur)*60);
    const s={id:Date.now(),silverStart:start,silverEnd:end,duration:dur,gained,perHour,activity:form.activity,note:form.note,date:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})};
    const updated=[s,...sessions].slice(0,30);
    setSessions(updated);LS.set("jarvis_sessions",updated);
    setForm({silverStart:"",silverEnd:"",duration:"",activity:"Farmeo",note:""});
  };
  const del=(id)=>{const u=sessions.filter(s=>s.id!==id);setSessions(u);LS.set("jarvis_sessions",u);};

  const totalGained=sessions.reduce((s,x)=>s+x.gained,0);
  const totalMin=sessions.reduce((s,x)=>s+x.duration,0);
  const avgH=totalMin>0?Math.round((totalGained/totalMin)*60):0;
  const best=sessions.length>0?sessions.reduce((a,b)=>a.perHour>b.perHour?a:b):null;
  const goalNum=parseInt(goal)||0;
  const goalPct=goalNum>0?Math.min((totalGained/goalNum)*100,100).toFixed(0):0;

  return(
    <div>
      <SectionHeader title="📊 TRACKER DE SESIÓN" sub="Registra cada sesión y visualiza tu progreso"/>

      <div className="card" style={{marginBottom:14,borderColor:"#f59e0b33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div className="label" style={{margin:0}}>🎯 Meta de silver</div>
        </div>
        <input type="number" placeholder="Meta: ej 5000000" value={goal} onChange={e=>{setGoal(e.target.value);LS.set("jarvis_goal",e.target.value);}} onClick={e=>e.stopPropagation()}/>
        {goalNum>0&&(
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span style={{color:"#71717a"}}>{fmt(totalGained)} / {fmt(goalNum)}</span>
              <span style={{color:"#4ade80",fontWeight:700}}>{goalPct}%</span>
            </div>
            <div style={{height:8,background:"#27272a",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${goalPct}%`,background:"linear-gradient(90deg,#d97706,#4ade80)",borderRadius:4,transition:"width .4s"}}/>
            </div>
          </div>
        )}
      </div>

      {sessions.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
          {[
            {l:"Silver total",v:fmtM(totalGained),c:totalGained>=0?"#4ade80":"#ef4444"},
            {l:"Tiempo total",v:`${totalMin} min`,c:"#60a5fa"},
            {l:"Promedio/hora",v:fmtM(avgH),c:"#f59e0b"},
            {l:"Sesiones",v:sessions.length,c:"#a78bfa"},
          ].map(item=>(
            <div key={item.l} className="card" style={{textAlign:"center"}}>
              <div className="label">{item.l}</div>
              <div style={{fontSize:18,fontWeight:700,color:item.c,fontFamily:"Oswald",marginTop:4}}>{item.v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{marginBottom:14}}>
        <div className="label" style={{marginBottom:10}}>+ Registrar sesión</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><div className="label">Silver INICIO</div><input type="number" placeholder="500000" value={form.silverStart} onChange={e=>setForm(f=>({...f,silverStart:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Silver FINAL</div><input type="number" placeholder="750000" value={form.silverEnd} onChange={e=>setForm(f=>({...f,silverEnd:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Duración (min)</div><input type="number" placeholder="45" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Actividad</div><select value={form.activity} onChange={e=>setForm(f=>({...f,activity:e.target.value}))}>{ACTIVITIES.map(a=><option key={a}>{a}</option>)}</select></div>
          <div style={{gridColumn:"1/-1"}}><div className="label">Nota</div><input placeholder="Ej: Fibra T6 en Lymhurst" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
        </div>
        <button className="btn" onClick={add} style={{width:"100%"}}>GUARDAR SESIÓN</button>
      </div>

      {sessions.length===0?<EmptyState icon="📊" text="Registra tu primera sesión para empezar a trackear"/>:(
        <div style={{display:"grid",gap:8}}>
          {sessions.map(s=>{
            const isPos=s.gained>=0,isBest=best?.id===s.id;
            return(
              <div key={s.id} style={{padding:"12px 14px",background:"#18181b",border:`1px solid ${isBest?"#f59e0b44":"#27272a"}`,borderLeft:`3px solid ${isPos?"#4ade80":"#ef4444"}`,borderRadius:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:14}}>{s.activity}</span>
                      {isBest&&<span style={{fontSize:10,background:"#422006",color:"#f59e0b",padding:"2px 7px",borderRadius:10,fontWeight:700}}>MEJOR</span>}
                      <span style={{fontSize:11,color:"#52525b"}}>{s.date}</span>
                    </div>
                    {s.note&&<div style={{fontSize:12,color:"#71717a"}}>{s.note}</div>}
                    <div style={{fontSize:11,color:"#52525b",marginTop:2}}>{s.duration} min · {fmtM(s.perHour)}/h</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{fontSize:18,fontWeight:700,color:isPos?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{isPos?"+":""}{fmtM(s.gained)}</div>
                    <button onClick={()=>del(s.id)} style={{background:"transparent",border:"1px solid #3f3f46",color:"#71717a",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Transport Tab ─────────────────────────────────────────
function TransportTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [itemId,setItemId]=useState("T5_FIBER");
  const [qty,setQty]=useState(1000);
  const [fromCity,setFromCity]=useState("Lymhurst");
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState(null);
  const [error,setError]=useState(null);

  const analyze=async()=>{
    setLoading(true);setError(null);setResults(null);
    const data=await fetchPrices(itemId);
    const byCity={};
    CITIES.forEach(c=>{byCity[c]={buy:null,sell:null};});
    data.forEach(p=>{if(!byCity[p.city]) return;if(p.sell_price_min>0)byCity[p.city].buy=p.sell_price_min;if(p.buy_price_max>0)byCity[p.city].sell=p.buy_price_max;});
    const originBuy=byCity[fromCity]?.buy;
    if(!originBuy){setError("No hay precio de compra en ciudad origen.");setLoading(false);return;}
    const inv=originBuy*qty;
    const options=CITIES.filter(c=>c!==fromCity).map(dest=>{
      const sellP=byCity[dest]?.sell;if(!sellP)return null;
      const rev=sellP*qty,tax=rev*0.03,net=rev-tax-inv,roi=((net/inv)*100).toFixed(1);
      return{city:dest,sellPrice:sellP,revenue:Math.round(rev),tax:Math.round(tax),net:Math.round(net),roi:parseFloat(roi),silverPerItem:sellP-originBuy};
    }).filter(Boolean).sort((a,b)=>b.net-a.net);
    setResults({options,originBuy,inv:Math.round(inv),itemName:TRANSPORT_ITEMS.find(i=>i.id===itemId)?.name||itemId,qty,fromCity});
    setLoading(false);
  };
  const best=results?.options?.[0];

  return(
    <div>
      <SectionHeader title="🚚 CALCULADORA DE TRANSPORTE" sub="Encuentra la mejor ciudad destino para tu mercancía"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div style={{gridColumn:"1/-1"}}><div className="label">Item</div><select value={itemId} onChange={e=>setItemId(e.target.value)}>{TRANSPORT_ITEMS.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
          <div><div className="label">Cantidad</div><input type="number" value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Ciudad origen</div><select value={fromCity} onChange={e=>setFromCity(e.target.value)}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <button className="btn" onClick={analyze} disabled={loading} style={{width:"100%"}}>
          {loading?<><Spinner/>&nbsp; Analizando…</>:"🚚 ANALIZAR RUTA"}
        </button>
      </div>
      {error&&<div style={{padding:12,background:"#450a0a",borderRadius:8,color:"#f87171",fontSize:13,marginBottom:14}}>⚠️ {error}</div>}
      {results&&(
        <div>
          {best&&best.net>0&&(
            <div className="card glow" style={{borderColor:"#4ade8055",marginBottom:14,background:"#052e16"}}>
              <div style={{fontSize:12,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>✅ Mejor ruta</div>
              <div style={{fontSize:16,fontWeight:700,color:"#f0fdf4",marginBottom:10}}>
                {fmt(results.qty)}x {results.itemName} · <span style={{color:"#f59e0b"}}>{results.fromCity}</span> → <span style={{color:"#4ade80"}}>{best.city}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[{l:"Ganancia",v:`+${fmt(best.net)}`,c:"#4ade80"},{l:"ROI",v:`${best.roi}%`,c:"#4ade80"},{l:"Por unidad",v:`+${fmt(best.silverPerItem)}`,c:"#facc15"}].map(x=>(
                  <div key={x.l} style={{padding:10,background:"#09090b",borderRadius:8,textAlign:"center"}}>
                    <div className="label">{x.l}</div>
                    <div style={{fontSize:18,fontWeight:700,color:x.c,fontFamily:"Oswald"}}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"grid",gap:8}}>
            {results.options.map((opt,i)=>{
              const pos=opt.net>0,ibest=i===0&&pos;
              return(
                <div key={opt.city} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 14px",background:ibest?"#052e16":"#18181b",border:`1px solid ${ibest?"#4ade8033":"#27272a"}`,borderRadius:8,borderLeft:`3px solid ${ibest?"#4ade80":pos?"#f59e0b":"#3f3f46"}`}}>
                  <div style={{width:22,height:22,background:"#09090b",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#52525b",flexShrink:0}}>#{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:ibest?"#4ade80":"#d4d4d8",fontSize:14}}>{opt.city}{ibest?" ⭐":""}</div>
                    <div style={{fontSize:11,color:"#71717a"}}>Venta: {fmt(opt.sellPrice)}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:700,color:pos?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{pos?"+":""}{fmt(opt.net)}</div>
                    <div style={{fontSize:11,color:"#71717a"}}>ROI: {opt.roi}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!results&&!loading&&<EmptyState icon="🚚" text="Selecciona un item y ciudad origen para analizar la ruta"/>}
    </div>
  );
}

// ── Black Zone Tab ────────────────────────────────────────
function BlackZoneTab(){
  const [sel,setSel]=useState(null);
  return(
    <div>
      <div style={{marginBottom:20,padding:"18px 20px",background:"linear-gradient(135deg,#0a0505,#1a0a00,#0a0505)",border:"1px solid #3a1a00",borderRadius:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <span style={{fontSize:28}}>🖤</span>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:"#ef4444",fontFamily:"Oswald",letterSpacing:2}}>ZONA NEGRA</div>
            <div style={{fontSize:11,color:"#52525b",letterSpacing:1}}>FULL-LOOT PvP · MÁXIMO PROFIT · MÁXIMO RIESGO</div>
          </div>
          <div style={{marginLeft:"auto",padding:"5px 12px",background:"#450a0a",border:"1px solid #ef444433",borderRadius:20,fontSize:11,fontWeight:700,color:"#ef4444"}}>⚠️ PELIGROSO</div>
        </div>
        <div style={{fontSize:13,color:"#a1a1aa",lineHeight:1.6}}>Recursos T7-T8 valen <strong style={{color:"#4ade80"}}>2-3x más</strong>. Nunca lleves más de lo que puedas perder.</div>
      </div>
      <div style={{display:"grid",gap:12}}>
        {BZ_BUILDS.map(b=>{
          const isSelected=sel===b.id;
          const rc={bajo:"#4ade80",medio:"#facc15",alto:"#f97316"};
          return(
            <div key={b.id} style={{background:"#0d0d0d",border:`1px solid ${isSelected?b.color+"55":"#1f1f1f"}`,borderLeft:`4px solid ${b.color}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"border-color .2s"}} onClick={()=>setSel(isSelected?null:b.id)}>
              <div style={{padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:44,height:44,background:`${b.color}18`,border:`2px solid ${b.color}33`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{b.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontSize:16,fontWeight:700,color:"#f0f0f0"}}>{b.name}</span>
                    <span style={{fontSize:11,padding:"2px 8px",background:`${b.color}22`,border:`1px solid ${b.color}33`,color:b.color,borderRadius:16,fontWeight:700}}>{b.tier}</span>
                    <span style={{fontSize:11,padding:"2px 8px",background:riskBg(b.riesgo),color:rc[b.riesgo]||"#71717a",borderRadius:16,fontWeight:700}}>Riesgo {b.riesgo}</span>
                  </div>
                  <div style={{fontSize:12,color:"#71717a"}}>{b.rol}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:700,color:"#4ade80",fontFamily:"Oswald"}}>{fmtM(b.silver_h)}/h</div>
                  <div style={{fontSize:11,color:"#52525b"}}>Costo: {fmtM(b.costo)}</div>
                </div>
                <span style={{color:"#3f3f46",fontSize:14,marginLeft:6}}>{isSelected?"▲":"▼"}</span>
              </div>
              <div style={{padding:"0 18px 12px",fontSize:12,color:"#a1a1aa"}}>{b.descripcion}</div>
              {isSelected&&(
                <div style={{borderTop:"1px solid #1a1a1a",padding:18}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div>
                      <div style={{fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,fontWeight:700}}>⚔️ Equipamiento</div>
                      {[{s:"Arma",v:b.arma},{s:"Cabeza",v:b.cabeza},{s:"Pecho",v:b.pecho},{s:"Botas",v:b.botas},{s:"Off-hand",v:b.offhand},{s:"Capa",v:b.capa},{s:"Montura",v:b.montura}].map(x=>(
                        <div key={x.s} style={{display:"flex",gap:8,padding:"5px 8px",background:"#09090b",borderRadius:6,marginBottom:4}}>
                          <span style={{fontSize:10,color:"#52525b",minWidth:54,flexShrink:0}}>{x.s}</span>
                          <span style={{fontSize:12,color:x.v==="—"?"#3f3f46":"#d4d4d8",fontWeight:x.v!=="—"?600:400}}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,fontWeight:700}}>🛡️ Consejos</div>
                      {b.consejos.map((c,i)=>(
                        <div key={i} style={{display:"flex",gap:8,padding:"6px 8px",background:"#09090b",borderRadius:6,marginBottom:4}}>
                          <span style={{color:"#ef4444",fontWeight:700,flexShrink:0,fontSize:12}}>{i+1}.</span>
                          <span style={{fontSize:12,color:"#a1a1aa",lineHeight:1.4}}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profit Calc ───────────────────────────────────────────
function ProfitCalcTab(){
  const [buy,setBuy]=useState("");const [sell,setSell]=useState("");
  const [tax,setTax]=useState(3);const [qty,setQty]=useState(1);
  const [result,setResult]=useState(null);

  const calc=()=>{
    const b=parseFloat(buy),s=parseFloat(sell),t=parseFloat(tax)/100,q=parseInt(qty)||1;
    if(isNaN(b)||isNaN(s)) return;
    const gross=(s-b)*q,taxAmt=s*t*q,net=gross-taxAmt;
    setResult({net:Math.round(net),roi:((net/(b*q))*100).toFixed(1),tax:Math.round(taxAmt),gross:Math.round(gross)});
  };

  return(
    <div>
      <SectionHeader title="💰 CALCULADORA DE PROFIT" sub="Ganancia neta con impuestos incluidos"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><div className="label">Precio compra</div><input type="number" placeholder="0" value={buy} onChange={e=>setBuy(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Precio venta</div><input type="number" placeholder="0" value={sell} onChange={e=>setSell(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Tax % (3% default)</div><input type="number" placeholder="3" value={tax} onChange={e=>setTax(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Cantidad</div><input type="number" placeholder="1" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
        </div>
        <button className="btn" onClick={calc} style={{width:"100%"}}>CALCULAR PROFIT</button>
      </div>
      {result&&(
        <div className="card glow" style={{borderColor:result.net>0?"#4ade8055":"#ef444455"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[{l:"Profit bruto",v:fmt(result.gross),c:"#d4d4d8"},{l:"Impuesto",v:fmt(result.tax),c:"#f97316"},{l:"PROFIT NETO",v:fmt(result.net),c:result.net>0?"#4ade80":"#ef4444",big:true},{l:"ROI",v:`${result.roi}%`,c:parseFloat(result.roi)>0?"#60a5fa":"#ef4444",big:true}].map(x=>(
              <div key={x.l} style={{padding:12,background:"#09090b",borderRadius:8}}>
                <div className="label">{x.l}</div>
                <div style={{fontSize:x.big?24:16,fontWeight:700,color:x.c,fontFamily:"Oswald"}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{padding:12,background:result.net>0?"#052e16":"#450a0a",borderRadius:8,fontSize:13,color:result.net>0?"#4ade80":"#f87171"}}>
            {result.net>0?`✅ Rentable. Ganancia por cada 1000 items: ${fmt(Math.round(result.net/Math.max(parseInt(qty),1)*1000))} silver.`:"❌ Pérdidas. Busca mejor precio."}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────
function DashboardTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  const [prices,setPrices]=useState([]);
  const [loading,setLoading]=useState(false);
  const [lastUp,setLastUp]=useState(null);

  const refresh=useCallback(async()=>{
    setLoading(true);
    const items="T5_PLANKS,T5_ORE,T5_FIBER,T5_WOOD,T6_PLANKS,T6_ORE,T6_FIBER,T6_METALBAR,T6_CLOTH";
    const data=await fetchPrices(items,{cities:["Caerleon","Bridgewatch","Lymhurst","Fort Sterling"]});
    setPrices(data.filter(p=>p.sell_price_min>0||p.buy_price_max>0).slice(0,18));
    setLastUp(new Date().toLocaleTimeString());setLoading(false);
  },[fetchPrices]);

  useEffect(()=>{refresh();},[]);

  const kpis=[
    {label:"Mejor Ruta",value:"Forest Cross",sub:"T6 Madera · 410k/h",icon:"🗺",color:"#4ade80"},
    {label:"Sniper Hot",value:"Escanear",sub:"Oportunidades en vivo",icon:"🎯",color:"#f59e0b"},
    {label:"Zona Negra",value:"1.4M/h est.",sub:"Fantasma Recolector T6",icon:"🖤",color:"#ef4444"},
    {label:"Crafting",value:"METALBAR T6",sub:"ROI ~25% hoy",icon:"🔨",color:"#a78bfa"},
  ];

  return(
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald",letterSpacing:1}}>RESUMEN DEL DÍA</div>
        <div style={{fontSize:13,color:"#52525b"}}>Panel principal · precios en tiempo real</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20}}>
        {kpis.map(k=>(
          <div key={k.label} className="card" style={{borderLeft:`3px solid ${k.color}`}}>
            <div style={{fontSize:20,marginBottom:6}}>{k.icon}</div>
            <div className="label">{k.label}</div>
            <div style={{fontSize:16,fontWeight:700,color:k.color,marginBottom:2}}>{k.value}</div>
            <div style={{fontSize:11,color:"#52525b"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{borderColor:"#f59e0b22"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div className="label" style={{margin:0}}>Precios en vivo ({prices.length} registros)</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {lastUp&&<span style={{fontSize:11,color:"#52525b"}}>Act: {lastUp}</span>}
            <button className="btn-sm" onClick={refresh} disabled={loading}>{loading?<Spinner/>:"🔄"}</button>
          </div>
        </div>
        {loading?<div style={{padding:20,textAlign:"center"}}><Spinner size={24}/></div>:
        prices.length>0?(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{color:"#52525b"}}>
                {["Item","Ciudad","Compra","Venta"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",borderBottom:"1px solid #27272a",fontWeight:600,textTransform:"uppercase",fontSize:10,letterSpacing:1}}>{h}</th>)}
              </tr></thead>
              <tbody>{prices.map((p,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #141414"}}>
                  <td style={{padding:"8px 10px",color:"#d4d4d8",fontWeight:600}}>{p.item_id?.replace(/_/g," ")}</td>
                  <td style={{padding:"8px 10px",color:"#f59e0b"}}>{p.city}</td>
                  <td style={{padding:"8px 10px",color:"#4ade80"}}>{p.buy_price_max>0?fmt(p.buy_price_max):"—"}</td>
                  <td style={{padding:"8px 10px",color:"#60a5fa"}}>{p.sell_price_min>0?fmt(p.sell_price_min):"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ):<div style={{color:"#52525b",fontSize:13,padding:16}}>Sin conexión a la API.</div>}
      </div>
    </div>
  );
}

// ── Shared Utils ──────────────────────────────────────────
function SectionHeader({title,sub}){
  return(
    <div style={{marginBottom:20}}>
      <div style={{fontSize:20,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald",letterSpacing:1}}>{title}</div>
      {sub&&<div style={{fontSize:13,color:"#52525b",marginTop:2}}>{sub}</div>}
    </div>
  );
}
function EmptyState({icon,text}){
  return(
    <div style={{padding:"50px 20px",textAlign:"center",color:"#52525b"}}>
      <div style={{fontSize:36,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:14}}>{text}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function AlbionJarvis(){
  const [server,setServer]=useState("west");
  const apiBase=SERVERS.find(s=>s.id===server)?.url||SERVERS[0].url;
  const [tab,setTab]=useState("dashboard");
  const [serverOpen,setServerOpen]=useState(false);

  const TABS=[
    {id:"dashboard",label:"⚡ Dashboard",group:"main"},
    {id:"profit",label:"💰 Profit",group:"calc"},
    {id:"breakeven",label:"⚖️ Break-Even",group:"calc"},
    {id:"craft_vs_buy",label:"🔨 Craft vs Buy",group:"calc"},
    {id:"refining",label:"⚗️ Refinado",group:"calc"},
    {id:"focus",label:"🎯 Focus",group:"calc"},
    {id:"transport",label:"🚚 Transporte",group:"market"},
    {id:"arbitrage",label:"📦 Arbitraje",group:"market"},
    {id:"top_profit",label:"🏆 Top Profits",group:"market"},
    {id:"item_search",label:"🔎 Buscador",group:"market"},
    {id:"ai_advisor",label:"🤖 Asistente IA",group:"ai"},
    {id:"blackzone",label:"🖤 Zona Negra",group:"bz"},
    {id:"session",label:"📊 Sesión",group:"track"},
    {id:"portfolio",label:"💼 Portafolio",group:"track"},
    {id:"watchlist",label:"⭐ Watchlist",group:"track"},
  ];

  const currentServer=SERVERS.find(s=>s.id===server)||SERVERS[0];

  const groupColors={main:"#f59e0b",calc:"#60a5fa",market:"#4ade80",ai:"#a78bfa",bz:"#ef4444",track:"#f97316"};
  const groupLabels={main:"Principal",calc:"Calculadoras",market:"Mercado",ai:"IA",bz:"Zona Negra",track:"Tracking"};

  const tabGroups=[...new Set(TABS.map(t=>t.group))];

  return(
    <div style={{minHeight:"100vh",background:"#09090b",color:"#e4e4e7",fontFamily:"'Rajdhani','Oswald',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Oswald:wght@400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#18181b}
        ::-webkit-scrollbar-thumb{background:#f59e0b;border-radius:2px}
        input{background:#18181b!important;border:1px solid #3f3f46!important;color:#e4e4e7!important;padding:9px 12px;border-radius:6px;font-family:inherit;font-size:14px;width:100%;outline:none;transition:border-color .2s}
        input:focus{border-color:#f59e0b!important}
        select{background:#18181b;border:1px solid #3f3f46;color:#e4e4e7;padding:9px 12px;border-radius:6px;font-family:inherit;font-size:14px;width:100%;outline:none;cursor:pointer}
        .btn{background:linear-gradient(135deg,#d97706,#f59e0b);color:#000;border:none;padding:11px 22px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:opacity .2s,transform .1s;display:inline-flex;align-items:center;justify-content:center;gap:6px}
        .btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn-sm{background:transparent;border:1px solid #3f3f46;color:#a1a1aa;padding:6px 12px;border-radius:6px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:5px}
        .btn-sm:hover{border-color:#f59e0b;color:#f59e0b}
        .card{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:18px}
        .label{font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;font-weight:700}
        .glow{box-shadow:0 0 24px rgba(245,158,11,.12)}
        .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;animation:pulse 2s infinite;margin-right:5px}
        .tab-content{animation:fadeIn .2s ease-out}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(180deg,#111 0%,#09090b 100%)",borderBottom:"1px solid #1f1f1f",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0 0"}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚔️</div>
            <div>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:2,color:"#f59e0b",fontFamily:"Oswald"}}>ALBION JARVIS</div>
              <div style={{fontSize:10,color:"#52525b",letterSpacing:1}}>ECONOMIC SUITE v5.0 · {ALL_ITEMS.length} items</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
              {/* Server selector */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setServerOpen(o=>!o)} className="btn-sm" style={{gap:6}}>
                  <span>{currentServer.flag}</span><span style={{color:"#f59e0b"}}>{currentServer.label}</span><span style={{fontSize:9,color:"#52525b"}}>▼</span>
                </button>
                {serverOpen&&(
                  <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"#111",border:"1px solid #27272a",borderRadius:10,overflow:"hidden",zIndex:100,minWidth:150,boxShadow:"0 8px 32px rgba(0,0,0,.8)"}}>
                    {SERVERS.map(s=>(
                      <button key={s.id} onClick={()=>{setServer(s.id);setServerOpen(false);}} style={{width:"100%",background:server===s.id?"#f59e0b11":"transparent",border:"none",borderBottom:"1px solid #1a1a1a",color:server===s.id?"#f59e0b":"#d4d4d8",padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{s.flag}</span>{s.label}{server===s.id&&<span style={{marginLeft:"auto"}}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{fontSize:11,color:"#4ade80",display:"flex",alignItems:"center"}}><span className="dot"/>EN VIVO</div>
              <DonationBtn/>
            </div>
          </div>

          {/* ── TAB BAR ── */}
          <div style={{display:"flex",gap:0,marginTop:10,overflowX:"auto",paddingBottom:0}}>
            {tabGroups.map(group=>(
              <div key={group} style={{display:"flex"}}>
                {TABS.filter(t=>t.group===group).map(t=>{
                  const active=tab===t.id;
                  const gc=groupColors[group]||"#f59e0b";
                  return(
                    <button key={t.id} onClick={()=>setTab(t.id)}
                      style={{background:active?gc:"transparent",color:active?"#000":t.id==="blackzone"?"#ef444488":"#71717a",border:"none",padding:"9px 12px",borderRadius:"7px 7px 0 0",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s",borderBottom:active?`2px solid ${gc}`:"2px solid transparent"}}>
                      {t.label}
                    </button>
                  );
                })}
                <div style={{width:1,background:"#27272a",margin:"8px 3px 0",alignSelf:"stretch"}}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}} className="tab-content">
        {tab==="dashboard"&&<DashboardTab apiBase={apiBase}/>}
        {tab==="profit"&&<ProfitCalcTab/>}
        {tab==="breakeven"&&<BreakEvenTab/>}
        {tab==="craft_vs_buy"&&<CraftVsBuyTab apiBase={apiBase}/>}
        {tab==="refining"&&<RefiningTab apiBase={apiBase}/>}
        {tab==="focus"&&<FocusTab/>}
        {tab==="transport"&&<TransportTab apiBase={apiBase}/>}
        {tab==="arbitrage"&&<ArbitrageTab apiBase={apiBase}/>}
        {tab==="top_profit"&&<TopProfitTab apiBase={apiBase}/>}
        {tab==="item_search"&&<ItemSearchTab apiBase={apiBase}/>}
        {tab==="ai_advisor"&&<AIAdvisorTab apiBase={apiBase}/>}
        {tab==="blackzone"&&<BlackZoneTab/>}
        {tab==="session"&&<SessionTab/>}
        {tab==="portfolio"&&<PortfolioTab/>}
        {tab==="watchlist"&&<WatchlistTab apiBase={apiBase}/>}
      </div>

      {/* ── FOOTER ── */}
      <div style={{borderTop:"1px solid #1a1a1a",padding:"16px 20px",textAlign:"center",marginTop:40}}>
        <div style={{fontSize:11,color:"#3f3f46",marginBottom:4}}>
          ALBION JARVIS v5.0 · Datos de <a href="https://albion-online-data.com" target="_blank" rel="noreferrer" style={{color:"#f59e0b",textDecoration:"none"}}>Albion Online Data Project</a> · No afiliado a Sandbox Interactive
        </div>
        <div style={{fontSize:11,color:"#27272a"}}>
          {ALL_ITEMS.length} items · 6 ciudades · 3 servidores · API en tiempo real
        </div>
        <div style={{marginTop:8}}>
          <DonationBtn/>
        </div>
      </div>
    </div>
  );
}
