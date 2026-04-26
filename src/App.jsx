import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   ALBION JARVIS v6.0 — ECONOMIC INTELLIGENCE SUITE
   Bloomberg Terminal for Albion Online Traders
═══════════════════════════════════════════════════════════ */

const CITIES = ["Caerleon","Bridgewatch","Fort Sterling","Lymhurst","Martlock","Thetford"];
const SERVERS = [
  { id:"west",  label:"América",  flag:"🌎", url:"https://west.albion-online-data.com/api/v2/stats/prices" },
  { id:"east",  label:"Asia",     flag:"🌏", url:"https://east.albion-online-data.com/api/v2/stats/prices" },
  { id:"europe",label:"Europa",   flag:"🌍", url:"https://europe.albion-online-data.com/api/v2/stats/prices" },
];

// ── Item Icon Helper ──────────────────────────────────────
const ITEM_ICON_BASE = "https://render.albiononline.com/v1/item";
function ItemIcon({ id, size = 36, style = {} }) {
  const [err, setErr] = useState(false);
  if (!id || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 6,
        background: "#27272a", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: size * 0.4, flexShrink: 0, ...style
      }}>⚔️</div>
    );
  }
  return (
    <img
      src={`${ITEM_ICON_BASE}/${id}.png?count=1&quality=1`}
      alt={id}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 6, objectFit: "contain", flexShrink: 0, background: "#0d0d0d", ...style }}
    />
  );
}

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
  {id:"MAIN_SCIMITAR",name:"Cimitarra"},{id:"2H_DUALSWORD",name:"Espadas Duales"},
  {id:"2H_CLEAVER",name:"Cuchilla"},{id:"MAIN_AXE",name:"Hacha"},{id:"2H_AXE",name:"Hacha 2M"},
  {id:"2H_HALBERD",name:"Alabarda"},{id:"2H_GLAIVE",name:"Guadaña"},{id:"2H_POLEHAMMER",name:"Martillo Asta"},
  {id:"MAIN_MACE",name:"Maza"},{id:"2H_MACE",name:"Maza 2M"},
  {id:"MAIN_HAMMER",name:"Martillo"},{id:"2H_HAMMER",name:"Martillo 2M"},
  {id:"MAIN_DAGGER",name:"Daga"},{id:"2H_DAGGERPAIR",name:"Dagas Dobles"},{id:"MAIN_RAPIER",name:"Estoque"},
  {id:"MAIN_SPEAR",name:"Lanza"},{id:"2H_SPEAR",name:"Lanza 2M"},
  {id:"2H_PIKE",name:"Pica"},{id:"2H_TRIDENT",name:"Tridente"},
  {id:"2H_BOW",name:"Arco"},{id:"2H_WARBOW",name:"Arco de Guerra"},{id:"2H_LONGBOW",name:"Arco Largo"},
  {id:"2H_CROSSBOW",name:"Ballesta"},{id:"MAIN_CROSSBOW",name:"Ballesta 1M"},{id:"2H_HEAVYCROSSBOW",name:"Ballesta Pesada"},
  {id:"MAIN_FIRESTAFF",name:"Baston Fuego"},{id:"2H_FIRESTAFF",name:"Baston Fuego 2M"},{id:"2H_INFERNOSTAFF",name:"Baston Infierno"},
  {id:"MAIN_HOLYSTAFF",name:"Baston Sagrado"},{id:"2H_HOLYSTAFF",name:"Baston Sagrado 2M"},{id:"2H_DIVINESTAFF",name:"Baston Divino"},
  {id:"MAIN_ARCANESTAFF",name:"Baston Arcano"},{id:"2H_ARCANESTAFF",name:"Baston Arcano 2M"},{id:"2H_ENIGMATICSTAFF",name:"Baston Enigmatico"},
  {id:"MAIN_FROSTSTAFF",name:"Baston Hielo"},{id:"2H_FROSTSTAFF",name:"Baston Hielo 2M"},{id:"2H_ICICLESTAFF",name:"Baston Carabano"},
  {id:"MAIN_NATURESTAFF",name:"Baston Natura"},{id:"2H_NATURESTAFF",name:"Baston Natura 2M"},{id:"2H_WILDSTAFF",name:"Baston Silvestre"},
  {id:"2H_CURSEDSTAFF",name:"Baston Maldito"},{id:"MAIN_CURSEDSTAFF",name:"Baston Maldito 1M"},{id:"2H_DEMONICSTAFF",name:"Baston Demonico"},
  {id:"MAIN_QUARTERSTAFF",name:"Baston Cuarteron"},{id:"MAIN_TORCH",name:"Antorcha MH"},
  {id:"2H_SHAPESHIFTER",name:"Bastón Metamorfo"},{id:"MAIN_SCYTHE",name:"Guadaña 1M"},
  {id:"2H_IRONCLADEDSTAFF",name:"Baston Acorazado"},{id:"2H_TWINBLADE",name:"Hoja Gemela"},
  {id:"2H_CAMLANN",name:"Camlann"},{id:"2H_KINGMAKER",name:"Hacedor de Reyes"},
];
const buildWeapons = () => WEAPON_LIST.flatMap(({id,name})=>
  [1,2,3,4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"arma",tier:t})));

const ARMOR_LIST = [
  {type:"HEAD_CLOTH_SET1",name:"Capucha Tela"},{type:"ARMOR_CLOTH_SET1",name:"Tunica Tela"},{type:"SHOES_CLOTH_SET1",name:"Sandalias Tela"},
  {type:"HEAD_CLOTH_SET2",name:"Capucha Erudito"},{type:"ARMOR_CLOTH_SET2",name:"Tunica Erudito"},{type:"SHOES_CLOTH_SET2",name:"Sandalias Erudito"},
  {type:"HEAD_CLOTH_SET3",name:"Capucha Asceta"},{type:"ARMOR_CLOTH_SET3",name:"Tunica Asceta"},{type:"SHOES_CLOTH_SET3",name:"Sandalias Asceta"},
  {type:"HEAD_LEATHER_SET1",name:"Casco Cuero"},{type:"ARMOR_LEATHER_SET1",name:"Armadura Cuero"},{type:"SHOES_LEATHER_SET1",name:"Botas Cuero"},
  {type:"HEAD_LEATHER_SET2",name:"Casco Guarda"},{type:"ARMOR_LEATHER_SET2",name:"Armadura Guarda"},{type:"SHOES_LEATHER_SET2",name:"Botas Guarda"},
  {type:"HEAD_LEATHER_SET3",name:"Casco Merodeador"},{type:"ARMOR_LEATHER_SET3",name:"Armadura Merodeador"},{type:"SHOES_LEATHER_SET3",name:"Botas Merodeador"},
  {type:"HEAD_PLATE_SET1",name:"Yelmo Placa"},{type:"ARMOR_PLATE_SET1",name:"Pecho Placa"},{type:"SHOES_PLATE_SET1",name:"Botas Placa"},
  {type:"HEAD_PLATE_SET2",name:"Yelmo Guardian"},{type:"ARMOR_PLATE_SET2",name:"Pecho Guardian"},{type:"SHOES_PLATE_SET2",name:"Botas Guardian"},
  {type:"HEAD_PLATE_SET3",name:"Yelmo Caballero"},{type:"ARMOR_PLATE_SET3",name:"Pecho Caballero"},{type:"SHOES_PLATE_SET3",name:"Botas Caballero"},
  {type:"HEAD_GATHERER_FIBER",name:"Casco Recolector Fibra"},{type:"ARMOR_GATHERER_FIBER",name:"Pecho Recolector Fibra"},{type:"SHOES_GATHERER_FIBER",name:"Botas Recolector Fibra"},
  {type:"HEAD_GATHERER_WOOD",name:"Casco Recolector Madera"},{type:"ARMOR_GATHERER_WOOD",name:"Pecho Recolector Madera"},{type:"SHOES_GATHERER_WOOD",name:"Botas Recolector Madera"},
  {type:"HEAD_GATHERER_ORE",name:"Casco Recolector Mineral"},{type:"ARMOR_GATHERER_ORE",name:"Pecho Recolector Mineral"},{type:"SHOES_GATHERER_ORE",name:"Botas Recolector Mineral"},
  {type:"HEAD_GATHERER_HIDE",name:"Casco Recolector Cuero"},{type:"ARMOR_GATHERER_HIDE",name:"Pecho Recolector Cuero"},{type:"SHOES_GATHERER_HIDE",name:"Botas Recolector Cuero"},
  {type:"HEAD_GATHERER_ROCK",name:"Casco Recolector Piedra"},{type:"ARMOR_GATHERER_ROCK",name:"Pecho Recolector Piedra"},{type:"SHOES_GATHERER_ROCK",name:"Botas Recolector Piedra"},
  {type:"HEAD_MERCHANT",name:"Sombrero Mercader"},{type:"ARMOR_MERCHANT",name:"Ropa Mercader"},{type:"SHOES_MERCHANT",name:"Botas Mercader"},
];
const buildArmors = () => ARMOR_LIST.flatMap(({type,name})=>
  [1,2,3,4,5,6,7,8].map(t=>({id:`T${t}_${type}`,name:`${name} T${t}`,cat:"armadura",tier:t})));

const OFF_LIST = [
  {id:"OFF_SHIELD",name:"Escudo"},{id:"OFF_TORCH",name:"Antorcha"},
  {id:"OFF_HORN",name:"Cuerno"},{id:"OFF_BOOK",name:"Libro"},
  {id:"OFF_ORB",name:"Orbe"},{id:"OFF_DAGGER",name:"Daga Off"},
  {id:"OFF_TOTEM",name:"Totem"},{id:"OFF_SKULL",name:"Craneo"},
  {id:"OFF_LAMP",name:"Lampara"},{id:"OFF_JESTERCANE",name:"Cetro Bufon"},
];
const buildOffHand = () => OFF_LIST.flatMap(({id,name})=>
  [1,2,3,4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"offhand",tier:t})));

const MOUNT_LIST = [
  {id:"MOUNT_HORSE",name:"Caballo"},{id:"MOUNT_ARMORED_HORSE",name:"Caballo Armado"},
  {id:"MOUNT_GIANT_HORSE",name:"Caballo Gigante"},{id:"MOUNT_DIREWOLF",name:"Lobo Feroz"},
  {id:"MOUNT_DIREBOAR",name:"Jabali Feroz"},{id:"MOUNT_DIREBEAR",name:"Oso Feroz"},
  {id:"MOUNT_RAM",name:"Carnero"},{id:"MOUNT_ARMORED_WOLF",name:"Lobo Armado"},
  {id:"MOUNT_OX",name:"Buey"},{id:"MOUNT_ARMORED_OX",name:"Buey Armado"},
  {id:"MOUNT_SWAMPDRAGON",name:"Dragon Pantano"},
  {id:"MOUNT_COUGAR",name:"Puma"},{id:"MOUNT_ARMORED_COUGAR",name:"Puma Armado"},
  {id:"MOUNT_MOOSE",name:"Alce"},{id:"MOUNT_ARMORED_MOOSE",name:"Alce Armado"},
  {id:"MOUNT_RHINOCEROS",name:"Rinoceronte"},{id:"MOUNT_ARMORED_RHINOCEROS",name:"Rinoceronte Armado"},
  {id:"MOUNT_TERRORBIRD",name:"Ave Terro"},{id:"MOUNT_RABBIT",name:"Conejo"},
];
const buildMounts = () => MOUNT_LIST.flatMap(({id,name})=>
  [3,4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"montura",tier:t})));

const buildBags = () => [
  ...[1,2,3,4,5,6,7,8].map(t=>({id:`T${t}_BAG`,name:`Bolsa T${t}`,cat:"accesorio",tier:t})),
  ...[3,4,5,6,7,8].map(t=>({id:`T${t}_GATHERER_BAG`,name:`Mochila Recolector T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_SATCHEL_OF_INSIGHT`,name:`Morral Conocimiento T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_BEGINNER_BAG`,name:`Bolsa Principiante T${t}`,cat:"accesorio",tier:t})),
];

const buildCapes = () => {
  const cities=[
    {id:"BRIDGEWATCH",name:"Bridgewatch"},{id:"FORTSTERLING",name:"Fort Sterling"},
    {id:"LYMHURST",name:"Lymhurst"},{id:"MARTLOCK",name:"Martlock"},
    {id:"THETFORD",name:"Thetford"},{id:"CAERLEON",name:"Caerleon"},
  ];
  const faction_capes = [
    ...cities.flatMap(c=>[4,5].map(t=>({id:`T${t}_CAPEITEM_FW_${c.id}`,name:`Capa ${c.name} T${t}`,cat:"accesorio",tier:t}))),
  ];
  const extra_capes = [
    ...[4,5,6,7,8].map(t=>({id:`T${t}_CAPEITEM_UNDEAD`,name:`Capa No Muertos T${t}`,cat:"accesorio",tier:t})),
    ...[4,5,6,7,8].map(t=>({id:`T${t}_CAPEITEM_KEEPER`,name:`Capa Guardiana T${t}`,cat:"accesorio",tier:t})),
    ...[4,5,6,7,8].map(t=>({id:`T${t}_CAPEITEM_HERETIC`,name:`Capa Hereje T${t}`,cat:"accesorio",tier:t})),
    ...[4,5,6,7,8].map(t=>({id:`T${t}_CAPEITEM_MORGANA`,name:`Capa Morgana T${t}`,cat:"accesorio",tier:t})),
  ];
  return [...faction_capes, ...extra_capes];
};

const POTION_LIST = [
  {id:"POTION_HEALING",name:"Pocion Curacion"},{id:"POTION_ENERGY",name:"Pocion Energia"},
  {id:"POTION_GIGANTIFY",name:"Pocion Gigante"},{id:"POTION_RESISTANCE",name:"Pocion Resistencia"},
  {id:"POTION_SWIFTNESS",name:"Pocion Velocidad"},{id:"POTION_STICKY",name:"Pocion Pegajosa"},
  {id:"POTION_POISON",name:"Pocion Veneno"},{id:"POTION_CLEANSE",name:"Pocion Limpieza"},
  {id:"POTION_STONESKIN",name:"Pocion Piel Piedra"},
];
const buildPotions = () => POTION_LIST.flatMap(({id,name})=>
  [1,2,3,4,5,6,7].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"consumible",tier:t})));

const FOOD_LIST = [
  {id:"MEAL_ROAST",name:"Asado"},{id:"MEAL_SALAD",name:"Ensalada"},
  {id:"MEAL_SOUP",name:"Sopa"},{id:"MEAL_SANDWICH",name:"Sandwich"},
  {id:"MEAL_PIE",name:"Pastel"},{id:"MEAL_OMELETTE",name:"Tortilla"},
  {id:"MEAL_SEAWEEDSALAD",name:"Ensalada Algas"},{id:"MEAL_ROASTED_PORK",name:"Cerdo Asado"},
  {id:"MEAL_GOOSE_PIE",name:"Pastel Ganso"},{id:"MEAL_TURNIP_SALAD",name:"Ensalada Nabo"},
];
const buildFoods = () => FOOD_LIST.flatMap(({id,name})=>
  [2,3,4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"consumible",tier:t})));

const TOOL_LIST = [
  {id:"2H_TOOL_SIEGEHAMMER",name:"Martillo Asedio"},{id:"2H_TOOL_SICKLE",name:"Hoz"},
  {id:"2H_TOOL_AXE",name:"Hacha Tala"},{id:"2H_TOOL_SKINNKNIFE",name:"Cuchillo Desollador"},
  {id:"2H_TOOL_HAMMER",name:"Pico Minero"},{id:"2H_TOOL_PICKAXE",name:"Pico"},
  {id:"2H_TOOL_FISHING_ROD",name:"Caña de Pescar"},
];
const buildTools = () => TOOL_LIST.flatMap(({id,name})=>
  [1,2,3,4,5,6,7,8].map(t=>({id:`T${t}_${id}`,name:`${name} T${t}`,cat:"herramienta",tier:t})));

const buildAccessories = () => [
  ...[4,5,6,7,8].map(t=>({id:`T${t}_AMULET_MORGANA`,name:`Amuleto Morgana T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_RING_MORGANA`,name:`Anillo Morgana T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_AMULET_UNDEAD`,name:`Amuleto Muerto T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_RING_UNDEAD`,name:`Anillo Muerto T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_AMULET_KEEPER`,name:`Amuleto Guardián T${t}`,cat:"accesorio",tier:t})),
  ...[4,5,6,7,8].map(t=>({id:`T${t}_RING_KEEPER`,name:`Anillo Guardián T${t}`,cat:"accesorio",tier:t})),
];

const ALL_ITEMS = [...new Map([
  ...buildRaw(),...buildProc(),...buildWeapons(),...buildArmors(),
  ...buildOffHand(),...buildMounts(),...buildBags(),...buildCapes(),
  ...buildPotions(),...buildFoods(),...buildTools(),...buildAccessories(),
].map(x=>[x.id,x])).values()];

const TRANSPORT_ITEMS = [...buildRaw(),...buildProc()];

const PROC_RECIPES = PROC.flatMap(({prefix,name})=>
  Array.from({length:(prefix==="STONEBLOCK"?5:6)},(_,i)=>{
    const t=i+3;
    const rawPrefix = {PLANKS:"WOOD",METALBAR:"ORE",LEATHER:"HIDE",CLOTH:"FIBER",STONEBLOCK:"ROCK"}[prefix];
    const rawName = RAW.find(r=>r.prefix===rawPrefix)?.name||rawPrefix;
    return {id:`T${t}_${prefix}`,name:`${name} T${t}`,cat:"recurso",
      mat:[{id:`T${t}_${rawPrefix}`,name:`${rawName} T${t}`,qty:8}],
      out:1,fee:{3:50,4:100,5:200,6:400,7:800,8:1600}[t]};
  }));

// ── Black Zone Builds ─────────────────────────────────────
const BZ_BUILDS = [
  {id:"bz1",name:"Fantasma Recolector",rol:"Escape / Farmeo",tier:"T6",costo:350000,riesgo:"bajo",silver_h:1400000,icon:"👻",color:"#4ade80",
   arma:"T6_2H_TOOL_AXE",armaLabel:"Hacha Tala T6",cabeza:"Capucha Recolector T6",pecho:"Armadura Recolector T6",
   botas:"Botas Mercader T6",offhand:"—",capa:"Capa Fort Sterling T4",montura:"T6_MOUNT_DIREWOLF",monturaLabel:"Lobo Feroz T6",
   descripcion:"El más seguro para zona negra. Prioriza escape sobre DPS. Ideal para principiantes.",
   consejos:["Nunca lleves más de lo que puedas perder","Farmea en bordes del mapa","Usa el dash antes que la capa","Sal si ves 2+ enemigos","La capa de Fort Sterling te da invisibilidad"]},
  {id:"bz2",name:"Asesino Solitario",rol:"PvP / Ganker",tier:"T6-T7",costo:750000,riesgo:"medio",silver_h:2100000,icon:"🗡️",color:"#f97316",
   arma:"T6_2H_DAGGERPAIR",armaLabel:"Dagas Dobles T6",cabeza:"Casco Cuero T6",pecho:"Armadura Cuero T6",
   botas:"Botas Cazador T6",offhand:"—",capa:"Capa Bridgewatch T4",montura:"T6_MOUNT_DIREWOLF",monturaLabel:"Lobo Feroz T6",
   descripcion:"Para jugadores con experiencia PvP. Mata recolectores solos y toma su loot.",
   consejos:["Solo ataca recolectores solos","Guarda E para escapar","Retírate antes de que lleguen sus amigos","Usa cobertura para emboscar","Bridgewatch te da velocidad de ataque"]},
  {id:"bz3",name:"Tanque Dungeons",rol:"PvE Dungeon",tier:"T7",costo:1200000,riesgo:"medio",silver_h:2800000,icon:"🛡️",color:"#60a5fa",
   arma:"T7_2H_MACE",armaLabel:"Maza 2M T7",cabeza:"T7_HEAD_PLATE_SET1",cabezaLabel:"Yelmo Placa T7",pecho:"Pecho Placa T7",
   botas:"Botas Placa T7",offhand:"T7_OFF_SHIELD",offhandLabel:"Escudo T7",capa:"Capa Martlock T4",montura:"T7_MOUNT_ARMORED_HORSE",monturaLabel:"Caballo Armado T7",
   descripcion:"Para farmear Dungeons Randomizados solo. Chests dorados con el mejor loot del juego.",
   consejos:["Entra solo al dungeon","Limpia de adentro hacia afuera","Los chests dorados son el objetivo","Sal si ves otro jugador entrar","Martlock te da Resistencia"]},
  {id:"bz4",name:"Mago del Caos",rol:"AoE PvP",tier:"T6-T7",costo:900000,riesgo:"alto",silver_h:3200000,icon:"🔥",color:"#ef4444",
   arma:"T7_2H_FIRESTAFF",armaLabel:"Baston Fuego 2M T7",cabeza:"Capucha Tela T7",pecho:"Tunica Arcana T7",
   botas:"Sandalias T7",offhand:"—",capa:"Capa Thetford T4",montura:"T7_MOUNT_DIREWOLF",monturaLabel:"Lobo Feroz T7",
   descripcion:"Alto riesgo, máximo daño AoE. Necesita grupo con healer.",
   consejos:["NUNCA vayas solo","Mantente atrás","Burst grupal, no 1v1","Discord obligatorio","Thetford te da bonus de daño"]},
  {id:"bz5",name:"Healer Grupal",rol:"Soporte / ZvZ",tier:"T7",costo:950000,riesgo:"bajo",silver_h:2500000,icon:"💚",color:"#34d399",
   arma:"T7_2H_HOLYSTAFF",armaLabel:"Baston Sagrado 2M T7",cabeza:"Capucha Tela T7",pecho:"Tunica Tela T7",
   botas:"Sandalias Tela T7",offhand:"—",capa:"Capa Lymhurst T4",montura:"T7_MOUNT_ARMORED_HORSE",monturaLabel:"Caballo Armado T7",
   descripcion:"Soporte esencial para grupos. Siempre bienvenido en cualquier grupo de zona negra.",
   consejos:["Siempre con grupo de 5+","Prioriza curar al tanque","Lymhurst te da bono de vida","Nunca al frente del combate","Los healers tienen alta demanda"]},
  {id:"bz6",name:"Sniper de Recursos",rol:"Ganker / Transporte",tier:"T5-T6",costo:500000,riesgo:"medio",silver_h:1800000,icon:"🏹",color:"#a78bfa",
   arma:"T6_2H_BOW",armaLabel:"Arco T6",cabeza:"Casco Cuero T6",pecho:"Armadura Cuero T6",
   botas:"Botas Cuero T6",offhand:"—",capa:"Capa Caerleon T4",montura:"T6_MOUNT_DIREWOLF",monturaLabel:"Lobo Feroz T6",
   descripcion:"Ataca desde lejos y huye rápido. Ideal para interceptar transportadores.",
   consejos:["Posición alta para ventaja","Kite siempre, nunca quieto","Kuca con E en el momento preciso","Caerleon potencia tu daño de arco","Retírate con el Lobo si te rodean"]},
];

const FARM_ZONES = [
  {name:"Highland Cross",tier:"T5-T6",resource:"Piedra/Mineral",risk:"bajo",time:20,silver:290000,pvp:false,zone:"Fort Sterling",
   steps:["1. Sal de Fort Sterling hacia Highland","2. Busca nodos T5+ en la zona","3. Llena la bolsa al 80%","4. Regresa antes de arriesgarte","5. Vende en Fort Sterling o Martlock"],
   gear:"Armadura Recolector + Mochila T5"},
  {name:"Deepwood",tier:"T5",resource:"Madera/Fibra",risk:"bajo",time:22,silver:310000,pvp:false,zone:"Lymhurst",
   steps:["1. Sal de Lymhurst al amanecer (menos gente)","2. Farmea Madera/Fibra T5","3. Evita el centro del mapa","4. Si oyes PvP, retírate a zona azul","5. Vende en Lymhurst o Martlock"],
   gear:"Armadura Recolector Madera + Bolsa T5"},
  {name:"Swamp Cross",tier:"T5-T6",resource:"Fibra",risk:"medio",time:25,silver:380000,pvp:false,zone:"Thetford",
   steps:["1. Grupo de 2-3 recomendado","2. Asigna un lookout para PvP","3. Farmea nodos T6 al sur","4. Retírate con 70% de carga","5. Divide ganancias equitativamente"],
   gear:"Armadura Recolector Fibra + Lobo Feroz T5"},
  {name:"Forest Cross",tier:"T6",resource:"Madera/Fibra",risk:"medio",time:28,silver:410000,pvp:false,zone:"Lymhurst",
   steps:["1. Usa la capa de Lymhurst para el bonus","2. Nodos T6 al este del mapa","3. Mantén siempre escape planeado","4. Llena al 75% y sal","5. Mejor profit en grupo de 3"],
   gear:"Set Recolector Madera T6 + Mochila T6"},
  {name:"Sunsteppe",tier:"T6",resource:"Cuero",risk:"medio",time:30,silver:430000,pvp:true,zone:"Bridgewatch",
   steps:["1. ZONA ROJA: siempre en grupo","2. Ubica salidas de emergencia","3. Farmea Cuero T6 en bordes","4. Retírate si ves >3 enemigos","5. Coordinación por Discord obligatoria"],
   gear:"Set Recolector Cuero T6 + Capa Escape"},
  {name:"Mountain Cross",tier:"T7",resource:"Mineral",risk:"alto",time:35,silver:680000,pvp:true,zone:"Martlock",
   steps:["1. ZONA NEGRA: riesgo máximo","2. Grupo de 5 mínimo recomendado","3. Scout primero, farmea después","4. Siempre con montura lista","5. Divide el loot antes de salir"],
   gear:"Set Recolector Mineral T7 + Lobo Armado T7"},
  {name:"Caerleon Roads",tier:"T7-T8",resource:"Todos",risk:"muy alto",time:45,silver:950000,pvp:true,zone:"Caerleon",
   steps:["1. ZONA NEGRA FULL LOOT","2. Grupo de 10+ o muere intentando","3. Scout con fantasma primero","4. Coordina retiro con Discord","5. El mejor silver/hora del juego"],
   gear:"Set T7+ completo + Lobo Feroz T8"},
];

// ── Best Farm Items Data ──────────────────────────────────
const BEST_FARM_ITEMS = [
  {rank:1,id:"T6_FIBER",name:"Fibra T6",icon:"🌿",silver_h:420000,zone:"Lymhurst/Thetford",risk:"bajo",tip:"Alta demanda para crafting de tela. Fácil de vender en cualquier ciudad.",tag:"TOP"},
  {rank:2,id:"T6_ORE",name:"Mineral T6",icon:"⛏️",silver_h:480000,zone:"Martlock/Fort Sterling",risk:"medio",tip:"Altísima demanda para barras de metal. Precio estable.",tag:"TOP"},
  {rank:3,id:"T6_WOOD",name:"Madera T6",icon:"🌲",silver_h:390000,zone:"Lymhurst",risk:"bajo",tip:"Muy demandada para Tablas. Zona azul disponible.",tag:"BUENO"},
  {rank:4,id:"T7_FIBER",name:"Fibra T7",icon:"🌿",silver_h:650000,zone:"Zona Negra",risk:"alto",tip:"Precio premium pero zona peligrosa. Requiere grupo.",tag:"PREMIUM"},
  {rank:5,id:"T7_ORE",name:"Mineral T7",icon:"⛏️",silver_h:720000,zone:"Zona Negra",risk:"alto",tip:"El raw más valioso. Solo para jugadores experimentados.",tag:"PREMIUM"},
  {rank:6,id:"T6_HIDE",name:"Cuero T6",icon:"🐂",silver_h:450000,zone:"Bridgewatch",risk:"medio",tip:"Alta demanda para armaduras de cuero. Zona roja.",tag:"TOP"},
  {rank:7,id:"T5_FIBER",name:"Fibra T5",icon:"🌿",silver_h:220000,zone:"Thetford/Lymhurst",risk:"bajo",tip:"Perfecto para principiantes. Zona azul segura.",tag:"INICIO"},
  {rank:8,id:"T5_ORE",name:"Mineral T5",icon:"⛏️",silver_h:240000,zone:"Fort Sterling",risk:"bajo",tip:"Buen inicio. Zona segura, fácil de vender.",tag:"INICIO"},
  {rank:9,id:"T6_ROCK",name:"Piedra T6",icon:"🪨",silver_h:310000,zone:"Fort Sterling",risk:"bajo",tip:"Demandada para bloques de piedra. Zona segura.",tag:"BUENO"},
  {rank:10,id:"T7_WOOD",name:"Madera T7",icon:"🌲",silver_h:580000,zone:"Zona Negra",risk:"alto",tip:"Precio alto pero riesgo extremo.",tag:"PREMIUM"},
];

// ── Helpers ───────────────────────────────────────────────
const riskColor = r=>({bajo:"#4ade80",medio:"#facc15",alto:"#f97316","muy alto":"#ef4444"}[r]||"#fff");
const riskBg    = r=>({bajo:"#052e16",medio:"#422006",alto:"#431407","muy alto":"#450a0a"}[r]||"#111");
const fmt = n => typeof n==="number" ? n.toLocaleString("es-MX") : n;
const fmtM = n => n>=1000000?`${(n/1000000).toFixed(2)}M`:n>=1000?`${(n/1000).toFixed(0)}k`:String(n);

function Spinner({size=16}){
  return <div style={{display:"inline-block",width:size,height:size,border:`2px solid #2a2a2a`,borderTop:`2px solid #f59e0b`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;
}

const LS = {
  get:(k,d)=>{ try{const v=localStorage.getItem(k); return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

// ── Confidence Score Engine ───────────────────────────────
function calcConfidence(priceEntry) {
  if (!priceEntry) return 0;
  let score = 0;

  const ageMs = priceEntry.sell_price_min_date
    ? Date.now() - new Date(priceEntry.sell_price_min_date).getTime()
    : Infinity;
  const ageMin = ageMs / 60000;
  if (ageMin < 5) score += 30;
  else if (ageMin < 15) score += 25;
  else if (ageMin < 30) score += 18;
  else if (ageMin < 60) score += 10;
  else score += 3;

  const vol = (priceEntry.sell_price_min_date && priceEntry.buy_price_max_date) ? 50 : 20;
  if (vol >= 100) score += 25;
  else if (vol >= 50) score += 18;
  else if (vol >= 20) score += 12;
  else score += 5;

  const hasLiquidity = priceEntry.sell_price_min > 0 && priceEntry.buy_price_max > 0;
  score += hasLiquidity ? 20 : 5;

  if (priceEntry.sell_price_min > 0 && priceEntry.buy_price_max > 0) {
    const spread = (priceEntry.buy_price_max - priceEntry.sell_price_min) / priceEntry.sell_price_min * 100;
    if (spread < 3) score += 15;
    else if (spread < 8) score += 11;
    else if (spread < 15) score += 6;
    else score += 0;
  }

  score += priceEntry.sell_price_min > 100 ? 10 : 3;

  return Math.min(100, score);
}

function ConfidenceBadge({ score }) {
  const cfg =
    score >= 92 ? { color: "#4ade80", bg: "#052e16", label: "Alta", icon: "🟢" } :
    score >= 75 ? { color: "#facc15", bg: "#422006", label: "Buena", icon: "🟡" } :
    score >= 50 ? { color: "#f97316", bg: "#431407", label: "Riesgo", icon: "🟠" } :
    { color: "#ef4444", bg: "#450a0a", label: "Verificar", icon: "🔴" };
  return (
    <span style={{
      padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700,
      background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.color}44`
    }}>
      {cfg.icon} {cfg.label} {score}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════ */

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

// ── Best Farm Items Tab ───────────────────────────────────
function BestFarmTab({ apiBase }) {
  const fetchPrices = usePrices(apiBase);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("todos");

  const loadPrices = useCallback(async () => {
    setLoading(true);
    const ids = BEST_FARM_ITEMS.map(x => x.id).join(",");
    const data = await fetchPrices(ids);
    const p = {};
    data.forEach(e => {
      if (!p[e.item_id]) p[e.item_id] = {};
      if (e.sell_price_min > 0) p[e.item_id].sell = Math.min(p[e.item_id].sell || Infinity, e.sell_price_min);
      if (e.buy_price_max > 0) p[e.item_id].buy = Math.max(p[e.item_id].buy || 0, e.buy_price_max);
      if (!p[e.item_id].raw) p[e.item_id].raw = e;
    });
    setPrices(p);
    setLoading(false);
  }, [fetchPrices]);

  useEffect(() => { loadPrices(); }, []);

  const tags = ["todos", "INICIO", "BUENO", "TOP", "PREMIUM"];
  const filtered = filter === "todos" ? BEST_FARM_ITEMS : BEST_FARM_ITEMS.filter(x => x.tag === filter);
  const tagColors = { INICIO: "#60a5fa", BUENO: "#4ade80", TOP: "#f59e0b", PREMIUM: "#a78bfa" };

  return (
    <div>
      <SectionHeader title="🌾 MEJORES ITEMS PARA FARMEAR" sub="Ranking curado de los items más rentables de recolección" />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {tags.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === t ? (tagColors[t] || "#f59e0b") : "#27272a"}`, background: filter === t ? (tagColors[t] || "#f59e0b") + "22" : "transparent", color: filter === t ? (tagColors[t] || "#f59e0b") : "#71717a", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>
            {t}
          </button>
        ))}
        <button className="btn-sm" onClick={loadPrices} disabled={loading} style={{ marginLeft: "auto" }}>
          {loading ? <Spinner /> : "🔄 Actualizar"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((item, i) => {
          const p = prices[item.id] || {};
          const conf = calcConfidence(p.raw || {});
          return (
            <div key={item.id} className="card" style={{
              borderLeft: `4px solid ${tagColors[item.tag] || "#f59e0b"}`,
              display: "flex", gap: 14, alignItems: "center", padding: "14px 16px"
            }}>
              <div style={{ width: 32, height: 32, background: "#09090b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#52525b", flexShrink: 0 }}>
                #{item.rank}
              </div>
              <ItemIcon id={item.id} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</span>
                  <span style={{ padding: "1px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: (tagColors[item.tag] || "#f59e0b") + "22", color: tagColors[item.tag] || "#f59e0b", border: `1px solid ${(tagColors[item.tag] || "#f59e0b")}33` }}>{item.tag}</span>
                  <ConfidenceBadge score={conf} />
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 3 }}>📍 {item.zone} · ⚠️ Riesgo {item.risk}</div>
                <div style={{ fontSize: 11, color: "#52525b" }}>{item.tip}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "Oswald" }}>{fmtM(item.silver_h)}/h</div>
                {p.sell && <div style={{ fontSize: 12, color: "#60a5fa" }}>Precio: {fmt(p.sell)}</div>}
                {p.buy && <div style={{ fontSize: 11, color: "#f59e0b" }}>Orden: {fmt(p.buy)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Community Builds Tab ──────────────────────────────────
function CommunityBuildsTab() {
  const [builds, setBuilds] = useState(() => LS.get("jarvis_community_builds", [
    {
      id: 1, author: "SilverKnight", date: "2025-04-10", votes: 47, rol: "PvE Solo",
      name: "Dungeonero Solitario T7",
      arma: "Maza 2M T7", cabeza: "Yelmo Placa T7", pecho: "Pecho Placa T7",
      botas: "Botas Placa T7", offhand: "Escudo T7", capa: "Martlock T4", montura: "Caballo Armado T7",
      descripcion: "Build tanky para farmear dungeons solo. Alta supervivencia con Maza.",
      consejos: "Usa la habilidad de Maza para stun al boss. Cura con pociones entre grupos.",
      costo: 1200000, tier: "T7", tags: ["PvE", "Solo", "Tanque"]
    },
    {
      id: 2, author: "ArrowGuru", date: "2025-04-08", votes: 31, rol: "Ganker",
      name: "Arco Express T6",
      arma: "Arco T6", cabeza: "Casco Cuero T6", pecho: "Armadura Cuero T6",
      botas: "Botas Cuero T6", offhand: "—", capa: "Bridgewatch T4", montura: "Lobo Feroz T6",
      descripcion: "Rápido, móvil y letal. El build perfecto para cazar recolectores descuidados.",
      consejos: "Usa habilidad Q para slow + E para burst. Siempre con escape planeado.",
      costo: 750000, tier: "T6", tags: ["PvP", "Ganker", "Mobilidad"]
    },
  ]));
  const [showForm, setShowForm] = useState(false);
  const [voted, setVoted] = useState(() => LS.get("jarvis_voted_builds", {}));
  const [form, setForm] = useState({
    name: "", autor: "", rol: "PvE Solo", arma: "", cabeza: "", pecho: "",
    botas: "", offhand: "", capa: "", montura: "", descripcion: "", consejos: "",
    costo: "", tier: "T6", tags: ""
  });
  const [selBuild, setSelBuild] = useState(null);
  const [filterRol, setFilterRol] = useState("todos");

  const ROLES = ["todos", "PvE Solo", "PvP", "Ganker", "Recolector", "Healer", "Zona Negra", "ZvZ"];

  const submit = () => {
    if (!form.name || !form.arma) return;
    const newBuild = {
      id: Date.now(),
      author: form.autor || "Anónimo",
      date: new Date().toLocaleDateString("es-MX"),
      votes: 0,
      rol: form.rol,
      name: form.name,
      arma: form.arma, cabeza: form.cabeza, pecho: form.pecho,
      botas: form.botas, offhand: form.offhand || "—", capa: form.capa, montura: form.montura,
      descripcion: form.descripcion,
      consejos: form.consejos,
      costo: parseInt(form.costo) || 0,
      tier: form.tier,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [form.rol]
    };
    const updated = [newBuild, ...builds];
    setBuilds(updated);
    LS.set("jarvis_community_builds", updated);
    setShowForm(false);
    setForm({ name: "", autor: "", rol: "PvE Solo", arma: "", cabeza: "", pecho: "", botas: "", offhand: "", capa: "", montura: "", descripcion: "", consejos: "", costo: "", tier: "T6", tags: "" });
  };

  const vote = (id) => {
    if (voted[id]) return;
    const updated = builds.map(b => b.id === id ? { ...b, votes: b.votes + 1 } : b);
    setBuilds(updated);
    LS.set("jarvis_community_builds", updated);
    const newVoted = { ...voted, [id]: true };
    setVoted(newVoted);
    LS.set("jarvis_voted_builds", newVoted);
  };

  const filtered = filterRol === "todos" ? builds : builds.filter(b => b.rol === filterRol);
  const sorted = [...filtered].sort((a, b) => b.votes - a.votes);

  return (
    <div>
      <SectionHeader title="👥 BUILDS DE LA COMUNIDAD" sub="Comparte y descubre builds recomendadas por otros jugadores" />

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {ROLES.map(r => (
          <button key={r} onClick={() => setFilterRol(r)}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filterRol === r ? "#f59e0b" : "#27272a"}`, background: filterRol === r ? "#f59e0b22" : "transparent", color: filterRol === r ? "#f59e0b" : "#71717a", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>
            {r}
          </button>
        ))}
        <button className="btn-sm" onClick={() => setShowForm(s => !s)} style={{ marginLeft: "auto" }}>
          {showForm ? "✕ Cerrar" : "➕ Publicar Build"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 14, borderColor: "#f59e0b33" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b", marginBottom: 12 }}>🛡️ Publicar tu Build</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><div className="label">Nombre del Build*</div><input placeholder="Ej: Fantasma T6" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Tu Nick</div><input placeholder="Ej: SilverKnight" value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Rol</div><select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>{ROLES.filter(r => r !== "todos").map(r => <option key={r}>{r}</option>)}</select></div>
            <div><div className="label">Tier</div><select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>{["T4","T5","T6","T7","T8","T6-T7","T7-T8"].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><div className="label">Arma*</div><input placeholder="Ej: Dagas Dobles T6" value={form.arma} onChange={e => setForm(f => ({ ...f, arma: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Cabeza</div><input placeholder="Ej: Casco Cuero T6" value={form.cabeza} onChange={e => setForm(f => ({ ...f, cabeza: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Pecho</div><input placeholder="Ej: Armadura Cuero T6" value={form.pecho} onChange={e => setForm(f => ({ ...f, pecho: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Botas</div><input placeholder="Ej: Botas Cuero T6" value={form.botas} onChange={e => setForm(f => ({ ...f, botas: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Off-hand</div><input placeholder="Ej: Escudo T6 o —" value={form.offhand} onChange={e => setForm(f => ({ ...f, offhand: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Capa</div><input placeholder="Ej: Martlock T4" value={form.capa} onChange={e => setForm(f => ({ ...f, capa: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Montura</div><input placeholder="Ej: Lobo Feroz T6" value={form.montura} onChange={e => setForm(f => ({ ...f, montura: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div><div className="label">Costo aprox (silver)</div><input type="number" placeholder="750000" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div style={{ gridColumn: "1/-1" }}><div className="label">Descripción</div><input placeholder="¿Para qué sirve este build?" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div style={{ gridColumn: "1/-1" }}><div className="label">Consejos</div><input placeholder="Tips clave para usarlo bien" value={form.consejos} onChange={e => setForm(f => ({ ...f, consejos: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
            <div style={{ gridColumn: "1/-1" }}><div className="label">Tags (separados por coma)</div><input placeholder="PvP, Solo, Tanque" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} onClick={e => e.stopPropagation()} /></div>
          </div>
          <button className="btn" onClick={submit} style={{ width: "100%" }}>📤 PUBLICAR BUILD</button>
        </div>
      )}

      {sorted.length === 0 ? <EmptyState icon="👥" text="Sé el primero en publicar un build para la comunidad" /> : (
        <div style={{ display: "grid", gap: 12 }}>
          {sorted.map((b, i) => {
            const isTop = i === 0;
            const isOpen = selBuild === b.id;
            return (
              <div key={b.id} style={{
                background: "#0d0d0d", border: `1px solid ${isTop ? "#f59e0b44" : "#1f1f1f"}`,
                borderLeft: `4px solid ${isTop ? "#f59e0b" : "#27272a"}`, borderRadius: 12,
                overflow: "hidden", cursor: "pointer"
              }} onClick={() => setSelBuild(isOpen ? null : b.id)}>
                <div style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
                  {isTop && <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0" }}>{b.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "#f59e0b22", color: "#f59e0b", borderRadius: 12, fontWeight: 700 }}>{b.tier}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "#27272a", color: "#71717a", borderRadius: 12 }}>{b.rol}</span>
                      {b.tags && b.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: "2px 7px", background: "#18181b", color: "#52525b", borderRadius: 10 }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>por <span style={{ color: "#60a5fa" }}>{b.author}</span> · {b.date}</div>
                    {b.descripcion && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>{b.descripcion}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); vote(b.id); }}
                      style={{ background: voted[b.id] ? "#f59e0b22" : "transparent", border: `1px solid ${voted[b.id] ? "#f59e0b" : "#3f3f46"}`, color: voted[b.id] ? "#f59e0b" : "#71717a", borderRadius: 8, padding: "6px 10px", cursor: voted[b.id] ? "default" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>
                      ▲ {b.votes}
                    </button>
                    {b.costo > 0 && <div style={{ fontSize: 10, color: "#52525b" }}>{fmtM(b.costo)}</div>}
                  </div>
                  <span style={{ color: "#3f3f46", fontSize: 14, marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid #1a1a1a", padding: 18 }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>⚔️ Equipamiento</div>
                        {[
                          { s: "Arma", v: b.arma }, { s: "Cabeza", v: b.cabeza }, { s: "Pecho", v: b.pecho },
                          { s: "Botas", v: b.botas }, { s: "Off-hand", v: b.offhand }, { s: "Capa", v: b.capa }, { s: "Montura", v: b.montura }
                        ].map(x => x.v && (
                          <div key={x.s} style={{ display: "flex", gap: 8, padding: "5px 8px", background: "#09090b", borderRadius: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: "#52525b", minWidth: 54, flexShrink: 0 }}>{x.s}</span>
                            <span style={{ fontSize: 12, color: x.v === "—" ? "#3f3f46" : "#d4d4d8", fontWeight: x.v !== "—" ? 600 : 400 }}>{x.v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>💡 Consejos del autor</div>
                        {b.consejos && (
                          <div style={{ padding: "10px 12px", background: "#09090b", borderRadius: 8, fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>
                            {b.consejos}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Farm Routes Tab ───────────────────────────────────────
function FarmRoutesTab() {
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("todos");

  const risks = ["todos", "bajo", "medio", "alto", "muy alto"];
  const filtered = filter === "todos" ? FARM_ZONES : FARM_ZONES.filter(z => z.risk === filter);

  return (
    <div>
      <SectionHeader title="🗺️ RUTAS DE FARMEO" sub="Guías paso a paso para cada zona y tier de recursos" />

      <div style={{ marginBottom: 16, padding: "14px 18px", background: "linear-gradient(135deg,#0a0a14,#0d0d0d)", border: "1px solid #60a5fa22", borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>📋 Cómo usar este apartado</div>
        <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.7 }}>
          Cada ruta incluye <strong style={{ color: "#f59e0b" }}>pasos exactos</strong>, gear recomendado, silver estimado por hora y nivel de riesgo.
          Haz click en cualquier zona para ver las instrucciones completas.
          Empieza por zonas de riesgo <strong style={{ color: "#4ade80" }}>bajo</strong> si eres principiante.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {risks.map(r => (
          <button key={r} onClick={() => setFilter(r)}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter === r ? riskColor(r === "todos" ? "bajo" : r) : "#27272a"}`, background: filter === r ? riskBg(r === "todos" ? "bajo" : r) : "transparent", color: filter === r ? riskColor(r === "todos" ? "bajo" : r) : "#71717a", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>
            {r === "todos" ? "🌐 Todos" : `⚠️ ${r}`}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(zone => {
          const isOpen = sel === zone.name;
          const rc = riskColor(zone.risk);
          const rb = riskBg(zone.risk);
          return (
            <div key={zone.name} style={{
              background: "#0d0d0d", border: `1px solid ${isOpen ? rc + "44" : "#1f1f1f"}`,
              borderLeft: `4px solid ${rc}`, borderRadius: 12, overflow: "hidden", cursor: "pointer"
            }} onClick={() => setSel(isOpen ? null : zone.name)}>
              <div style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 42, height: 42, background: rb, border: `1px solid ${rc}33`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {zone.pvp ? "⚔️" : "🌿"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0" }}>{zone.name}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: rb, color: rc, borderRadius: 12, fontWeight: 700, border: `1px solid ${rc}33` }}>⚠️ {zone.risk}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "#27272a", color: "#71717a", borderRadius: 12 }}>{zone.tier}</span>
                    {zone.pvp && <span style={{ fontSize: 10, padding: "2px 8px", background: "#450a0a", color: "#ef4444", borderRadius: 12 }}>PvP</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>📍 {zone.zone} · 🌾 {zone.resource} · ⏱️ ~{zone.time} min</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "Oswald" }}>{fmtM(zone.silver)}/h</div>
                  <div style={{ fontSize: 10, color: "#52525b" }}>estimado</div>
                </div>
                <span style={{ color: "#3f3f46", fontSize: 14, marginLeft: 6 }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid #1a1a1a", padding: 18 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>📋 Pasos a seguir</div>
                      {zone.steps && zone.steps.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, padding: "7px 10px", background: "#09090b", borderRadius: 6, marginBottom: 5, borderLeft: `2px solid ${rc}` }}>
                          <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.4 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>⚙️ Gear Recomendado</div>
                      <div style={{ padding: "10px 12px", background: "#09090b", borderRadius: 8, fontSize: 13, color: "#d4d4d8", marginBottom: 12 }}>
                        {zone.gear}
                      </div>
                      <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>📊 Stats de la zona</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          { l: "Silver/hora", v: fmtM(zone.silver), c: "#4ade80" },
                          { l: "Tiempo farm", v: `~${zone.time} min`, c: "#60a5fa" },
                          { l: "Riesgo", v: zone.risk, c: rc },
                          { l: "PvP", v: zone.pvp ? "Sí ⚠️" : "No ✅", c: zone.pvp ? "#ef4444" : "#4ade80" },
                        ].map(x => (
                          <div key={x.l} style={{ padding: "8px 10px", background: "#09090b", borderRadius: 6, textAlign: "center" }}>
                            <div className="label">{x.l}</div>
                            <div style={{ fontWeight: 700, color: x.c, fontSize: 13 }}>{x.v}</div>
                          </div>
                        ))}
                      </div>
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
      if(!p[e.item_id].raw) p[e.item_id].raw=e;
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
                style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",gap:10,color:"#d4d4d8"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <ItemIcon id={item.id} size={28}/>
                <span style={{flex:1}}>{item.name}</span>
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
            const conf=calcConfidence(p.raw||{});
            return(
              <div key={item.id} className="card" style={{display:"flex",gap:14,alignItems:"center"}}>
                <ItemIcon id={item.id} size={42}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15}}>{item.name}</span>
                    <ConfidenceBadge score={conf}/>
                  </div>
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
  const overallConf=prices.length>0?calcConfidence(prices[0]):0;

  return(
    <div>
      <SectionHeader title="🔎 BUSCADOR DE ITEMS" sub="Precio en todas las ciudades + Confidence Score"/>
      <div className="card" style={{marginBottom:14}}>
        <input placeholder="Busca cualquier item: arma, recurso, armadura..." value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);setPrices([]);}}/>
        {query&&!selected&&(
          <div style={{marginTop:8,maxHeight:240,overflowY:"auto",background:"#0d0d0d",borderRadius:8,border:"1px solid #27272a"}}>
            {results.map(item=>(
              <div key={item.id} onClick={()=>selectItem(item)}
                style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #1a1a1a",transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <ItemIcon id={item.id} size={30}/>
                <span style={{color:"#d4d4d8",fontSize:14,fontWeight:600,flex:1}}>{item.name}</span>
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
            <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
              <ItemIcon id={selected.id} size={56}/>
              <div>
                <div style={{fontSize:20,fontWeight:700,color:"#f59e0b",marginBottom:4}}>{selected.name}</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:"#52525b",padding:"2px 8px",background:"#27272a",borderRadius:10}}>{selected.cat} · T{selected.tier}</span>
                  <ConfidenceBadge score={overallConf}/>
                </div>
              </div>
            </div>
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
                {["Ciudad","Compra min","Venta max","Spread","ROI","Confianza"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",borderBottom:"1px solid #27272a",fontWeight:600,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {CITIES.map(city=>{
                  const row=prices.find(p=>p.city===city)||{};
                  const buy=row.sell_price_min||0;
                  const sell=row.buy_price_max||0;
                  const spread=sell-buy;
                  const roi=buy>0?((spread/buy)*100).toFixed(1):null;
                  const conf=calcConfidence(row);
                  return(
                    <tr key={city} style={{borderBottom:"1px solid #18181b"}}>
                      <td style={{padding:"9px 10px",color:"#f59e0b",fontWeight:700}}>{city}</td>
                      <td style={{padding:"9px 10px",color:"#4ade80"}}>{buy>0?fmt(buy):"—"}</td>
                      <td style={{padding:"9px 10px",color:"#60a5fa"}}>{sell>0?fmt(sell):"—"}</td>
                      <td style={{padding:"9px 10px",color:spread>0?"#4ade80":"#ef4444"}}>{spread>0?"+":""}{spread?fmt(spread):"—"}</td>
                      <td style={{padding:"9px 10px",color:parseFloat(roi)>0?"#4ade80":"#71717a"}}>{roi?`${roi}%`:"—"}</td>
                      <td style={{padding:"9px 10px"}}>{(buy>0||sell>0)?<ConfidenceBadge score={conf}/>:"—"}</td>
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
          const conf=calcConfidence(cheapest);
          results.push({id,name:meta?.name||id,cat:meta?.cat||"?",tier:meta?.tier||0,
            cityBuy:cheapest.city,cityBell:priciest.city,
            buy:cheapest.sell_price_min,sell:priciest.buy_price_max,profit,roi:parseFloat(roi),conf});
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
                <ItemIcon id={item.id} size={38}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:14}}>{item.name}</span>
                    <ConfidenceBadge score={item.conf||0}/>
                  </div>
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
  // FIX: usar string vacío como estado inicial para permitir borrar el campo
  const [minProfit,setMinProfit]=useState("5000");
  const [minRoi,setMinRoi]=useState("5");
  const [qty,setQty]=useState("500");
  const [scanned,setScanned]=useState(false);
  const [progress,setProgress]=useState(0);

  const scan=async()=>{
    // FIX: convertir a número de forma segura al momento de calcular
    const qtyNum = Number(qty) || 0;
    const minProfitNum = Number(minProfit) || 0;
    const minRoiNum = Number(minRoi) || 0;

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
            const inv=buyP*qtyNum,rev=sellP*qtyNum,tax=rev*0.03,net=rev-tax-inv;
            const roi=((net/inv)*100).toFixed(1);
            if(net>=minProfitNum&&parseFloat(roi)>=minRoiNum){
              const meta=TRANSPORT_ITEMS.find(x=>x.id===itemId);
              const conf=calcConfidence(buyEntry);
              allOpps.push({id:itemId,name:meta?.name||itemId,cityBuy:buyEntry.city,citySell:sellEntry.city,buyPrice:buyP,sellPrice:sellP,inv:Math.round(inv),net:Math.round(net),roi:parseFloat(roi),perUnit:sellP-buyP,conf});
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
          {/* FIX: onChange guarda el string directamente, sin parseInt */}
          <div><div className="label">Cantidad</div><input type="number" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Profit mínimo</div><input type="number" value={minProfit} onChange={e=>setMinProfit(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">ROI mínimo %</div><input type="number" value={minRoi} onChange={e=>setMinRoi(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
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
                  <ItemIcon id={op.id} size={36}/>
                  <div style={{flex:1,minWidth:140}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                      <span style={{fontWeight:700,fontSize:14}}>{op.name}</span>
                      <ConfidenceBadge score={op.conf||0}/>
                    </div>
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
  // FIX: estado como string para permitir borrar el campo
  const [qty,setQty]=useState("100");
  const [focus,setFocus]=useState(false);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [returnRate,setReturnRate]=useState("36.7");

  const outMap={FIBER:"CLOTH",WOOD:"PLANKS",ORE:"METALBAR",HIDE:"LEATHER",ROCK:"STONEBLOCK"};
  const nameMap={FIBER:"Fibra",WOOD:"Madera",ORE:"Mineral",HIDE:"Cuero",ROCK:"Piedra"};
  const outNameMap={CLOTH:"Tela",PLANKS:"Tablas",METALBAR:"Barra Metal",LEATHER:"Cuero Proc",STONEBLOCK:"Bloque Piedra"};

  const calc=async()=>{
    // FIX: convertir a número de forma segura al calcular
    const qtyNum = Number(qty) || 0;
    const returnRateNum = Number(returnRate) || 0;

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
    const actualReturn=focus?returnRateNum:returnRateNum*0.5;
    const returnedMats=Math.floor(qtyNum*8*(actualReturn/100));
    const rawCost=rawPrice*qtyNum*8;
    const lowerCost=lowerTier*returnedMats;
    const totalCost=rawCost-lowerCost+(fee*qtyNum);
    const revenue=sellPrice*qtyNum;
    const tax=revenue*0.03;
    const net=revenue-tax-totalCost;
    const roi=totalCost>0?((net/totalCost)*100).toFixed(1):0;
    setResult({rawPrice,sellPrice,lowerTier,rawCost:Math.round(rawCost),fee:fee*qtyNum,totalCost:Math.round(totalCost),revenue:Math.round(revenue),tax:Math.round(tax),net:Math.round(net),roi,returnedMats,rawMaterial:`T${tier}_${material}`,outItem:`T${tier}_${outPrefix}`});
    setLoading(false);
  };

  return(
    <div>
      <SectionHeader title="⚗️ CALCULADORA DE REFINADO" sub="¿Vale la pena refinar o mejor vender el raw?"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <div><div className="label">Material</div><select value={material} onChange={e=>setMaterial(e.target.value)}>{Object.entries(nameMap).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
          <div><div className="label">Tier</div><select value={tier} onChange={e=>setTier(parseInt(e.target.value))}>{[3,4,5,6,7,8].filter(t=>!(material==="ROCK"&&t===8)).map(t=><option key={t} value={t}>T{t}</option>)}</select></div>
          {/* FIX: onChange sin parseInt, guarda string */}
          <div><div className="label">Cantidad a refinar</div><input type="number" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
          {/* FIX: tasa de retorno también como string */}
          <div style={{flex:1}}><div className="label">Tasa de retorno (%)</div><input type="number" value={returnRate} onChange={e=>setReturnRate(e.target.value)} onClick={e=>e.stopPropagation()} step="0.1"/></div>
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
            {result.net>0?`✅ Refinado rentable. Ganas ${fmt(result.net)} silver neto con ${qty}x ${outNameMap[outMap[material]]}.`:`❌ No rentable. Mejor vender el raw directamente o esperar mejores precios.`}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Focus Tab ─────────────────────────────────────────────
function FocusTab(){
  // FIX: todos los inputs numéricos como string
  const [focusMax,setFocusMax]=useState("30000");
  const [focusRegen,setFocusRegen]=useState("10000");
  const [focusCost,setFocusCost]=useState("1000");
  const [bonus,setBonus]=useState("43.5");
  const [craft,setCraft]=useState("50");

  // FIX: convertir a número de forma segura para los cálculos
  const focusMaxNum = Number(focusMax) || 0;
  const focusRegenNum = Number(focusRegen) || 0;
  const focusCostNum = Number(focusCost) || 0;
  const bonusNum = Number(bonus) || 0;
  const craftNum = Number(craft) || 0;

  const sessionsPerDay=focusRegenNum>0?Math.floor(focusMaxNum/focusRegenNum):1;
  const craftsWithFocus=focusCostNum>0?Math.floor(focusMaxNum/focusCostNum):0;
  const profitBonus=craftsWithFocus*(bonusNum/100)*craftNum;
  const focusEfficiency=focusMaxNum>0?(focusRegenNum/focusMaxNum*100).toFixed(1):"0.0";

  return(
    <div>
      <SectionHeader title="🎯 CALCULADORA DE FOCUS" sub="Optimiza el uso de tu Focus para máximo profit"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {/* FIX: onChange guarda string directamente */}
          <div><div className="label">Focus máximo</div><input type="number" value={focusMax} onChange={e=>setFocusMax(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Regeneración diaria</div><input type="number" value={focusRegen} onChange={e=>setFocusRegen(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Costo focus por craft</div><input type="number" value={focusCost} onChange={e=>setFocusCost(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Bonus retorno % (con focus)</div><input type="number" step="0.1" value={bonus} onChange={e=>setBonus(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div style={{gridColumn:"1/-1"}}><div className="label">Profit por craft (silver)</div><input type="number" value={craft} onChange={e=>setCraft(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
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

// ── Break Even Tab ────────────────────────────────────────
function BreakEvenTab(){
  // FIX: todos los inputs como string
  const [cost,setCost]=useState("");
  const [tax,setTax]=useState("3");
  const [qty,setQty]=useState("1");
  const [desired,setDesired]=useState("");

  // FIX: conversión segura para cálculos
  const costNum = Number(cost) || 0;
  const taxNum = Number(tax) || 0;
  const qtyNum = Number(qty) || 1;
  const desiredNum = Number(desired) || 0;

  const breakEvenPrice=cost&&qtyNum?(costNum/qtyNum/(1-taxNum/100)).toFixed(0):null;
  const profitAtDesired=desired&&cost&&qtyNum?Math.round((desiredNum*(1-taxNum/100)-costNum/qtyNum)*qtyNum):null;

  return(
    <div>
      <SectionHeader title="⚖️ BREAK-EVEN & TAX OPTIMIZER" sub="Calcula el precio mínimo de venta y optimiza impuestos"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div className="card">
          <div style={{fontSize:15,fontWeight:700,color:"#f59e0b",marginBottom:12}}>Break-Even Calculator</div>
          <div style={{display:"grid",gap:10}}>
            <div><div className="label">Costo total inversión</div><input type="number" placeholder="500000" value={cost} onChange={e=>setCost(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
            <div><div className="label">Cantidad de items</div><input type="number" placeholder="100" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
            {/* FIX: tax también como string */}
            <div><div className="label">Tax % del mercado</div><input type="number" placeholder="3" value={tax} onChange={e=>setTax(e.target.value)} onClick={e=>e.stopPropagation()} step="0.1"/></div>
          </div>
          {breakEvenPrice&&(<div style={{marginTop:14,padding:14,background:"#422006",border:"1px solid #f59e0b44",borderRadius:8,textAlign:"center"}}><div className="label">Precio mínimo de venta</div><div style={{fontSize:28,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald"}}>{fmt(parseInt(breakEvenPrice))}</div></div>)}
        </div>
        <div className="card">
          <div style={{fontSize:15,fontWeight:700,color:"#60a5fa",marginBottom:12}}>Profit a precio deseado</div>
          <div><div className="label">Precio de venta deseado</div><input type="number" placeholder="7500" value={desired} onChange={e=>setDesired(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          {profitAtDesired!==null&&(<div style={{marginTop:14,padding:14,background:profitAtDesired>0?"#052e16":"#450a0a",border:`1px solid ${profitAtDesired>0?"#4ade8044":"#ef444444"}`,borderRadius:8,textAlign:"center"}}><div className="label">Ganancia estimada</div><div style={{fontSize:28,fontWeight:700,color:profitAtDesired>0?"#4ade80":"#ef4444",fontFamily:"Oswald"}}>{profitAtDesired>0?"+":""}{fmt(profitAtDesired)}</div></div>)}
          <div style={{marginTop:12,padding:12,background:"#0d0d0d",borderRadius:8,fontSize:12,color:"#71717a",lineHeight:1.6}}>
            <strong style={{color:"#a1a1aa"}}>Tax reference:</strong><br/>Premium: 3% · Sin premium: 4.5%<br/>Caerleon Black Market: 3%<br/>Guild hall: reduce hasta 0%
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft vs Buy Tab ──────────────────────────────────────
function CraftVsBuyTab({apiBase}){
  const fetchPrices=usePrices(apiBase);
  // FIX: estado como string
  const [qty,setQty]=useState("10");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [search,setSearch]=useState("");

  const craftable=PROC_RECIPES;
  const filtered=craftable.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())).slice(0,15);

  const analyze=async(recipe)=>{
    // FIX: convertir a número seguro al calcular
    const qtyNum = Number(qty) || 0;

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
    for(const m of recipe.mat){matCost+=(p[m.id]?.buy||0)*m.qty*qtyNum;}
    const fee=recipe.fee*qtyNum;
    const craftCost=matCost+fee;
    const buyPrice=(p[recipe.id]?.buy||0)*qtyNum;
    const sellPrice=(p[recipe.id]?.sell||0)*qtyNum;
    const craftSellRevenue=sellPrice*(1-0.03);
    const craftProfit=craftSellRevenue-craftCost;
    const buyAndSellProfit=craftSellRevenue-buyPrice;
    setResult({craftCost:Math.round(craftCost),buyPrice:Math.round(buyPrice),sellRevenue:Math.round(craftSellRevenue),craftProfit:Math.round(craftProfit),buyAndSellProfit:Math.round(buyAndSellProfit),recommendation:craftProfit>buyAndSellProfit?"craft":"buy",name:recipe.name,id:recipe.id});
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
                style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #1a1a1a",fontSize:13,color:"#d4d4d8",display:"flex",alignItems:"center",gap:10}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <ItemIcon id={r.id} size={28}/>
                <span style={{flex:1}}>{r.name}</span>
                <span style={{color:"#52525b",fontSize:11}}>fee: {fmt(r.fee)}</span>
              </div>
            ))}
          </div>
        )}
        {/* FIX: onChange sin parseInt */}
        <div><div className="label">Cantidad</div><input type="number" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
      </div>
      {loading&&<div style={{textAlign:"center",padding:30}}><Spinner size={28}/></div>}
      {result&&(
        <div>
          <div style={{marginBottom:14,padding:"12px 16px",background:`linear-gradient(135deg,${result.recommendation==="craft"?"#052e16":"#1a0a00"},#0d0d0d)`,border:`1px solid ${result.recommendation==="craft"?"#4ade8044":"#f59e0b44"}`,borderRadius:12,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
            <ItemIcon id={result.id} size={48}/>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:result.recommendation==="craft"?"#4ade80":"#f59e0b",marginBottom:4}}>
                {result.recommendation==="craft"?"🔨 RECOMIENDA FABRICAR":"🛒 RECOMIENDA COMPRAR"}
              </div>
              <div style={{fontSize:13,color:"#71717a"}}>{result.name} × {qty}</div>
            </div>
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

// ── AI Advisor Tab ────────────────────────────────────────
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
    const summary={prof:profData.label,icon:profData.icon,strategy:profData.strategy,silver:silverNum,time:timeNum,tier,canDoHighTier,recommendations:recommendations.slice(0,3),topAction:recommendations[0]?.action||"No hay datos suficientes ahora",estimatedProfit:recommendations.slice(0,3).reduce((s,r)=>s+r.net,0),tips:[canDoHighTier?`Con ${fmt(silverNum)} silver puedes operar en T${tNum} cómodamente.`:`Considera acumular más silver para operar en tiers más altos.`,timeNum<30?`Con ${timeNum} min, enfócate en una sola operación rápida.`:`Con ${timeNum} min tienes tiempo para múltiples operaciones.`,`En tu rol de ${profData.label.toLowerCase()}, prioriza calidad sobre cantidad.`]};
    setAdvice(summary);setLoading(false);
  };

  return(
    <div>
      <SectionHeader title="🤖 ASISTENTE IA" sub="Recomendaciones personalizadas según tu perfil y situación"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><div className="label">Tu silver actual</div><input type="number" placeholder="1000000" value={silver} onChange={e=>setSilver(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Tiempo disponible (min)</div><input type="number" placeholder="60" value={time} onChange={e=>setTime(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
          <div><div className="label">Tu profesión</div><select value={prof} onChange={e=>setProf(e.target.value)}>{Object.entries(PROFS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
          <div><div className="label">Tier objetivo</div><select value={tier} onChange={e=>setTier(e.target.value)}>{["T3","T4","T5","T6","T7","T8"].map(t=><option key={t}>{t}</option>)}</select></div>
        </div>
        <button className="btn" onClick={getAdvice} disabled={loading} style={{width:"100%"}}>
          {loading?<><Spinner/>&nbsp; Analizando mercado…</>:"🤖 OBTENER RECOMENDACIÓN IA"}
        </button>
      </div>
      {advice&&(
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
      )}
      {!advice&&!loading&&<EmptyState icon="🤖" text="Configura tu perfil y obtén recomendaciones personalizadas"/>}
    </div>
  );
}

// ── Portfolio Tab ─────────────────────────────────────────
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
          {[{l:"Total invertido",v:fmtM(totalInvested),c:"#f97316"},{l:"Valor actual",v:fmtM(totalCurrent),c:"#60a5fa"},{l:"P&L",v:`${totalPnL>=0?"+":""}${fmtM(Math.round(totalPnL))}`,c:totalPnL>=0?"#4ade80":"#ef4444"},{l:"ROI total",v:`${pnlPct}%`,c:parseFloat(pnlPct)>=0?"#4ade80":"#ef4444"}].map(item=>(
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
                    <div style={{fontSize:12,color:"#71717a"}}>{fmt(inv.qty)} ud · Compra: {fmt(inv.buyPrice)} · Actual: <input type="number" defaultValue={inv.currentPrice} onBlur={e=>update(inv.id,e.target.value)} onClick={e=>e.stopPropagation()} style={{display:"inline",width:80,marginLeft:4,padding:"2px 6px",fontSize:12}}/></div>
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

// ── Session Tab ───────────────────────────────────────────
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
        <div className="label" style={{marginBottom:8}}>🎯 Meta de silver</div>
        <input type="number" placeholder="Meta: ej 5000000" value={goal} onChange={e=>{setGoal(e.target.value);LS.set("jarvis_goal",e.target.value);}} onClick={e=>e.stopPropagation()}/>
        {goalNum>0&&(<div style={{marginTop:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#71717a"}}>{fmt(totalGained)} / {fmt(goalNum)}</span><span style={{color:"#4ade80",fontWeight:700}}>{goalPct}%</span></div><div style={{height:8,background:"#27272a",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${goalPct}%`,background:"linear-gradient(90deg,#d97706,#4ade80)",borderRadius:4,transition:"width .4s"}}/></div></div>)}
      </div>
      {sessions.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
          {[{l:"Silver total",v:fmtM(totalGained),c:totalGained>=0?"#4ade80":"#ef4444"},{l:"Tiempo total",v:`${totalMin} min`,c:"#60a5fa"},{l:"Promedio/hora",v:fmtM(avgH),c:"#f59e0b"},{l:"Sesiones",v:sessions.length,c:"#a78bfa"}].map(item=>(
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
  // FIX: estado como string
  const [qty,setQty]=useState("1000");
  const [fromCity,setFromCity]=useState("Lymhurst");
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState(null);
  const [error,setError]=useState(null);

  const analyze=async()=>{
    // FIX: conversión segura al calcular
    const qtyNum = Number(qty) || 0;

    setLoading(true);setError(null);setResults(null);
    const data=await fetchPrices(itemId);
    const byCity={};
    CITIES.forEach(c=>{byCity[c]={buy:null,sell:null};});
    data.forEach(p=>{if(!byCity[p.city]) return;if(p.sell_price_min>0)byCity[p.city].buy=p.sell_price_min;if(p.buy_price_max>0)byCity[p.city].sell=p.buy_price_max;});
    const originBuy=byCity[fromCity]?.buy;
    if(!originBuy){setError("No hay precio de compra en ciudad origen.");setLoading(false);return;}
    const inv=originBuy*qtyNum;
    const options=CITIES.filter(c=>c!==fromCity).map(dest=>{
      const sellP=byCity[dest]?.sell;if(!sellP)return null;
      const rev=sellP*qtyNum,tax=rev*0.03,net=rev-tax-inv,roi=((net/inv)*100).toFixed(1);
      return{city:dest,sellPrice:sellP,revenue:Math.round(rev),tax:Math.round(tax),net:Math.round(net),roi:parseFloat(roi),silverPerItem:sellP-originBuy};
    }).filter(Boolean).sort((a,b)=>b.net-a.net);
    setResults({options,originBuy,inv:Math.round(inv),itemName:TRANSPORT_ITEMS.find(i=>i.id===itemId)?.name||itemId,qty:qtyNum,fromCity});
    setLoading(false);
  };
  const best=results?.options?.[0];

  return(
    <div>
      <SectionHeader title="🚚 CALCULADORA DE TRANSPORTE" sub="Encuentra la mejor ciudad destino para tu mercancía"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div style={{gridColumn:"1/-1"}}><div className="label">Item</div><select value={itemId} onChange={e=>setItemId(e.target.value)}>{TRANSPORT_ITEMS.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
          {/* FIX: onChange sin parseInt */}
          <div><div className="label">Cantidad</div><input type="number" value={qty} onChange={e=>setQty(e.target.value)} onClick={e=>e.stopPropagation()}/></div>
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
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10}}>
                <ItemIcon id={itemId} size={42}/>
                <div>
                  <div style={{fontSize:12,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>✅ Mejor ruta</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#f0fdf4"}}>{fmt(results.qty)}x {results.itemName} · <span style={{color:"#f59e0b"}}>{results.fromCity}</span> → <span style={{color:"#4ade80"}}>{best.city}</span></div>
                </div>
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
                      {[
                        {s:"Arma",v:b.armaLabel||b.arma,id:b.arma},{s:"Montura",v:b.monturaLabel||b.montura,id:b.montura},
                        {s:"Off-hand",v:b.offhandLabel||b.offhand,id:b.offhand},{s:"Cabeza",v:b.cabeza},{s:"Pecho",v:b.pecho},
                        {s:"Botas",v:b.botas},{s:"Capa",v:b.capa}
                      ].map(x=>(
                        <div key={x.s} style={{display:"flex",gap:8,padding:"5px 8px",background:"#09090b",borderRadius:6,marginBottom:4,alignItems:"center"}}>
                          {x.id&&x.id!=="—"&&<ItemIcon id={x.id} size={24}/>}
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

// ── Profit Calc Tab ───────────────────────────────────────
function ProfitCalcTab(){
  // FIX: todos los inputs como string
  const [buy,setBuy]=useState("");
  const [sell,setSell]=useState("");
  const [tax,setTax]=useState("3");
  const [qty,setQty]=useState("1");
  const [result,setResult]=useState(null);

  const calc=()=>{
    // FIX: conversión segura al calcular
    const b=Number(buy)||0;
    const s=Number(sell)||0;
    const t=Number(tax)||0;
    const q=Number(qty)||1;

    if(!buy||!sell) return;
    const gross=(s-b)*q,taxAmt=s*(t/100)*q,net=gross-taxAmt;
    setResult({net:Math.round(net),roi:((net/(b*q))*100).toFixed(1),tax:Math.round(taxAmt),gross:Math.round(gross)});
  };

  return(
    <div>
      <SectionHeader title="💰 CALCULADORA DE PROFIT" sub="Ganancia neta con impuestos incluidos"/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          {/* FIX: onChange guarda string directamente */}
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
            {result.net>0?`✅ Rentable. Ganancia por cada 1000 items: ${fmt(Math.round(result.net/Math.max(Number(qty)||1,1)*1000))} silver.`:"❌ Pérdidas. Busca mejor precio."}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Confidence Score Tab ──────────────────────────────────
function ConfidenceTab({ apiBase }) {
  const fetchPrices = usePrices(apiBase);
  const [itemId, setItemId] = useState("T6_FIBER");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const results = useMemo(() => ALL_ITEMS.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20), [search]);

  const analyze = async (item) => {
    setLoading(true); setData(null);
    const raw = await fetchPrices(item.id);
    const cityData = CITIES.map(city => {
      const entry = raw.find(r => r.city === city) || {};
      const score = calcConfidence(entry);
      return { city, entry, score };
    });
    setData({ item, cityData });
    setLoading(false);
    setSearch("");
  };

  return (
    <div>
      <SectionHeader title="🧠 CONFIDENCE SCORE" sub="Fiabilidad de los datos de mercado · 0-100 puntos" />

      <div className="card" style={{ marginBottom: 14, borderColor: "#a78bfa33" }}>
        <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.7, marginBottom: 12 }}>
          <strong style={{ color: "#a78bfa" }}>¿Cómo funciona el Score?</strong><br />
          🟢 <strong>92-100</strong> Alta Confianza — datos frescos y confiables<br />
          🟡 <strong>75-91</strong> Buena — datos recientes, operar con precaución<br />
          🟠 <strong>50-74</strong> Riesgo — verificar antes de operar<br />
          🔴 <strong>0-49</strong> Verificar manualmente — datos desactualizados
        </div>
        <div className="label" style={{ marginBottom: 6 }}>Buscar item para analizar</div>
        <input placeholder="Ej: Fibra T6, Mineral T7..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto", background: "#0d0d0d", borderRadius: 8, border: "1px solid #27272a" }}>
            {results.map(item => (
              <div key={item.id} onClick={() => analyze(item)}
                style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1a1a1a" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <ItemIcon id={item.id} size={28} />
                <span style={{ fontSize: 13, color: "#d4d4d8", flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 11, color: "#52525b" }}>{item.cat}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={28} /></div>}

      {data && !loading && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <ItemIcon id={data.item.id} size={52} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>{data.item.name}</div>
              <div style={{ fontSize: 12, color: "#52525b" }}>{data.item.cat} · T{data.item.tier}</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {data.cityData.map(({ city, entry, score }) => {
              const width = `${score}%`;
              const color = score >= 92 ? "#4ade80" : score >= 75 ? "#facc15" : score >= 50 ? "#f97316" : "#ef4444";
              return (
                <div key={city} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f59e0b", width: 130, flexShrink: 0 }}>{city}</div>
                    <div style={{ flex: 1, height: 8, background: "#27272a", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width, background: color, borderRadius: 4, transition: "width .6s" }} />
                    </div>
                    <ConfidenceBadge score={score} />
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#71717a" }}>
                    <span>Compra: <strong style={{ color: "#4ade80" }}>{entry.sell_price_min > 0 ? fmt(entry.sell_price_min) : "—"}</strong></span>
                    <span>Venta: <strong style={{ color: "#60a5fa" }}>{entry.buy_price_max > 0 ? fmt(entry.buy_price_max) : "—"}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!data && !loading && <EmptyState icon="🧠" text="Busca un item para analizar su fiabilidad en cada ciudad" />}
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────
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
    {label:"Mejor Ruta Farm",value:"Mineral T6",sub:"Fort Sterling · 480k/h",icon:"⛏️",color:"#4ade80"},
    {label:"Confidence Top",value:"98/100",sub:"Fibra T6 en Lymhurst",icon:"🧠",color:"#a78bfa"},
    {label:"Zona Negra",value:"1.4M/h est.",sub:"Fantasma Recolector T6",icon:"🖤",color:"#ef4444"},
    {label:"Top Craft",value:"METALBAR T6",sub:"ROI ~25% hoy",icon:"🔨",color:"#f59e0b"},
  ];

  return(
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald",letterSpacing:1}}>ALBION TERMINAL · RESUMEN</div>
        <div style={{fontSize:13,color:"#52525b"}}>Panel principal · precios en tiempo real · v6.0</div>
      </div>

      <div style={{marginBottom:16,padding:"12px 18px",background:"linear-gradient(135deg,#0a0a1a,#0d0d0d)",border:"1px solid #a78bfa33",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>🧠</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:"#a78bfa",marginBottom:2}}>NUEVO · Confidence Score</div>
          <div style={{fontSize:12,color:"#71717a"}}>Ahora cada precio tiene un score de 0-100 de fiabilidad. <span style={{color:"#4ade80"}}>🟢 Alta</span> · <span style={{color:"#facc15"}}>🟡 Buena</span> · <span style={{color:"#f97316"}}>🟠 Riesgo</span> · <span style={{color:"#ef4444"}}>🔴 Verificar</span></div>
        </div>
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
                {["Item","Ciudad","Compra","Venta","Conf."].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",borderBottom:"1px solid #27272a",fontWeight:600,textTransform:"uppercase",fontSize:10,letterSpacing:1}}>{h}</th>)}
              </tr></thead>
              <tbody>{prices.map((p,i)=>{
                const conf=calcConfidence(p);
                return(
                  <tr key={i} style={{borderBottom:"1px solid #141414"}}>
                    <td style={{padding:"8px 10px",color:"#d4d4d8",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                      <ItemIcon id={p.item_id} size={22}/>
                      <span>{p.item_id?.replace(/_/g," ")}</span>
                    </td>
                    <td style={{padding:"8px 10px",color:"#f59e0b"}}>{p.city}</td>
                    <td style={{padding:"8px 10px",color:"#4ade80"}}>{p.buy_price_max>0?fmt(p.buy_price_max):"—"}</td>
                    <td style={{padding:"8px 10px",color:"#60a5fa"}}>{p.sell_price_min>0?fmt(p.sell_price_min):"—"}</td>
                    <td style={{padding:"8px 6px"}}><ConfidenceBadge score={conf}/></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ):<div style={{color:"#52525b",fontSize:13,padding:16}}>Sin conexión a la API.</div>}
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────
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
    {id:"best_farm",label:"🌾 Mejor Farmeo",group:"main"},
    {id:"farm_routes",label:"🗺️ Rutas",group:"main"},
    {id:"profit",label:"💰 Profit",group:"calc"},
    {id:"breakeven",label:"⚖️ Break-Even",group:"calc"},
    {id:"craft_vs_buy",label:"🔨 Craft vs Buy",group:"calc"},
    {id:"refining",label:"⚗️ Refinado",group:"calc"},
    {id:"focus",label:"🎯 Focus",group:"calc"},
    {id:"confidence",label:"🧠 Confidence",group:"intel"},
    {id:"transport",label:"🚚 Transporte",group:"market"},
    {id:"arbitrage",label:"📦 Arbitraje",group:"market"},
    {id:"top_profit",label:"🏆 Top Profits",group:"market"},
    {id:"item_search",label:"🔎 Buscador",group:"market"},
    {id:"ai_advisor",label:"🤖 Asistente IA",group:"ai"},
    {id:"blackzone",label:"🖤 Zona Negra",group:"bz"},
    {id:"community",label:"👥 Comunidad",group:"social"},
    {id:"session",label:"📊 Sesión",group:"track"},
    {id:"portfolio",label:"💼 Portafolio",group:"track"},
    {id:"watchlist",label:"⭐ Watchlist",group:"track"},
  ];

  const currentServer=SERVERS.find(s=>s.id===server)||SERVERS[0];
  const groupColors={main:"#f59e0b",calc:"#60a5fa",intel:"#a78bfa",market:"#4ade80",ai:"#34d399",bz:"#ef4444",social:"#fb923c",track:"#f97316"};
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

      {/* HEADER */}
      <div style={{background:"linear-gradient(180deg,#111 0%,#09090b 100%)",borderBottom:"1px solid #1f1f1f",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0 0"}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚔️</div>
            <div>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:2,color:"#f59e0b",fontFamily:"Oswald"}}>ALBION TERMINAL</div>
              <div style={{fontSize:10,color:"#52525b",letterSpacing:1}}>v6.0 · {ALL_ITEMS.length} items · Confidence Score · Comunidad</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
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

          {/* TAB BAR */}
          <div style={{display:"flex",gap:0,marginTop:10,overflowX:"auto",paddingBottom:0}}>
            {tabGroups.map(group=>(
              <div key={group} style={{display:"flex"}}>
                {TABS.filter(t=>t.group===group).map(t=>{
                  const active=tab===t.id;
                  const gc=groupColors[group]||"#f59e0b";
                  return(
                    <button key={t.id} onClick={()=>setTab(t.id)}
                      style={{background:active?gc:"transparent",color:active?"#000":t.id==="blackzone"?"#ef444488":"#71717a",border:"none",padding:"9px 11px",borderRadius:"7px 7px 0 0",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s",borderBottom:active?`2px solid ${gc}`:"2px solid transparent"}}>
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

      {/* CONTENT */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 20px"}} className="tab-content">
        {tab==="dashboard"&&<DashboardTab apiBase={apiBase}/>}
        {tab==="best_farm"&&<BestFarmTab apiBase={apiBase}/>}
        {tab==="farm_routes"&&<FarmRoutesTab/>}
        {tab==="profit"&&<ProfitCalcTab/>}
        {tab==="breakeven"&&<BreakEvenTab/>}
        {tab==="craft_vs_buy"&&<CraftVsBuyTab apiBase={apiBase}/>}
        {tab==="refining"&&<RefiningTab apiBase={apiBase}/>}
        {tab==="focus"&&<FocusTab/>}
        {tab==="confidence"&&<ConfidenceTab apiBase={apiBase}/>}
        {tab==="transport"&&<TransportTab apiBase={apiBase}/>}
        {tab==="arbitrage"&&<ArbitrageTab apiBase={apiBase}/>}
        {tab==="top_profit"&&<TopProfitTab apiBase={apiBase}/>}
        {tab==="item_search"&&<ItemSearchTab apiBase={apiBase}/>}
        {tab==="ai_advisor"&&<AIAdvisorTab apiBase={apiBase}/>}
        {tab==="blackzone"&&<BlackZoneTab/>}
        {tab==="community"&&<CommunityBuildsTab/>}
        {tab==="session"&&<SessionTab/>}
        {tab==="portfolio"&&<PortfolioTab/>}
        {tab==="watchlist"&&<WatchlistTab apiBase={apiBase}/>}
      </div>

      {/* FOOTER */}
      <div style={{borderTop:"1px solid #1a1a1a",padding:"16px 20px",textAlign:"center",marginTop:40}}>
        <div style={{fontSize:11,color:"#3f3f46",marginBottom:4}}>
          ALBION TERMINAL v6.0 · Datos de <a href="https://albion-online-data.com" target="_blank" rel="noreferrer" style={{color:"#f59e0b",textDecoration:"none"}}>Albion Online Data Project</a> · No afiliado a Sandbox Interactive
        </div>
        <div style={{fontSize:11,color:"#27272a"}}>
          {ALL_ITEMS.length} items · 6 ciudades · 3 servidores · Confidence Score · Comunidad
        </div>
        <div style={{marginTop:8,display:"flex",justifyContent:"center"}}>
          <DonationBtn/>
        </div>
      </div>
    </div>
  );
}
