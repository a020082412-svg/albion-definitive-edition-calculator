import { useState, useEffect, useCallback } from "react";

const CITIES = ["Caerleon", "Bridgewatch", "Fort Sterling", "Lymhurst", "Martlock", "Thetford"];

const SERVERS = [
{ id: "west",  label: "América",  flag: "🌎", url: "https://west.albion-online-data.com/api/v2/stats/prices" },
{ id: "east",  label: "Asia",     flag: "🌏", url: "https://east.albion-online-data.com/api/v2/stats/prices" },
{ id: "europe",label: "Europa",   flag: "🌍", url: "https://europe.albion-online-data.com/api/v2/stats/prices" },
];

const RAW_TIERS = [
{ prefix: "FIBER",   names: ["Fibra"] },
{ prefix: "WOOD",    names: ["Madera"] },
{ prefix: "ORE",     names: ["Mineral"] },
{ prefix: "HIDE",    names: ["Cuero"] },
{ prefix: "ROCK",    names: ["Piedra"] },
];

const PROCESSED_TIERS = [
{ prefix: "PLANKS",     name: "Tablas" },
{ prefix: "METALBAR",   name: "Barra Metal" },
{ prefix: "LEATHER",    name: "Cuero Proc" },
{ prefix: "CLOTH",      name: "Tela" },
{ prefix: "STONEBLOCK", name: "Bloque Piedra" },
];

const buildRaw = () => {
const items = [];
RAW_TIERS.forEach(({ prefix, names }) => {
const maxT = prefix === "ROCK" ? 7 : 8;
for (let t = 2; t <= maxT; t++) {
items.push({ id: `T${t}_${prefix}`, name: `${names[0]} T${t}`, cat: "recurso" });
}
});
return items;
};

const buildProcessed = () => {
const items = [];
PROCESSED_TIERS.forEach(({ prefix, name }) => {
const maxT = prefix === "STONEBLOCK" ? 7 : 8;
for (let t = 2; t <= maxT; t++) {
items.push({ id: `T${t}_${prefix}`, name: `${name} T${t}`, cat: "recurso" });
}
});
return items;
};

const WEAPON_TYPES = [
{ id: "MAIN_SWORD",       name: "Espada",            max: 8 },
{ id: "2H_CLAYMORE",      name: "Mandoble",          max: 8 },
{ id: "MAIN_AXE",         name: "Hacha",             max: 8 },
{ id: "2H_AXE",           name: "Hacha 2M",          max: 8 },
{ id: "MAIN_MACE",        name: "Maza",              max: 8 },
{ id: "2H_MACE",          name: "Maza 2M",           max: 8 },
{ id: "MAIN_DAGGER",      name: "Daga",              max: 8 },
{ id: "2H_DAGGERPAIR",    name: "Dagas Dobles",      max: 8 },
{ id: "2H_BOW",           name: "Arco",              max: 8 },
{ id: "2H_CROSSBOW",      name: "Ballesta",          max: 8 },
{ id: "MAIN_SPEAR",       name: "Lanza",             max: 8 },
{ id: "2H_SPEAR",         name: "Lanza 2M",          max: 8 },
{ id: "MAIN_FIRESTAFF",   name: "Baston Fuego",      max: 8 },
{ id: "2H_FIRESTAFF",     name: "Baston Fuego 2M",   max: 8 },
{ id: "MAIN_HOLYSTAFF",   name: "Baston Sagrado",    max: 8 },
{ id: "2H_HOLYSTAFF",     name: "Baston Sagrado 2M", max: 8 },
{ id: "MAIN_ARCANESTAFF", name: "Baston Arcano",     max: 8 },
{ id: "2H_ARCANESTAFF",   name: "Baston Arcano 2M",  max: 8 },
{ id: "MAIN_FROSTSTAFF",  name: "Baston Hielo",      max: 8 },
{ id: "2H_FROSTSTAFF",    name: "Baston Hielo 2M",   max: 8 },
{ id: "MAIN_NATURESTAFF", name: "Baston Natura",     max: 8 },
{ id: "2H_NATURESTAFF",   name: "Baston Natura 2M",  max: 8 },
{ id: "2H_CURSEDSTAFF",   name: "Baston Maldito",    max: 8 },
{ id: "MAIN_QUARTERSTAFF",name: "Baston Cuarteron",  max: 8 },
{ id: "2H_HALBERD",       name: "Alabarda",          max: 8 },
{ id: "2H_GLAIVE",        name: "Guadaña",           max: 8 },
{ id: "2H_POLEHAMMER",    name: "Martillo Asta",     max: 8 },
{ id: "MAIN_HAMMER",      name: "Martillo",          max: 8 },
{ id: "2H_HAMMER",        name: "Martillo 2M",       max: 8 },
{ id: "2H_WARBOW",        name: "Arco de Guerra",    max: 8 },
{ id: "MAIN_TORCH",       name: "Antorcha MH",       max: 8 },
{ id: "2H_INFERNOSTAFF",  name: "Baston Infierno",   max: 8 },
{ id: "2H_ICICLESTAFF",   name: "Baston Carabano",   max: 8 },
{ id: "2H_DEMONICSTAFF",  name: "Baston Demonico",   max: 8 },
{ id: "2H_WILDSTAFF",     name: "Baston Silvestre",  max: 8 },
];

const buildWeapons = () => {
const items = [];
WEAPON_TYPES.forEach(({ id, name, max }) => {
for (let t = 4; t <= max; t++) {
items.push({ id: `T${t}_${id}`, name: `${name} T${t}`, cat: "arma" });
}
});
return items;
};

const ARMOR_SETS = [
{ type: "HEAD_CLOTH_SET1",   name: "Capucha Tela" },
{ type: "ARMOR_CLOTH_SET1",  name: "Tunica" },
{ type: "SHOES_CLOTH_SET1",  name: "Sandalias" },
{ type: "HEAD_LEATHER_SET1", name: "Casco Cuero" },
{ type: "ARMOR_LEATHER_SET1",name: "Armadura Cuero" },
{ type: "SHOES_LEATHER_SET1",name: "Botas Cuero" },
{ type: "HEAD_PLATE_SET1",   name: "Yelmo Placa" },
{ type: "ARMOR_PLATE_SET1",  name: "Pecho Placa" },
{ type: "SHOES_PLATE_SET1",  name: "Botas Placa" },
{ type: "HEAD_CLOTH_SET2",   name: "Capucha Tela S2" },
{ type: "ARMOR_CLOTH_SET2",  name: "Tunica S2" },
{ type: "SHOES_CLOTH_SET2",  name: "Sandalias S2" },
{ type: "HEAD_LEATHER_SET2", name: "Casco Cuero S2" },
{ type: "ARMOR_LEATHER_SET2",name: "Armadura Cuero S2" },
{ type: "SHOES_LEATHER_SET2",name: "Botas Cuero S2" },
{ type: "HEAD_PLATE_SET2",   name: "Yelmo Placa S2" },
{ type: "ARMOR_PLATE_SET2",  name: "Pecho Placa S2" },
{ type: "SHOES_PLATE_SET2",  name: "Botas Placa S2" },
{ type: "HEAD_CLOTH_SET3",   name: "Capucha Tela S3" },
{ type: "ARMOR_CLOTH_SET3",  name: "Tunica S3" },
{ type: "SHOES_CLOTH_SET3",  name: "Sandalias S3" },
{ type: "HEAD_LEATHER_SET3", name: "Casco Cuero S3" },
{ type: "ARMOR_LEATHER_SET3",name: "Armadura Cuero S3" },
{ type: "SHOES_LEATHER_SET3",name: "Botas Cuero S3" },
{ type: "HEAD_PLATE_SET3",   name: "Yelmo Placa S3" },
{ type: "ARMOR_PLATE_SET3",  name: "Pecho Placa S3" },
{ type: "SHOES_PLATE_SET3",  name: "Botas Placa S3" },
];

const buildArmors = () => {
const items = [];
ARMOR_SETS.forEach(({ type, name }) => {
for (let t = 4; t <= 8; t++) {
items.push({ id: `T${t}_${type}`, name: `${name} T${t}`, cat: "armadura" });
}
});
return items;
};

const OFF_HAND_TYPES = [
{ id: "OFF_SHIELD",    name: "Escudo" },
{ id: "OFF_TORCH",     name: "Antorcha" },
{ id: "OFF_HORN",      name: "Cuerno" },
{ id: "OFF_BOOK",      name: "Libro" },
{ id: "OFF_ORB",       name: "Orbe" },
{ id: "OFF_DAGGER",    name: "Daga Off" },
{ id: "OFF_TOTEM",     name: "Totem" },
{ id: "OFF_SKULL",     name: "Craneo" },
{ id: "OFF_LAMP",      name: "Lampara" },
];

const buildOffHand = () => {
const items = [];
OFF_HAND_TYPES.forEach(({ id, name }) => {
for (let t = 4; t <= 8; t++) {
items.push({ id: `T${t}_${id}`, name: `${name} T${t}`, cat: "armadura" });
}
});
return items;
};

const buildAccessories = () => {
const items = [];
const cities = ["BRIDGEWATCH","FORTSTERLING","LYMHURST","MARTLOCK","THETFORD","CAERLEON"];
cities.forEach(c => {
for (let t = 4; t <= 5; t++) {
items.push({ id: `T${t}_CAPEITEM_FW_${c}`, name: `Capa ${c.charAt(0)+c.slice(1).toLowerCase()} T${t}`, cat: "accesorio" });
}
});
for (let t = 4; t <= 8; t++) {
items.push({ id: `T${t}_BAG`, name: `Bolsa T${t}`, cat: "accesorio" });
}
for (let t = 4; t <= 8; t++) {
items.push({ id: `T${t}_GATHERER_BAG`, name: `Mochila Recolector T${t}`, cat: "accesorio" });
}
const mounts = [
{ id: "MOUNT_HORSE",       name: "Caballo" },
{ id: "MOUNT_ARMORED_HORSE",name: "Caballo Armado" },
{ id: "MOUNT_OX",          name: "Buey" },
{ id: "MOUNT_ARMORED_OX",  name: "Buey Armado" },
{ id: "MOUNT_GIANT_HORSE", name: "Caballo Gigante" },
{ id: "MOUNT_DIREWOLF",    name: "Lobo Feroz" },
{ id: "MOUNT_SWAMPDRAGON", name: "Dragon Pantano" },
];
mounts.forEach(({ id, name }) => {
for (let t = 4; t <= 8; t++) {
items.push({ id: `T${t}_${id}`, name: `${name} T${t}`, cat: "montura" });
}
});
["POTION_HEALING","POTION_ENERGY","POTION_GIGANTIFY","POTION_RESISTANCE","POTION_SWIFTNESS","POTION_STICKY","POTION_POISON"].forEach(p => {
for (let t = 2; t <= 7; t++) {
items.push({ id: `QUESTITEM_TOKEN_${p}_T${t}`, name: `${p.replace("POTION_","Pocion ")} T${t}`, cat: "consumible" });
}
});
["MEAL_ROAST","MEAL_SALAD","MEAL_SOUP","MEAL_SANDWICH","MEAL_PIE","MEAL_OMELETTE"].forEach(m => {
for (let t = 3; t <= 8; t++) {
items.push({ id: `${m}_T${t}`, name: `${m.replace("MEAL_","Comida ")} T${t}`, cat: "consumible" });
}
});
return items;
};

const SNIPER_ITEMS = [
...buildRaw(),
...buildProcessed(),
...buildWeapons(),
...buildArmors(),
...buildOffHand(),
...buildAccessories(),
];

const TRANSPORT_ITEMS = [
...buildRaw().map(i => ({ id: i.id, name: i.name })),
...buildProcessed().map(i => ({ id: i.id, name: i.name })),
];

const buildCraftRecipes = () => {
const recipes = [];
const procMap = [
{ out: "METALBAR",   mat: "ORE",   matName: "Mineral",   outName: "Barra Metal" },
{ out: "PLANKS",     mat: "WOOD",  matName: "Madera",    outName: "Tablas" },
{ out: "LEATHER",    mat: "HIDE",  matName: "Cuero",     outName: "Cuero Proc" },
{ out: "CLOTH",      mat: "FIBER", matName: "Fibra",     outName: "Tela" },
{ out: "STONEBLOCK", mat: "ROCK",  matName: "Piedra",    outName: "Bloque Piedra" },
];
const fees = { 3: 50, 4: 100, 5: 200, 6: 400, 7: 800, 8: 1600 };
procMap.forEach(({ out, mat, matName, outName }) => {
const maxT = out === "STONEBLOCK" ? 7 : 8;
for (let t = 3; t <= maxT; t++) {
recipes.push({
id: `T${t}_${out}`, name: `${outName} T${t}`, cat: "recurso",
mat: [{ id: `T${t}_${mat}`, name: `${matName} T${t}`, qty: 8 }],
out: 1, fee: fees[t],
});
}
});
const weaponRecipes = [
{ id: "MAIN_SWORD",       name: "Espada",           mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"PLANKS",qty:4 }] },
{ id: "2H_CLAYMORE",      name: "Mandoble",         mat: (t) => [{ p:"METALBAR",qty:20 }] },
{ id: "MAIN_AXE",         name: "Hacha",            mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"PLANKS",qty:4 }] },
{ id: "2H_AXE",           name: "Hacha 2M",         mat: (t) => [{ p:"METALBAR",qty:20 }] },
{ id: "MAIN_MACE",        name: "Maza",             mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
{ id: "2H_MACE",          name: "Maza 2M",          mat: (t) => [{ p:"METALBAR",qty:16 },{ p:"STONEBLOCK",qty:8 }] },
{ id: "MAIN_DAGGER",      name: "Daga",             mat: (t) => [{ p:"METALBAR",qty:8 },{ p:"LEATHER",qty:8 }] },
{ id: "2H_DAGGERPAIR",    name: "Dagas Dobles",     mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"LEATHER",qty:12 }] },
{ id: "MAIN_SPEAR",       name: "Lanza",            mat: (t) => [{ p:"METALBAR",qty:8 },{ p:"PLANKS",qty:8 }] },
{ id: "2H_SPEAR",         name: "Lanza 2M",         mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"PLANKS",qty:12 }] },
{ id: "2H_HALBERD",       name: "Alabarda",         mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"PLANKS",qty:8 }] },
{ id: "2H_GLAIVE",        name: "Guadaña",          mat: (t) => [{ p:"METALBAR",qty:8 },{ p:"PLANKS",qty:12 }] },
{ id: "2H_BOW",           name: "Arco",             mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"LEATHER",qty:8 }] },
{ id: "2H_CROSSBOW",      name: "Ballesta",         mat: (t) => [{ p:"PLANKS",qty:12 },{ p:"METALBAR",qty:8 }] },
{ id: "2H_WARBOW",        name: "Arco de Guerra",   mat: (t) => [{ p:"PLANKS",qty:20 },{ p:"LEATHER",qty:8 }] },
{ id: "MAIN_FIRESTAFF",   name: "Baston Fuego",     mat: (t) => [{ p:"PLANKS",qty:12 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_FIRESTAFF",     name: "Baston Fuego 2M",  mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_INFERNOSTAFF",  name: "Baston Infierno",  mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:12 }] },
{ id: "MAIN_HOLYSTAFF",   name: "Baston Sagrado",   mat: (t) => [{ p:"PLANKS",qty:12 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_HOLYSTAFF",     name: "Baston Sagrado 2M",mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:8 }] },
{ id: "MAIN_ARCANESTAFF", name: "Baston Arcano",    mat: (t) => [{ p:"PLANKS",qty:12 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_ARCANESTAFF",   name: "Baston Arcano 2M", mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:8 }] },
{ id: "MAIN_FROSTSTAFF",  name: "Baston Hielo",     mat: (t) => [{ p:"PLANKS",qty:12 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_FROSTSTAFF",    name: "Baston Hielo 2M",  mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_ICICLESTAFF",   name: "Baston Carabano",  mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:12 }] },
{ id: "MAIN_NATURESTAFF", name: "Baston Natura",    mat: (t) => [{ p:"PLANKS",qty:12 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_NATURESTAFF",   name: "Baston Natura 2M", mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_WILDSTAFF",     name: "Baston Silvestre", mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:12 }] },
{ id: "2H_CURSEDSTAFF",   name: "Baston Maldito",   mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:8 }] },
{ id: "2H_DEMONICSTAFF",  name: "Baston Demonico",  mat: (t) => [{ p:"PLANKS",qty:16 },{ p:"CLOTH",qty:12 }] },
{ id: "MAIN_QUARTERSTAFF",name: "Baston Cuarteron", mat: (t) => [{ p:"PLANKS",qty:20 }] },
{ id: "2H_POLEHAMMER",    name: "Martillo Asta",    mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"PLANKS",qty:8 }] },
{ id: "MAIN_HAMMER",      name: "Martillo",         mat: (t) => [{ p:"METALBAR",qty:12 },{ p:"PLANKS",qty:4 }] },
{ id: "2H_HAMMER",        name: "Martillo 2M",      mat: (t) => [{ p:"METALBAR",qty:20 }] },
];
const weaponFees = { 4: 300, 5: 600, 6: 1200, 7: 2400, 8: 4800 };
weaponRecipes.forEach(({ id, name, mat }) => {
for (let t = 4; t <= 8; t++) {
recipes.push({
id: `T${t}_${id}`, name: `${name} T${t}`, cat: "arma",
mat: mat(t).map(m => ({
id: `T${t}_${m.p}`,
name: `${PROCESSED_TIERS.find(p => p.prefix === m.p)?.name || m.p} T${t}`,
qty: m.qty,
})),
out: 1, fee: weaponFees[t],
});
}
});
const armorFees = { 4: 300, 5: 600, 6: 1200, 7: 2400, 8: 4800 };
const armorRecipes = [
{ id: "HEAD_CLOTH_SET1",   name: "Capucha Tela",   mat: [{ p:"CLOTH",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "ARMOR_CLOTH_SET1",  name: "Tunica",          mat: [{ p:"CLOTH",qty:16 },{ p:"PLANKS",qty:4 }] },
{ id: "SHOES_CLOTH_SET1",  name: "Sandalias",       mat: [{ p:"CLOTH",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "HEAD_CLOTH_SET2",   name: "Capucha Tela S2", mat: [{ p:"CLOTH",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "ARMOR_CLOTH_SET2",  name: "Tunica S2",       mat: [{ p:"CLOTH",qty:16 },{ p:"PLANKS",qty:4 }] },
{ id: "SHOES_CLOTH_SET2",  name: "Sandalias S2",    mat: [{ p:"CLOTH",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "HEAD_CLOTH_SET3",   name: "Capucha Tela S3", mat: [{ p:"CLOTH",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "ARMOR_CLOTH_SET3",  name: "Tunica S3",       mat: [{ p:"CLOTH",qty:16 },{ p:"PLANKS",qty:4 }] },
{ id: "SHOES_CLOTH_SET3",  name: "Sandalias S3",    mat: [{ p:"CLOTH",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "HEAD_LEATHER_SET1",   name: "Casco Cuero",     mat: [{ p:"LEATHER",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "ARMOR_LEATHER_SET1",  name: "Armadura Cuero",  mat: [{ p:"LEATHER",qty:16 },{ p:"METALBAR",qty:4 }] },
{ id: "SHOES_LEATHER_SET1",  name: "Botas Cuero",     mat: [{ p:"LEATHER",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "HEAD_LEATHER_SET2",   name: "Casco Cuero S2",  mat: [{ p:"LEATHER",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "ARMOR_LEATHER_SET2",  name: "Armadura Cuero S2",mat:[{ p:"LEATHER",qty:16 },{ p:"METALBAR",qty:4 }] },
{ id: "SHOES_LEATHER_SET2",  name: "Botas Cuero S2",  mat: [{ p:"LEATHER",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "HEAD_LEATHER_SET3",   name: "Casco Cuero S3",  mat: [{ p:"LEATHER",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "ARMOR_LEATHER_SET3",  name: "Armadura Cuero S3",mat:[{ p:"LEATHER",qty:16 },{ p:"METALBAR",qty:4 }] },
{ id: "SHOES_LEATHER_SET3",  name: "Botas Cuero S3",  mat: [{ p:"LEATHER",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "HEAD_PLATE_SET1",   name: "Yelmo Placa",     mat: [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
{ id: "ARMOR_PLATE_SET1",  name: "Pecho Placa",     mat: [{ p:"METALBAR",qty:16 },{ p:"STONEBLOCK",qty:8 }] },
{ id: "SHOES_PLATE_SET1",  name: "Botas Placa",     mat: [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
{ id: "HEAD_PLATE_SET2",   name: "Yelmo Placa S2",  mat: [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
{ id: "ARMOR_PLATE_SET2",  name: "Pecho Placa S2",  mat: [{ p:"METALBAR",qty:16 },{ p:"STONEBLOCK",qty:8 }] },
{ id: "SHOES_PLATE_SET2",  name: "Botas Placa S2",  mat: [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
{ id: "HEAD_PLATE_SET3",   name: "Yelmo Placa S3",  mat: [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
{ id: "ARMOR_PLATE_SET3",  name: "Pecho Placa S3",  mat: [{ p:"METALBAR",qty:16 },{ p:"STONEBLOCK",qty:8 }] },
{ id: "SHOES_PLATE_SET3",  name: "Botas Placa S3",  mat: [{ p:"METALBAR",qty:12 },{ p:"STONEBLOCK",qty:4 }] },
];
armorRecipes.forEach(({ id, name, mat }) => {
for (let t = 4; t <= 8; t++) {
recipes.push({
id: `T${t}_${id}`, name: `${name} T${t}`, cat: "armadura",
mat: mat.map(m => ({
id: `T${t}_${m.p}`,
name: `${PROCESSED_TIERS.find(p => p.prefix === m.p)?.name || m.p} T${t}`,
qty: m.qty,
})),
out: 1, fee: armorFees[t],
});
}
});
const offRecipes = [
{ id: "OFF_SHIELD", name: "Escudo", mat: [{ p:"METALBAR",qty:8 },{ p:"PLANKS",qty:4 }] },
{ id: "OFF_TORCH",  name: "Antorcha", mat: [{ p:"PLANKS",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "OFF_HORN",   name: "Cuerno", mat: [{ p:"LEATHER",qty:8 },{ p:"PLANKS",qty:4 }] },
{ id: "OFF_BOOK",   name: "Libro", mat: [{ p:"CLOTH",qty:8 },{ p:"PLANKS",qty:4 }] },
{ id: "OFF_ORB",    name: "Orbe", mat: [{ p:"CLOTH",qty:8 },{ p:"METALBAR",qty:4 }] },
{ id: "OFF_DAGGER", name: "Daga Off", mat: [{ p:"METALBAR",qty:8 },{ p:"LEATHER",qty:4 }] },
{ id: "OFF_TOTEM",  name: "Totem", mat: [{ p:"PLANKS",qty:8 },{ p:"CLOTH",qty:4 }] },
{ id: "OFF_SKULL",  name: "Craneo", mat: [{ p:"CLOTH",qty:8 },{ p:"PLANKS",qty:4 }] },
{ id: "OFF_LAMP",   name: "Lampara", mat: [{ p:"CLOTH",qty:6 },{ p:"METALBAR",qty:4 }] },
];
offRecipes.forEach(({ id, name, mat }) => {
for (let t = 4; t <= 8; t++) {
recipes.push({
id: `T${t}_${id}`, name: `${name} T${t}`, cat: "armadura",
mat: mat.map(m => ({
id: `T${t}_${m.p}`,
name: `${PROCESSED_TIERS.find(p => p.prefix === m.p)?.name || m.p} T${t}`,
qty: m.qty,
})),
out: 1, fee: armorFees[t],
});
}
});
return recipes;
};

const CRAFT_RECIPES = buildCraftRecipes();

// ─── BLACK ZONE DATA ─────────────────────────────────────────────────────────
const BLACK_ZONE_BUILDS = [
  {
    id: "bz_1",
    name: "Fantasma Recolector",
    rol: "Recolector / Escape",
    tier: "T6",
    costo: 350000,
    riesgoEquipo: "bajo",
    silver_h: 1400000,
    descripcion: "El build más seguro para zona negra. Prioriza sobrevivir y escapar sobre el DPS. Ideal si eres nuevo en PvP.",
    arma: "Hacha T6 o Baston Cuarteron T6",
    cabeza: "Capucha Recolector T6",
    pecho: "Armadura Recolector T6 (máx bonus de recolección)",
    botas: "Botas de Mercader T6 (velocidad extra)",
    offhand: "—",
    capa: "Capa de Fort Sterling T4 (inmunidad breve al ser atacado)",
    montura: "Lobo Feroz T6 (velocidad alta)",
    comida: "Comida de Pollo T5 (bonus HP)",
    pocion: "Poción de Velocidad T5",
    habilidades: [
      { slot: "Q", habilidad: "Golpe Pesado — buena para interrumpir perseguidores" },
      { slot: "W", habilidad: "Correr — para escapar si te rodean" },
      { slot: "E", habilidad: "Salto de Recolector / Dash — CRÍTICO para escapar" },
      { slot: "Capa", habilidad: "Inmunidad temporal al activarse" },
    ],
    consejos: [
      "Nunca lleves más items de los que puedas permitirte perder.",
      "Si ves más de 1 enemigo en el mapa, sal de inmediato por el portal más cercano.",
      "Farmea en los bordes del mapa, no en el centro.",
      "El Lobo Feroz T6 te permite escapar de casi cualquier grupo pequeño.",
      "Si te atacan, usa el dash primero, luego la capa. No al revés.",
    ],
    profit_tips: [
      "Vende siempre los recursos en Caerleon o la ciudad que pague más (usa el Sniper).",
      "El multiplicador de Premium hace que cada sesión valga el doble.",
      "Los recursos T7-T8 en zona negra pueden valer 3x más que en zona amarilla.",
    ],
    color: "#4ade80",
    icon: "👻",
  },
  {
    id: "bz_2",
    name: "Asesino de Solitarios",
    rol: "PvP / Robar kills",
    tier: "T6-T7",
    costo: 750000,
    riesgoEquipo: "medio",
    silver_h: 2100000,
    descripcion: "Para jugadores que ya tienen experiencia en PvP. Ganas silver matando recolectores solos y agarrando su loot.",
    arma: "Dagas Dobles T6 o Arco T6",
    cabeza: "Casco Cuero T6 (bonus de velocidad)",
    pecho: "Armadura Cuero T6",
    botas: "Botas de Cazador T6",
    offhand: "— (2H preferido)",
    capa: "Capa de Bridgewatch T4 (bonus de daño en apertura)",
    montura: "Lobo Feroz T6 — desmonta rápido para pelear",
    comida: "Pastel T6 (bonus de daño)",
    pocion: "Poción de Velocidad T5",
    habilidades: [
      { slot: "Q", habilidad: "Golpe Veneno — daño sobre tiempo mientras escapan" },
      { slot: "W", habilidad: "Sombra — volverte invisible brevemente para reposicionarte" },
      { slot: "E", habilidad: "Salto Letal — cierre de distancia o escape" },
      { slot: "Capa", habilidad: "Bonus daño de apertura — úsalo al inicio del combate" },
    ],
    consejos: [
      "Solo ataca recolectores solos. Nunca a grupos de 2+.",
      "Usa los árboles y rocas como cobertura para emboscar.",
      "Si el objetivo monta y huye, no lo persigas más de 5 segundos.",
      "Guarda el E para escapar, no solo para atacar.",
      "Retírate antes de que lleguen sus amigos. El loot no vale morir.",
    ],
    profit_tips: [
      "El loot de recolectores en zona negra suele incluir recursos T6-T8 que valen mucho.",
      "Además del loot, también ganas Fame que sube tus habilidades más rápido.",
      "Intenta durante horas pico del servidor para encontrar más targets.",
    ],
    color: "#f97316",
    icon: "🗡️",
  },
  {
    id: "bz_3",
    name: "Tanque de Dungeons",
    rol: "Dungeon / PvE en BZ",
    tier: "T7",
    costo: 1200000,
    riesgoEquipo: "medio",
    silver_h: 2800000,
    descripcion: "Para farmear Dungeons Randomizados en zona negra. Los chests de los dungeons dan el mejor loot del juego. Se puede ir solo.",
    arma: "Maza 2M T7 o Bastón Sagrado T7",
    cabeza: "Yelmo Placa T7",
    pecho: "Pecho Placa T7 (máx resistencia)",
    botas: "Botas Placa T7",
    offhand: "Escudo T7",
    capa: "Capa de Martlock T4 (reducción de daño recibido)",
    montura: "Caballo Armado T7 — más resistente al dismount forzado",
    comida: "Sopa T7 (bonus de resistencia)",
    pocion: "Poción de Curación T6",
    habilidades: [
      { slot: "Q", habilidad: "Golpe de Escudo — interrupción + daño" },
      { slot: "W", habilidad: "Grito de Guerra — aumenta tu defensa" },
      { slot: "E", habilidad: "Muro de Tierra — crea barrera para bloquear enemigos" },
      { slot: "Capa", habilidad: "Escudo de Martlock — reducción de daño al activarse" },
    ],
    consejos: [
      "Entra al dungeon SOLO en zona negra. Con grupo, el loot se divide y vale menos.",
      "Limpia el dungeon de adentro hacia afuera para evitar que te encierren.",
      "Si ves un jugador entrar al dungeon, sal inmediatamente o prepárate para pelear.",
      "Los chests dorados del final del dungeon son el objetivo principal.",
      "Usa el mapa para siempre saber cuántos portales de escape tienes disponibles.",
    ],
    profit_tips: [
      "Un dungeon T7 en zona negra puede dar 400k–800k silver en un solo run.",
      "Los artefactos que drops en dungeons se venden muy caro en el mercado.",
      "Si encuentras un chest con equipo T8, puedes sacar 1M+ de un solo dungeon.",
      "El loot de mobs también cuenta — no ignores los drops de monstruos élite.",
    ],
    color: "#60a5fa",
    icon: "🛡️",
  },
  {
    id: "bz_4",
    name: "Mago del Caos",
    rol: "Ganker / AoE PvP",
    tier: "T6-T7",
    costo: 900000,
    riesgoEquipo: "alto",
    silver_h: 3200000,
    descripcion: "Build de alto riesgo para jugadores experimentados. Ideal para small group PvP. Máximo daño AoE para limpiar grupos pequeños.",
    arma: "Bastón de Fuego 2M T7 o Bastón Maldito T7",
    cabeza: "Capucha Tela S3 T7 (máx daño hechizos)",
    pecho: "Túnica Arcana T7",
    botas: "Sandalias de Mago T7",
    offhand: "— (2H obligatorio)",
    capa: "Capa de Thetford T4 (bonus de velocidad de cast)",
    montura: "Lobo Feroz T7 — velocidad crítica",
    comida: "Empanada T7 (bonus de daño mágico)",
    pocion: "Poción de Energía T6",
    habilidades: [
      { slot: "Q", habilidad: "Bola de Fuego — daño AoE en área grande" },
      { slot: "W", habilidad: "Lluvia de Fuego — daño sobre tiempo en zona" },
      { slot: "E", habilidad: "Meteorito — BURST masivo, úsalo cuando estén agrupados" },
      { slot: "Capa", habilidad: "Velocidad de cast — spammea hechizos más rápido" },
    ],
    consejos: [
      "NUNCA vayas solo con este build. Necesitas al menos 1 healer en el grupo.",
      "Tu trabajo es hacer burst al grupo enemigo, no pelear 1v1.",
      "Mantente atrás. Si te enfocan, estás muerto en 3 segundos.",
      "Comunícate con tu grupo en Discord — la coordinación es todo.",
      "Si pierdes el equipo T7 de mago, pierdes mucho silver. Asegúrate de tener reserve.",
    ],
    profit_tips: [
      "En grupo, el loot se comparte pero también el riesgo se divide.",
      "Limpiar un HCE (Hardcore Expedition) con guild puede dar 2-5M por sesión.",
      "Los kills de jugadores equipados con T7-T8 pueden darte equipo valioso para vender.",
    ],
    color: "#ef4444",
    icon: "🔥",
  },
];

const BLACK_ZONE_TIPS = [
  {
    categoria: "Mentalidad",
    icon: "🧠",
    color: "#a78bfa",
    tips: [
      "La zona negra es full-loot PvP. Todo lo que llevas puesto lo puedes perder. Nunca lleves más de lo que puedes permitirte perder.",
      "El mejor profit de la zona negra no viene de ser el más fuerte, sino del que mejor conoce cuándo retirarse.",
      "Perder equipo es parte del juego. Si no puedes aceptarlo, no entres a zona negra todavía.",
      "El tiempo en zona negra vale oro. 30 minutos eficientes > 2 horas distraid@ muriendo.",
    ],
  },
  {
    categoria: "Rutas y Navegación",
    icon: "🗺️",
    color: "#4ade80",
    tips: [
      "Siempre entra con un plan de escape. ¿Cuál es el portal más cercano? ¿Dónde está Caerleon desde aquí?",
      "Farmea en los bordes del mapa, no en el centro. El centro es donde se forman los fights.",
      "Usa el mapa para notar si hay jugadores en zonas adyacentes que puedan entrar.",
      "Entra y sal rápido. Sesiones de 15-25 minutos son más seguras que quedarse 1 hora.",
      "Los portales de Caerleon Roads conectan directamente a zona negra — úsalos estratégicamente.",
    ],
  },
  {
    categoria: "Profit Maximization",
    icon: "💰",
    color: "#f59e0b",
    tips: [
      "El multiplicador de recursos en zona negra es 1.5x–2x vs zona roja. Vale la pena el riesgo.",
      "Los recursos T7 y T8 son los más escasos y los que más silver dan. Son tu objetivo principal.",
      "Vende siempre en Caerleon o compara con el Sniper antes de vender localmente.",
      "Con Premium activo, cada recurso que farmeas vale aprox 50% más en taxes reducidas y bonus.",
      "Un dungeon solo en zona negra T6-T7 puede dar 300k-1M silver en 20 minutos.",
      "Los artefactos que dropean dungeons se venden en el mercado entre 500k y 5M según el tier.",
    ],
  },
  {
    categoria: "Gestión de Riesgo",
    icon: "⚠️",
    color: "#f97316",
    tips: [
      "Regla de oro: nunca entres con equipo que no puedas recomprar 3 veces. Si tienes 1M, no lleves equipo de 800k.",
      "Lleva siempre una montura de repuesto en el inventario para si te desmuntan.",
      "Si ves un guild con 5+ jugadores en la misma zona, retírate. No puedes ganar esa pelea.",
      "Activa el modo 'no atacar' cuando recolectas para evitar dar bandera PvP accidentalmente.",
      "Si tienes un buen loot acumulado, sal y vende antes de arriesgarlo más.",
    ],
  },
  {
    categoria: "Trucos Avanzados",
    icon: "⚡",
    color: "#60a5fa",
    tips: [
      "El 'Avalonian Roads' (portales azules en el mapa) conecta zonas negras de forma rápida y tiene menos players que los roads normales.",
      "Usar una capa de ciudad te da un efecto único que puede ser la diferencia entre escapar o morir.",
      "Si tienes un Buey (Ox), cárgalo con recursos y deja tu personaje vacío para escapar más rápido si te atacan.",
      "Las 'Faction Flags' aumentan tu plata por hora si completas misiones de facción, incluso en zona negra.",
      "Los 'Roads of Avalon' tienen los mejores spots de farmeo pero también los gankers más peligrosos.",
    ],
  },
];

// ─── FARM ZONES & BUILDS ──────────────────────────────────────────────────────
const FARM_ZONES = [
{ name:"Highland Cross",tier:"T5-T6",resource:"Piedra / Mineral",risk:"bajo",time:20,silver:290000,pvp:false,zone:"Fort Sterling",steps:["Sal de Fort Sterling por el portal norte","Entra a la zona amarilla Highland Cross","Ve al primer nodo de mineral (esquina NW)","Recoge todo el mineral T5 disponible","Muevete en Z hacia el siguiente nodo","Regresa por el mismo portal al completar","Vende en Fort Sterling o transporta a Caerleon"],tip:"Zona segura ideal para principiantes. Mucho mineral T5 disponible."},
{ name:"Deepwood",tier:"T5",resource:"Madera / Fibra",risk:"bajo",time:22,silver:310000,pvp:false,zone:"Lymhurst",steps:["Sal de Lymhurst por el portal este","Entra a Deepwood (zona verde)","Sigue el camino principal hacia el norte","Los arboles T5 estan agrupados en 3 clusters","Empieza por el cluster mas cercano al portal","Farmea en sentido horario para aprovechar respawn","Vuelve antes de 20 min para maxima eficiencia"],tip:"Facil acceso y respawn rapido de madera T5. Bueno para empezar."},
{ name:"Swamp Cross",tier:"T5-T6",resource:"Fibra / Escondite",risk:"medio",time:25,silver:380000,pvp:false,zone:"Thetford",steps:["Sal de Thetford por el portal sur","Entra a Swamp Cross con montura rapida","Los nodos de fibra estan al oeste del mapa","Farmea en circulos grandes (no te quedes quieto)","Mantente cerca de los bordes del mapa","Si ves jugadores enemigos, usa la salida norte","Vende la fibra en Thetford o Caerleon"],tip:"Entra por el portal del sur. Farmea en circulos para aprovechar el respawn."},
{ name:"Forest Cross",tier:"T6",resource:"Madera / Fibra",risk:"medio",time:28,silver:410000,pvp:false,zone:"Lymhurst",steps:["Sal de Lymhurst con build de recolector T5+","Entra a Forest Cross por el portal principal","Los arboles T6 estan concentrados en el centro","Evita el area central si hay jugadores","Ruta recomendada: Norte → Este → Sur → salida","Lleva al menos 2 pociones de velocidad","La madera T6 vale mas vendida en Caerleon"],tip:"La madera T6 tiene alta demanda. Vende en Caerleon para maximo profit."},
{ name:"Sunsteppe",tier:"T6",resource:"Cuero / Escondite",risk:"medio",time:30,silver:430000,pvp:true,zone:"Bridgewatch",steps:["Equipa build con alta velocidad de movimiento","Sal de Bridgewatch por el portal este","Entra a Sunsteppe con montura T5+","Los nodos de cuero estan dispersos en el mapa","Farmea haciendo un circulo por los bordes","Ten siempre la salida a la vista","Si te persiguen usa la habilidad de escape inmediatamente"],tip:"Ruta circular muy eficiente para cuero T6. Lleva pocion de velocidad."},
{ name:"Steppe Cross",tier:"T6-T7",resource:"Escondite / Cuero",risk:"alto",time:30,silver:520000,pvp:true,zone:"Bridgewatch",steps:["Solo entrar si tienes build T5+ y experiencia en PvP","Equipa montura rapida y pociones de velocidad","Entra rapido y ve directo a los nodos del borde","Evita el centro del mapa (zona de emboscadas)","Farmea maximo 10-15 min por sesion","Si ves guild tags, sal inmediatamente","Vende en Bridgewatch o transporta con cuidado"],tip:"Ten mount rapido siempre listo. Evita el centro del mapa, hay guilds activas."},
{ name:"Frostpeak",tier:"T6-T7",resource:"Mineral / Piedra",risk:"alto",time:38,silver:610000,pvp:true,zone:"Fort Sterling",steps:["Solo con build de tanque T6 o superior","Sal de Fort Sterling con escudo equipado","Entra a Frostpeak por el portal norte","Los nodos de mineral T7 estan al noreste","Farmea en parejas si es posible","Ten un plan de escape hacia el portal sur","El mineral T7 vale la pena el riesgo"],tip:"Muy rentable con build de tanque minero. Asegura la ruta de escape."},
{ name:"Mountain Cross",tier:"T7",resource:"Mineral / Piedra",risk:"alto",time:35,silver:680000,pvp:true,zone:"Martlock",steps:["Obligatorio ir en grupo de 3+ jugadores","Todos con build T6 minimo","Asigna un jugador como vigia de PvP","Los nodos T7 estan en el centro del mapa","Farmea rapidamente y sal antes de 25 min","Nunca te separes del grupo","Vende en Caerleon para maximo profit"],tip:"Solo entra con guild o grupo. El mineral T7 vale mucho pero el riesgo es real."},
{ name:"Caerleon Roads",tier:"T7-T8",resource:"Todos los recursos",risk:"muy alto",time:45,silver:950000,pvp:true,zone:"Caerleon",steps:["Solo jugadores experimentados con T7+","Obligatorio ir en grupo grande (5+)","Equipa tu mejor build de escape","Los Roads estan conectados desde Caerleon","Farmea solo si tienes guild que te proteja","Ten Discord activo para avisar de enemigos","Las ganancias son maximas pero el riesgo tambien"],tip:"Maxima ganancia pero moriras si vas solo. Solo entra con experiencia real."},
];

const BUILDS = [
{ name:"Starter Economico",tier:"T3",cost:30000,silver_h:160000,role:"Principiante",items:["Hacha T3","Armadura tela T3","Botas basicas T3"],zones:["Highland Cross","Deepwood"],desc:"Para empezar desde cero sin riesgo. Gana tu primer millon sin perder nada."},
{ name:"Recolector Silencioso",tier:"T4",cost:80000,silver_h:280000,role:"Recolector",items:["Hacha T4","Armadura cuero T4","Botas ligeras T4","Mochila recolector"],zones:["Forest Cross","Deepwood"],desc:"Ideal para empezar. Bajo costo y riesgo minimo. Perfecto para aprender rutas."},
{ name:"Mago Veloz",tier:"T5",cost:190000,silver_h:380000,role:"Recolector Magico",items:["Baston T5","Tunica mago T5","Sandalias T5","Grimorio menor"],zones:["Swamp Cross","Highland Cross"],desc:"Velocidad de movimiento y habilidades de escape. Buena relacion costo-beneficio."},
{ name:"Cazador de Zonas Rojas",tier:"T5",cost:220000,silver_h:450000,role:"Recolector PvP",items:["Arco T5","Armadura cazador T5","Capa velocidad T5","Pocion de velocidad"],zones:["Steppe Cross","Sunsteppe"],desc:"Maxima velocidad para escapar del PvP y farmear eficientemente en zonas rojas."},
{ name:"Tanque Minero",tier:"T6",cost:480000,silver_h:620000,role:"Minero",items:["Pico T6","Armadura pesada T6","Escudo T6","Casco de minero T6"],zones:["Mountain Cross","Frostpeak"],desc:"Alta supervivencia para zonas peligrosas con mineral de alto valor."},
{ name:"Recolector Premium",tier:"T7",cost:1200000,silver_h:920000,role:"Recolector Elite",items:["Hacha T7","Armadura recolector T7","Botas T7","Mochila premium T7"],zones:["Caerleon Roads","Mountain Cross"],desc:"Maxima ganancia. Solo si ya tienes experiencia y suficiente silver."},
];

const ITEM_WEIGHTS = {};
["FIBER","WOOD","ORE","HIDE","ROCK"].forEach(r => {
for (let t = 2; t <= 8; t++) ITEM_WEIGHTS[`T${t}_${r}`] = 0.1;
});
["PLANKS","LEATHER","CLOTH"].forEach(r => {
for (let t = 2; t <= 8; t++) ITEM_WEIGHTS[`T${t}_${r}`] = 0.3;
});
["METALBAR","STONEBLOCK"].forEach(r => {
for (let t = 2; t <= 8; t++) ITEM_WEIGHTS[`T${t}_${r}`] = 0.5;
});

const MOUNTS = [
{ name:"A pie",capacity:0 },
{ name:"Caballo T3",capacity:187 },
{ name:"Caballo T4",capacity:242 },
{ name:"Caballo T5",capacity:297 },
{ name:"Caballo T6",capacity:352 },
{ name:"Buey T4 (lento)",capacity:660 },
{ name:"Buey T5 (lento)",capacity:880 },
{ name:"Buey T6 (lento)",capacity:1100 },
{ name:"Buey T7 (lento)",capacity:1320 },
];

const BAGS = [
{ name:"Sin bolsa",bonus:0 },
{ name:"Bolsa T3 (19 kg)",bonus:19 },
{ name:"Bolsa T4 (27 kg)",bonus:27 },
{ name:"Bolsa T5 (35 kg)",bonus:35 },
{ name:"Bolsa T6 (43 kg)",bonus:43 },
{ name:"Bolsa T7 (51 kg)",bonus:51 },
{ name:"Mochila Recolector T4 (40 kg)",bonus:40 },
{ name:"Mochila Recolector T5 (50 kg)",bonus:50 },
{ name:"Mochila Recolector T6 (60 kg)",bonus:60 },
];

const riskColor = (r) => ({ bajo:"#4ade80",medio:"#facc15",alto:"#f97316","muy alto":"#ef4444" }[r]||"#fff");
const riskBg = (r) => ({ bajo:"#052e16",medio:"#422006",alto:"#431407","muy alto":"#450a0a" }[r]||"#111");

function Spinner() {
return <div style={{display:"inline-block",width:16,height:16,border:"2px solid #3f3f46",borderTop:"2px solid #f59e0b",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;
}

function ServerSelector({ server, setServer }) {
const [open, setOpen] = useState(false);
const current = SERVERS.find(s => s.id === server) || SERVERS[0];
return (
<div style={{ position:"relative" }}>
<button onClick={() => setOpen(o => !o)} style={{ background:"#18181b",border:`1px solid ${open?"#f59e0b":"#3f3f46"}`,color:"#e4e4e7",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,transition:"all .2s",letterSpacing:1 }}>
<span style={{ fontSize:16 }}>{current.flag}</span>
<span style={{ color:"#f59e0b" }}>{current.label}</span>
<span style={{ color:"#52525b",fontSize:10 }}>▼</span>
</button>
{open && (
<div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,background:"#18181b",border:"1px solid #3f3f46",borderRadius:10,overflow:"hidden",zIndex:100,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.6)" }}>
<div style={{ padding:"8px 12px",fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1,borderBottom:"1px solid #27272a" }}>Servidor de datos</div>
{SERVERS.map(s => (
<button key={s.id} onClick={() => { setServer(s.id); setOpen(false); }} style={{ width:"100%",background:server===s.id?"#f59e0b11":"transparent",border:"none",borderBottom:"1px solid #27272a",color:server===s.id?"#f59e0b":"#d4d4d8",padding:"12px 16px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:10,transition:"background .15s" }}>
<span style={{ fontSize:18 }}>{s.flag}</span>
<div style={{ textAlign:"left" }}>
<div>{s.label}</div>
<div style={{ fontSize:11,color:"#52525b" }}>{s.url.split("//")[1].split(".")[0]}</div>
</div>
{server===s.id && <span style={{ marginLeft:"auto",fontSize:14 }}>✓</span>}
</button>
))}
</div>
)}
</div>
);
}

// ─── BLACK ZONE TAB ───────────────────────────────────────────────────────────
function BlackZoneTab() {
const [activeSection, setActiveSection] = useState("builds");
const [selectedBuild, setSelectedBuild] = useState(null);
const [tipCategory, setTipCategory] = useState("Mentalidad");

const riesgoColor = { bajo:"#4ade80", medio:"#facc15", alto:"#f97316" };
const riesgoBg = { bajo:"#052e16", medio:"#422006", alto:"#431407" };

return (
<div>
  {/* HEADER */}
  <div style={{ marginBottom:20,padding:"20px 20px 16px",background:"linear-gradient(135deg,#0a0a0a 0%,#1a0a00 50%,#0a0505 100%)",border:"1px solid #3a1a00",borderRadius:14,position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 30% 50%, rgba(239,68,68,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(245,158,11,0.04) 0%, transparent 60%)",pointerEvents:"none" }}/>
    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
      <div style={{ fontSize:28 }}>🖤</div>
      <div>
        <div style={{ fontSize:24,fontWeight:700,color:"#ef4444",fontFamily:"Oswald",letterSpacing:2 }}>ZONA NEGRA</div>
        <div style={{ fontSize:12,color:"#52525b",letterSpacing:1 }}>FULL-LOOT PvP · MÁXIMO PROFIT · MÁXIMO RIESGO</div>
      </div>
      <div style={{ marginLeft:"auto",padding:"6px 14px",background:"#450a0a",border:"1px solid #ef444444",borderRadius:20,fontSize:12,fontWeight:700,color:"#ef4444" }}>
        ⚠️ ZONA PELIGROSA
      </div>
    </div>
    <div style={{ fontSize:13,color:"#a1a1aa",lineHeight:1.6,maxWidth:700 }}>
      La zona negra es donde se hace el <strong style={{ color:"#f59e0b" }}>mayor profit</strong> del juego, pero también donde puedes perder todo tu equipo. Recursos T7-T8 valen <strong style={{ color:"#4ade80" }}>2-3x más</strong> que en zonas seguras. Estudia estos builds y consejos antes de entrar.
    </div>
  </div>

  {/* NAV SECONDARY */}
  <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
    {[
      { id:"builds", label:"⚔️ Builds BZ", count: BLACK_ZONE_BUILDS.length },
      { id:"tips", label:"💡 Consejos Profit", count: BLACK_ZONE_TIPS.reduce((a,b)=>a+b.tips.length,0) },
      { id:"comparativa", label:"📊 Comparativa", count: null },
    ].map(s => (
      <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding:"9px 18px",borderRadius:20,border:`1px solid ${activeSection===s.id?"#ef4444":"#27272a"}`,background:activeSection===s.id?"#ef444422":"transparent",color:activeSection===s.id?"#ef4444":"#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all .2s",display:"flex",alignItems:"center",gap:6 }}>
        {s.label}
        {s.count && <span style={{ padding:"2px 7px",background:activeSection===s.id?"#ef444433":"#27272a",borderRadius:10,fontSize:11,fontWeight:700 }}>{s.count}</span>}
      </button>
    ))}
  </div>

  {/* BUILDS SECTION */}
  {activeSection === "builds" && (
    <div>
      <div style={{ fontSize:13,color:"#71717a",marginBottom:16 }}>
        Selecciona un build para ver equipamiento completo, habilidades y consejos específicos.
      </div>
      <div style={{ display:"grid",gap:14 }}>
        {BLACK_ZONE_BUILDS.map((build) => {
          const isSelected = selectedBuild === build.id;
          return (
            <div key={build.id} style={{ background:"#0d0d0d",border:`1px solid ${isSelected ? build.color+"66" : "#1f1f1f"}`,borderLeft:`4px solid ${build.color}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"border-color .2s",boxShadow:isSelected?`0 0 24px ${build.color}18`:"none" }} onClick={() => setSelectedBuild(isSelected ? null : build.id)}>
              
              {/* HEADER CARD */}
              <div style={{ padding:"16px 20px",display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:48,height:48,background:`${build.color}18`,border:`2px solid ${build.color}44`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>
                  {build.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontSize:17,fontWeight:700,color:"#f0f0f0" }}>{build.name}</span>
                    <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",background:`${build.color}22`,border:`1px solid ${build.color}44`,color:build.color,borderRadius:20 }}>{build.tier}</span>
                    <span style={{ fontSize:11,padding:"3px 10px",background:riesgoBg[build.riesgoEquipo]||"#18181b",border:`1px solid ${riesgoColor[build.riesgoEquipo]||"#52525b"}44`,color:riesgoColor[build.riesgoEquipo]||"#71717a",borderRadius:20,fontWeight:700 }}>
                      Riesgo {build.riesgoEquipo}
                    </span>
                  </div>
                  <div style={{ fontSize:13,color:"#71717a" }}>{build.rol}</div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:20,fontWeight:700,color:"#4ade80",fontFamily:"Oswald" }}>{(build.silver_h/1000000).toFixed(1)}M/h</div>
                  <div style={{ fontSize:12,color:"#52525b" }}>Costo: {(build.costo/1000).toFixed(0)}k</div>
                </div>
                <div style={{ color:"#3f3f46",fontSize:16,marginLeft:8 }}>{isSelected?"▲":"▼"}</div>
              </div>

              {/* DESCRIPCION BREVE */}
              <div style={{ padding:"0 20px 14px",fontSize:13,color:"#a1a1aa" }}>{build.descripcion}</div>

              {/* DETALLE EXPANDIDO */}
              {isSelected && (
                <div style={{ borderTop:"1px solid #1f1f1f",padding:"20px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>
                    
                    {/* EQUIPAMIENTO */}
                    <div>
                      <div style={{ fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12,fontWeight:700 }}>⚔️ Equipamiento</div>
                      <div style={{ display:"grid",gap:8 }}>
                        {[
                          { slot:"Arma", val:build.arma },
                          { slot:"Cabeza", val:build.cabeza },
                          { slot:"Pecho", val:build.pecho },
                          { slot:"Botas", val:build.botas },
                          { slot:"Off-hand", val:build.offhand },
                          { slot:"Capa", val:build.capa },
                          { slot:"Montura", val:build.montura },
                          { slot:"Comida", val:build.comida },
                          { slot:"Poción", val:build.pocion },
                        ].map(item => (
                          <div key={item.slot} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"7px 10px",background:"#09090b",borderRadius:8 }}>
                            <span style={{ fontSize:11,color:"#52525b",minWidth:60,flexShrink:0,paddingTop:1 }}>{item.slot}</span>
                            <span style={{ fontSize:13,color:item.val==="—"?"#3f3f46":"#d4d4d8",fontWeight:item.val!=="—"?600:400 }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* HABILIDADES */}
                    <div>
                      <div style={{ fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12,fontWeight:700 }}>🎮 Habilidades Clave</div>
                      <div style={{ display:"grid",gap:8,marginBottom:16 }}>
                        {build.habilidades.map((h,i) => (
                          <div key={i} style={{ padding:"10px 12px",background:"#09090b",borderRadius:8,borderLeft:`3px solid ${build.color}66` }}>
                            <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}>
                              <span style={{ padding:"2px 8px",background:`${build.color}22`,border:`1px solid ${build.color}44`,color:build.color,borderRadius:6,fontSize:11,fontWeight:700,flexShrink:0 }}>{h.slot}</span>
                            </div>
                            <div style={{ fontSize:12,color:"#a1a1aa",lineHeight:1.4 }}>{h.habilidad}</div>
                          </div>
                        ))}
                      </div>

                      {/* PROFIT TIPS */}
                      <div style={{ fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,fontWeight:700 }}>💰 Profit Tips</div>
                      <div style={{ display:"grid",gap:6 }}>
                        {build.profit_tips.map((tip,i) => (
                          <div key={i} style={{ padding:"8px 12px",background:"#09090b",borderRadius:8,borderLeft:"3px solid #f59e0b" }}>
                            <div style={{ fontSize:12,color:"#a1a1aa",lineHeight:1.4 }}>
                              <span style={{ color:"#f59e0b",fontWeight:700,marginRight:6 }}>💰</span>{tip}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CONSEJOS SUPERVIVENCIA */}
                  <div style={{ borderTop:"1px solid #1a1a1a",paddingTop:16 }}>
                    <div style={{ fontSize:11,color:"#52525b",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12,fontWeight:700 }}>🛡️ Consejos de Supervivencia</div>
                    <div style={{ display:"grid",gap:6 }}>
                      {build.consejos.map((c,i) => (
                        <div key={i} style={{ display:"flex",gap:10,padding:"8px 12px",background:"#09090b",borderRadius:8 }}>
                          <span style={{ color:"#ef4444",fontWeight:700,flexShrink:0,fontSize:13 }}>{i+1}.</span>
                          <span style={{ fontSize:13,color:"#a1a1aa",lineHeight:1.5 }}>{c}</span>
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
  )}

  {/* TIPS SECTION */}
  {activeSection === "tips" && (
    <div>
      {/* Category Pills */}
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {BLACK_ZONE_TIPS.map(cat => (
          <button key={cat.categoria} onClick={() => setTipCategory(cat.categoria)} style={{ padding:"8px 16px",borderRadius:20,border:`1px solid ${tipCategory===cat.categoria ? cat.color+"88" : "#27272a"}`,background:tipCategory===cat.categoria ? cat.color+"18" : "transparent",color:tipCategory===cat.categoria ? cat.color : "#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all .2s",display:"flex",alignItems:"center",gap:6 }}>
            <span>{cat.icon}</span> {cat.categoria}
          </button>
        ))}
      </div>

      {BLACK_ZONE_TIPS.filter(c => c.categoria === tipCategory).map(cat => (
        <div key={cat.categoria}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"14px 18px",background:"#0d0d0d",border:`1px solid ${cat.color}33`,borderLeft:`4px solid ${cat.color}`,borderRadius:12 }}>
            <span style={{ fontSize:28 }}>{cat.icon}</span>
            <div>
              <div style={{ fontSize:18,fontWeight:700,color:cat.color,fontFamily:"Oswald" }}>{cat.categoria}</div>
              <div style={{ fontSize:13,color:"#52525b" }}>{cat.tips.length} consejos</div>
            </div>
          </div>
          <div style={{ display:"grid",gap:10 }}>
            {cat.tips.map((tip, i) => (
              <div key={i} style={{ padding:"14px 16px",background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,display:"flex",gap:14,alignItems:"flex-start" }}>
                <div style={{ width:28,height:28,background:`${cat.color}18`,border:`1px solid ${cat.color}44`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:cat.color,flexShrink:0 }}>
                  {i+1}
                </div>
                <div style={{ fontSize:14,color:"#c4c4c4",lineHeight:1.65 }}>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )}

  {/* COMPARATIVA SECTION */}
  {activeSection === "comparativa" && (
    <div>
      <div style={{ fontSize:13,color:"#71717a",marginBottom:16 }}>
        Compara los 4 builds de zona negra por costo, riesgo y ganancia estimada.
      </div>
      {/* Table */}
      <div style={{ background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:14,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead>
            <tr style={{ background:"#111",borderBottom:"1px solid #1f1f1f" }}>
              {["Build","Tier","Costo","Silver/h Est.","Riesgo Equipo","Rol"].map(h => (
                <th key={h} style={{ padding:"12px 16px",textAlign:"left",color:"#52525b",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLACK_ZONE_BUILDS.map((b, i) => (
              <tr key={b.id} style={{ borderBottom:"1px solid #141414",cursor:"pointer",transition:"background .15s" }} onClick={() => { setActiveSection("builds"); setSelectedBuild(b.id); setTimeout(()=>{ const el=document.getElementById(b.id); el&&el.scrollIntoView({behavior:"smooth"}); },100); }}>
                <td style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:18 }}>{b.icon}</span>
                    <span style={{ fontWeight:700,color:"#e4e4e7" }}>{b.name}</span>
                  </div>
                </td>
                <td style={{ padding:"14px 16px" }}><span style={{ padding:"3px 10px",background:`${b.color}18`,border:`1px solid ${b.color}44`,color:b.color,borderRadius:20,fontSize:12,fontWeight:700 }}>{b.tier}</span></td>
                <td style={{ padding:"14px 16px",color:"#f97316",fontWeight:700,fontFamily:"Oswald" }}>{(b.costo/1000).toFixed(0)}k</td>
                <td style={{ padding:"14px 16px",color:"#4ade80",fontWeight:700,fontFamily:"Oswald",fontSize:15 }}>{(b.silver_h/1000000).toFixed(1)}M/h</td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ padding:"3px 10px",background:riesgoBg[b.riesgoEquipo]||"#111",border:`1px solid ${riesgoColor[b.riesgoEquipo]||"#52525b"}44`,color:riesgoColor[b.riesgoEquipo]||"#71717a",borderRadius:20,fontSize:12,fontWeight:700 }}>
                    {b.riesgoEquipo.charAt(0).toUpperCase()+b.riesgoEquipo.slice(1)}
                  </span>
                </td>
                <td style={{ padding:"14px 16px",color:"#71717a",fontSize:12 }}>{b.rol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REGLA DE ORO */}
      <div style={{ marginTop:20,padding:"18px 20px",background:"linear-gradient(135deg,#1a0a00,#0d0d0d)",border:"1px solid #f59e0b44",borderLeft:"4px solid #f59e0b",borderRadius:14 }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#f59e0b",marginBottom:10 }}>⭐ Regla de Oro de la Zona Negra</div>
        <div style={{ display:"grid",gap:8 }}>
          {[
            "Empieza con el Fantasma Recolector (bajo costo, aprende las mecánicas sin arruinarte).",
            "Cuando tengas 3M+ de silver reserve, pasa al build de Dungeons para multiplicar ganancias.",
            "Nunca entres con equipo que no puedas recomprar al menos 3 veces.",
            "El profit real de la zona negra es consistencia, no luck. 10 sesiones seguras > 1 sesión épica.",
          ].map((r,i) => (
            <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
              <span style={{ color:"#f59e0b",fontWeight:700,flexShrink:0 }}>{i+1}.</span>
              <span style={{ fontSize:13,color:"#c4c4c4",lineHeight:1.5 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
);
}

// ─── WEIGHT TAB ───────────────────────────────────────────────────────────────
function WeightTab() {
const [items, setItems] = useState([{ id:"T5_FIBER",qty:1000 }]);
const [mount, setMount] = useState("Caballo T5");
const [bag, setBag] = useState("Bolsa T4 (27 kg)");
const addItem = () => setItems(prev => [...prev, { id:"T4_PLANKS",qty:500 }]);
const removeItem = (i) => setItems(prev => prev.filter((_,idx) => idx!==i));
const updateItem = (i, field, val) => setItems(prev => prev.map((it,idx) => idx===i?{...it,[field]:val}:it));
const mountData = MOUNTS.find(m => m.name===mount)||MOUNTS[4];
const bagData   = BAGS.find(b => b.name===bag)||BAGS[3];
const totalCapacity = mountData.capacity + bagData.bonus;
const itemsWithWeight = items.map(it => {
const w = ITEM_WEIGHTS[it.id]??0.1;
return { ...it, weightPerUnit:w, totalWeight:w*(parseInt(it.qty)||0) };
});
const totalWeight = itemsWithWeight.reduce((s,it) => s+it.totalWeight, 0);
const fits = totalWeight <= totalCapacity;
const tripsNeeded = totalCapacity>0?Math.ceil(totalWeight/totalCapacity):"∞";
const unitsPerTrip = totalCapacity>0?items.map(it => {
const w = ITEM_WEIGHTS[it.id]??0.1;
return { name:TRANSPORT_ITEMS.find(ti=>ti.id===it.id)?.name||it.id, max:Math.floor(totalCapacity/w) };
}):[];
return (
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>CALCULADORA DE PESO Y VIAJES</div>
<div style={{ color:"#52525b",fontSize:14 }}>Sabe exactamente cuánto puedes cargar y cuántos viajes necesitas</div>
</div>
<div className="card" style={{ marginBottom:14 }}>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
<div><div className="label">Tu montura</div><select value={mount} onChange={e=>setMount(e.target.value)}>{MOUNTS.map(m=><option key={m.name}>{m.name}</option>)}</select></div>
<div><div className="label">Tu bolsa / mochila</div><select value={bag} onChange={e=>setBag(e.target.value)}>{BAGS.map(b=><option key={b.name}>{b.name}</option>)}</select></div>
</div>
<div style={{ padding:12,background:"#09090b",borderRadius:8,display:"flex",gap:20,flexWrap:"wrap" }}>
<div><div className="label">Montura</div><div style={{ fontSize:16,fontWeight:700,color:"#60a5fa",fontFamily:"Oswald" }}>{mountData.capacity} kg</div></div>
<div><div className="label">Bolsa extra</div><div style={{ fontSize:16,fontWeight:700,color:"#a78bfa",fontFamily:"Oswald" }}>+{bagData.bonus} kg</div></div>
<div><div className="label" style={{ color:"#f59e0b" }}>Capacidad total</div><div style={{ fontSize:20,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>{totalCapacity} kg</div></div>
</div>
</div>
<div className="card" style={{ marginBottom:14 }}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
<div className="label" style={{ margin:0 }}>Items a transportar</div>
<button className="btn-sm" onClick={addItem}>+ Agregar item</button>
</div>
<div style={{ display:"grid",gap:10 }}>
{itemsWithWeight.map((it,i) => (
<div key={i} style={{ display:"grid",gridTemplateColumns:"2fr 1fr auto auto",gap:10,alignItems:"center" }}>
<select value={it.id} onChange={e=>updateItem(i,"id",e.target.value)}>
{TRANSPORT_ITEMS.map(ti=><option key={ti.id} value={ti.id}>{ti.name}</option>)}
</select>
<input type="number" min="1" value={it.qty} onChange={e=>updateItem(i,"qty",e.target.value)} onClick={e=>e.stopPropagation()} placeholder="cantidad"/>
<div style={{ fontSize:13,color:"#71717a",whiteSpace:"nowrap" }}>{it.totalWeight.toFixed(1)} kg</div>
{items.length>1 && <button onClick={()=>removeItem(i)} style={{ background:"#450a0a",border:"none",color:"#f87171",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:13 }}>✕</button>}
</div>
))}
</div>
</div>
<div className="card glow" style={{ borderColor:fits?"#4ade8066":"#f9730066" }}>
<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14 }}>
{[
{ l:"Peso total carga",v:`${totalWeight.toFixed(1)} kg`,c:"#d4d4d8" },
{ l:"Capacidad",v:`${totalCapacity} kg`,c:"#60a5fa" },
{ l:"¿Cabe en 1 viaje?",v:fits?"✅ Sí":"❌ No",c:fits?"#4ade80":"#ef4444",big:true },
{ l:"Viajes necesarios",v:tripsNeeded,c:tripsNeeded===1?"#4ade80":"#f59e0b",big:true },
].map(item => (
<div key={item.l} style={{ padding:12,background:"#09090b",borderRadius:8 }}>
<div className="label">{item.l}</div>
<div style={{ fontSize:item.big?22:16,fontWeight:700,color:item.c,fontFamily:"Oswald" }}>{item.v}</div>
</div>
))}
</div>
{!fits && (
<div style={{ marginBottom:14 }}>
<div className="label" style={{ marginBottom:8 }}>Máximo por viaje con tu setup</div>
<div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
{unitsPerTrip.map(u => (
<div key={u.name} style={{ padding:"8px 14px",background:"#09090b",border:"1px solid #27272a",borderRadius:8,fontSize:13 }}>
<span style={{ color:"#71717a" }}>{u.name}: </span>
<span style={{ color:"#f59e0b",fontWeight:700 }}>{u.max.toLocaleString()} unidades/viaje</span>
</div>
))}
</div>
</div>
)}
<div style={{ padding:14,background:fits?"#052e16":"#422006",borderRadius:8,fontSize:14,color:fits?"#4ade80":"#fb923c" }}>
{fits ? `Todo cabe en 1 solo viaje. Peso libre restante: ${(totalCapacity-totalWeight).toFixed(1)} kg` : `Necesitas ${tripsNeeded} viajes. Considera un Buey para reducir viajes.`}
</div>
</div>
</div>
);
}

// ─── SESSION TAB ─────────────────────────────────────────────────────────────
function SessionTab() {
const [sessions, setSessions] = useState(() => {
try { return JSON.parse(localStorage.getItem("jarvis_sessions")||"[]"); } catch { return []; }
});
const [form, setForm] = useState({ silverStart:"",silverEnd:"",duration:"",activity:"Farmeo",note:"" });
const [goal, setGoal] = useState(() => localStorage.getItem("jarvis_goal")||"");
const [editingGoal, setEditingGoal] = useState(false);
const ACTIVITIES = ["Farmeo","Transporte","Crafting","Trading","Sniper","Zona Negra","Dungeons BZ","Otro"];
const saveGoal = (v) => { setGoal(v); localStorage.setItem("jarvis_goal",v); };
const addSession = () => {
const start=parseInt(form.silverStart),end=parseInt(form.silverEnd),dur=parseInt(form.duration);
if(isNaN(start)||isNaN(end)||isNaN(dur)||dur<=0) return;
const gained=end-start, perHour=Math.round((gained/dur)*60);
const newSession={ id:Date.now(),silverStart:start,silverEnd:end,duration:dur,gained,perHour,activity:form.activity,note:form.note,date:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) };
const updated=[newSession,...sessions].slice(0,20);
setSessions(updated); localStorage.setItem("jarvis_sessions",JSON.stringify(updated));
setForm({ silverStart:"",silverEnd:"",duration:"",activity:"Farmeo",note:"" });
};
const deleteSession = (id) => { const u=sessions.filter(s=>s.id!==id); setSessions(u); localStorage.setItem("jarvis_sessions",JSON.stringify(u)); };
const totalGained=sessions.reduce((s,se)=>s+se.gained,0);
const totalMinutes=sessions.reduce((s,se)=>s+se.duration,0);
const avgPerHour=totalMinutes>0?Math.round((totalGained/totalMinutes)*60):0;
const bestSession=sessions.length>0?sessions.reduce((a,b)=>a.perHour>b.perHour?a:b):null;
const goalNum=parseInt(goal)||0;
const goalProgress=goalNum>0?Math.min((totalGained/goalNum)*100,100).toFixed(0):0;
const goalLeft=goalNum>0?Math.max(goalNum-totalGained,0):0;
return (
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>TRACKER DE SESIÓN</div>
<div style={{ color:"#52525b",fontSize:14 }}>Registra tus sesiones y ve tu progreso hacia tu meta de silver</div>
</div>
<div className="card" style={{ marginBottom:14,borderColor:"#f59e0b33" }}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:goalNum>0?12:0 }}>
<div className="label" style={{ margin:0 }}>🎯 Meta de silver</div>
<button className="btn-sm" onClick={()=>setEditingGoal(!editingGoal)}>{editingGoal?"Guardar":"Editar"}</button>
</div>
{editingGoal && <input type="number" placeholder="Ej: 1000000" value={goal} onChange={e=>saveGoal(e.target.value)} style={{ marginTop:10 }}/>}
{goalNum>0 && !editingGoal && (
<div style={{ marginTop:10 }}>
<div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6 }}>
<span style={{ color:"#71717a" }}>Progreso: <strong style={{ color:"#f59e0b" }}>{totalGained.toLocaleString()}</strong> / {goalNum.toLocaleString()}</span>
<span style={{ color:"#4ade80",fontWeight:700 }}>{goalProgress}%</span>
</div>
<div style={{ height:8,background:"#27272a",borderRadius:4,overflow:"hidden" }}>
<div style={{ height:"100%",width:`${goalProgress}%`,background:"linear-gradient(90deg,#d97706,#4ade80)",borderRadius:4,transition:"width .4s" }}/>
</div>
{goalLeft>0?<div style={{ fontSize:12,color:"#71717a",marginTop:6 }}>Faltan {goalLeft.toLocaleString()} silver</div>:<div style={{ fontSize:13,color:"#4ade80",marginTop:6,fontWeight:700 }}>🎉 ¡Meta alcanzada!</div>}
</div>
)}
</div>
{sessions.length>0 && (
<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14 }}>
{[
{ l:"Silver total",v:totalGained.toLocaleString(),c:totalGained>=0?"#4ade80":"#ef4444" },
{ l:"Tiempo total",v:`${totalMinutes} min`,c:"#60a5fa" },
{ l:"Promedio/hora",v:avgPerHour.toLocaleString(),c:"#f59e0b" },
{ l:"Sesiones",v:sessions.length,c:"#a78bfa" },
].map(item=>(
<div key={item.l} style={{ padding:12,background:"#18181b",border:"1px solid #27272a",borderRadius:8 }}>
<div className="label">{item.l}</div>
<div style={{ fontSize:18,fontWeight:700,color:item.c,fontFamily:"Oswald" }}>{item.v}</div>
</div>
))}
</div>
)}
<div className="card" style={{ marginBottom:14 }}>
<div className="label" style={{ marginBottom:12 }}>+ Registrar sesión</div>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
<div><div className="label">Silver al INICIO</div><input type="number" placeholder="500000" value={form.silverStart} onChange={e=>setForm(f=>({...f,silverStart:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
<div><div className="label">Silver al FINAL</div><input type="number" placeholder="750000" value={form.silverEnd} onChange={e=>setForm(f=>({...f,silverEnd:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
<div><div className="label">Duración (minutos)</div><input type="number" placeholder="45" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
<div><div className="label">Actividad</div><select value={form.activity} onChange={e=>setForm(f=>({...f,activity:e.target.value}))}>{ACTIVITIES.map(a=><option key={a}>{a}</option>)}</select></div>
<div style={{ gridColumn:"1 / -1" }}><div className="label">Nota (opcional)</div><input type="text" placeholder="Ej: Fibra T5 en Lymhurst" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} onClick={e=>e.stopPropagation()}/></div>
</div>
<button className="btn" onClick={addSession} style={{ width:"100%" }}>GUARDAR SESIÓN</button>
</div>
{sessions.length>0?(
<div className="card">
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
<div className="label" style={{ margin:0 }}>Historial ({sessions.length} sesiones)</div>
{bestSession&&<div style={{ fontSize:12,color:"#71717a" }}>Mejor: <span style={{ color:"#f59e0b" }}>{bestSession.perHour.toLocaleString()}/h</span></div>}
</div>
<div style={{ display:"grid",gap:8 }}>
{sessions.map(s=>{
const isPos=s.gained>=0, isBest=bestSession?.id===s.id;
return (
<div key={s.id} style={{ padding:"12px 14px",background:"#09090b",borderRadius:8,border:`1px solid ${isBest?"#f59e0b44":"#27272a"}`,borderLeft:`3px solid ${isPos?"#4ade80":"#ef4444"}` }}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
<div style={{ flex:1 }}>
<div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}>
<span style={{ fontWeight:700,fontSize:14 }}>{s.activity}</span>
{isBest&&<span style={{ fontSize:11,background:"#422006",color:"#f59e0b",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>MEJOR</span>}
<span style={{ fontSize:11,color:"#52525b" }}>{s.date}</span>
</div>
{s.note&&<div style={{ fontSize:12,color:"#71717a" }}>{s.note}</div>}
<div style={{ fontSize:12,color:"#52525b",marginTop:4 }}>{s.duration} min · {s.perHour.toLocaleString()}/h</div>
</div>
<div style={{ display:"flex",gap:10,alignItems:"center" }}>
<div style={{ textAlign:"right" }}>
<div style={{ fontSize:18,fontWeight:700,color:isPos?"#4ade80":"#ef4444",fontFamily:"Oswald" }}>{isPos?"+":""}{s.gained.toLocaleString()}</div>
</div>
<button onClick={()=>deleteSession(s.id)} style={{ background:"transparent",border:"1px solid #3f3f46",color:"#71717a",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12 }}>✕</button>
</div>
</div>
</div>
);
})}
</div>
</div>
):(
<div style={{ padding:"40px 0",textAlign:"center",color:"#71717a",fontSize:14 }}>Sin sesiones aún. Registra tu primera sesión ↑</div>
)}
</div>
);
}

// ─── AUTO SCANNER ─────────────────────────────────────────────────────────────
function AutoScannerTab({ apiBase }) {
const [loading, setLoading] = useState(false);
const [results, setResults] = useState([]);
const [minProfit, setMinProfit] = useState(5000);
const [minRoi, setMinRoi] = useState(3);
const [qty, setQty] = useState(500);
const [catFilter, setCatFilter] = useState("todos");
const [scanned, setScanned] = useState(false);
const [progress, setProgress] = useState(0);
const SCAN_ITEMS = TRANSPORT_ITEMS;
const runScan = async () => {
setLoading(true); setResults([]); setScanned(false); setProgress(0);
try {
const BATCH=10; const allOpps=[];
for (let i=0;i<SCAN_ITEMS.length;i+=BATCH) {
const batch=SCAN_ITEMS.slice(i,i+BATCH);
const ids=batch.map(it=>it.id).join(",");
setProgress(Math.round(((i+BATCH)/SCAN_ITEMS.length)*100));
try {
const res=await fetch(`${apiBase}/${ids}?locations=${CITIES.join(",")}&qualities=1`);
const data=await res.json();
const grouped={};
data.forEach(e=>{ if(!grouped[e.item_id]) grouped[e.item_id]=[]; grouped[e.item_id].push(e); });
Object.entries(grouped).forEach(([itemId,entries])=>{
const withSell=entries.filter(e=>e.sell_price_min>0);
const withBuy=entries.filter(e=>e.buy_price_max>0);
if(!withSell.length||!withBuy.length) return;
withSell.forEach(buyEntry=>{
withBuy.forEach(sellEntry=>{
if(buyEntry.city===sellEntry.city) return;
const buyPrice=buyEntry.sell_price_min, sellPrice=sellEntry.buy_price_max;
if(buyPrice<=0||sellPrice<=0) return;
const investment=buyPrice*qty, revenue=sellPrice*qty;
const tax=revenue*0.03, net=revenue-tax-investment;
const roi=((net/investment)*100).toFixed(1);
if(net>=minProfit&&parseFloat(roi)>=minRoi) {
const meta=SCAN_ITEMS.find(it=>it.id===itemId);
allOpps.push({ id:itemId,name:meta?.name||itemId,cityBuy:buyEntry.city,citySell:sellEntry.city,buyPrice,sellPrice,investment:Math.round(investment),net:Math.round(net),roi:parseFloat(roi),netPerUnit:sellPrice-buyPrice });
}
});
});
});
} catch(e) {}
}
const deduped={};
allOpps.forEach(op=>{ const key=`${op.id}-${op.cityBuy}-${op.citySell}`; if(!deduped[key]||op.net>deduped[key].net) deduped[key]=op; });
setResults(Object.values(deduped).sort((a,b)=>b.net-a.net).slice(0,25));
setScanned(true);
} catch(e) { console.error(e); }
setProgress(100); setLoading(false);
};
const isProc = (id) => ["METALBAR","PLANKS","LEATHER","CLOTH","STONEBLOCK"].some(p=>id.includes(p));
const filtered = results.filter(r => catFilter==="todos"?true:catFilter==="procesado"?isProc(r.id):!isProc(r.id));
return (
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>AUTO-ESCÁNER DE TRANSPORTE</div>
<div style={{ color:"#52525b",fontSize:14 }}>Escanea todos los items y encuentra las mejores rutas ahora mismo</div>
</div>
<div className="card" style={{ marginBottom:14 }}>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14 }}>
<div><div className="label">Cantidad</div><input type="number" min="1" value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} onClick={e=>e.stopPropagation()}/></div>
<div><div className="label">Profit mínimo</div><input type="number" min="0" value={minProfit} onChange={e=>setMinProfit(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
<div><div className="label">ROI mínimo (%)</div><input type="number" min="0" value={minRoi} onChange={e=>setMinRoi(parseInt(e.target.value)||0)} onClick={e=>e.stopPropagation()}/></div>
</div>
<button className="btn" onClick={runScan} disabled={loading} style={{ width:"100%" }}>
{loading?<><Spinner/>&nbsp;&nbsp;Escaneando {SCAN_ITEMS.length} items…</>:`🔍 ESCANEAR (${SCAN_ITEMS.length} items × 6 ciudades)`}
</button>
{loading&&(
<div style={{ marginTop:12 }}>
<div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#71717a",marginBottom:4 }}><span>Analizando mercados…</span><span>{progress}%</span></div>
<div style={{ height:6,background:"#27272a",borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#d97706,#f59e0b)",borderRadius:4,transition:"width .3s" }}/></div>
</div>
)}
</div>
{scanned&&results.length>0&&(
<div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap" }}>
{["todos","raw","procesado"].map(cat=>(
<button key={cat} onClick={()=>setCatFilter(cat)} style={{ padding:"7px 14px",borderRadius:20,border:`1px solid ${catFilter===cat?"#f59e0b":"#27272a"}`,background:catFilter===cat?"#f59e0b22":"transparent",color:catFilter===cat?"#f59e0b":"#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,textTransform:"capitalize",transition:"all .2s" }}>
{cat==="todos"?`Todos (${results.length})`:cat==="raw"?`Raw (${results.filter(r=>!isProc(r.id)).length})`:`Proc (${results.filter(r=>isProc(r.id)).length})`}
</button>
))}
<div style={{ marginLeft:"auto",fontSize:13,color:"#52525b",display:"flex",alignItems:"center" }}>{filtered.length} rutas</div>
</div>
)}
{scanned&&filtered.length===0&&<div style={{ padding:"40px 0",textAlign:"center",color:"#71717a",fontSize:14 }}>Sin rutas que superen los filtros. Baja profit/ROI mínimo.</div>}
{filtered.length>0&&(
<div style={{ display:"grid",gap:10 }}>
{filtered.map((op,i)=>{
const tier=op.roi>=20?"hot":op.roi>=10?"ok":"bajo";
const tc={ hot:"#4ade80",ok:"#f59e0b",bajo:"#71717a" }[tier];
const tbg={ hot:"#052e16",ok:"#422006",bajo:"#18181b" }[tier];
return (
<div key={i} className="card" style={{ borderLeft:`3px solid ${tc}` }}>
<div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
<div style={{ width:26,height:26,background:"#09090b",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#71717a",flexShrink:0 }}>#{i+1}</div>
<div style={{ flex:1,minWidth:140 }}>
<div style={{ fontWeight:700,fontSize:15,marginBottom:2 }}>{op.name}</div>
<div style={{ fontSize:12,color:"#71717a" }}><span style={{ color:"#60a5fa" }}>{op.cityBuy}</span> ({op.buyPrice.toLocaleString()}) → <span style={{ color:"#f59e0b" }}>{op.citySell}</span> ({op.sellPrice.toLocaleString()})</div>
<div style={{ fontSize:12,color:"#52525b",marginTop:2 }}>Inversión: {op.investment.toLocaleString()} · +{op.netPerUnit.toLocaleString()}/ud</div>
</div>
<div style={{ textAlign:"right",flexShrink:0 }}>
<div style={{ fontSize:20,fontWeight:700,color:tc,fontFamily:"Oswald" }}>+{op.net.toLocaleString()}</div>
<div style={{ fontSize:12,color:"#71717a" }}>ROI: {op.roi}%</div>
</div>
<div style={{ padding:"5px 12px",background:tbg,borderRadius:20,fontSize:12,fontWeight:700,color:tc,flexShrink:0 }}>{tier.toUpperCase()}</div>
</div>
</div>
);
})}
</div>
)}
{!scanned&&!loading&&(
<div style={{ padding:"50px 20px",textAlign:"center",color:"#52525b" }}>
<div style={{ fontSize:40,marginBottom:12 }}>🔍</div>
<div style={{ fontSize:16,fontWeight:700,color:"#71717a",marginBottom:6 }}>Listo para escanear</div>
<div style={{ fontSize:13 }}>Presiona el botón para analizar todas las rutas en tiempo real</div>
</div>
)}
</div>
);
}

// ─── TRANSPORT TAB ────────────────────────────────────────────────────────────
function TransportTab({ apiBase }) {
const [itemId, setItemId] = useState("T5_FIBER");
const [qty, setQty] = useState(1000);
const [fromCity, setFromCity] = useState("Lymhurst");
const [loading, setLoading] = useState(false);
const [results, setResults] = useState(null);
const [error, setError] = useState(null);
const analyze = async () => {
setLoading(true); setError(null); setResults(null);
try {
const res=await fetch(`${apiBase}/${itemId}?locations=${CITIES.join(",")}&qualities=1`);
const data=await res.json();
const byCity={};
CITIES.forEach(c=>{ byCity[c]={ buy:null,sell:null }; });
data.forEach(p=>{ if(!byCity[p.city]) return; if(p.sell_price_min>0) byCity[p.city].buy=p.sell_price_min; if(p.buy_price_max>0) byCity[p.city].sell=p.buy_price_max; });
const originBuy=byCity[fromCity]?.buy;
if(!originBuy){ setError("No hay precio de compra en la ciudad origen."); setLoading(false); return; }
const investmentTotal=originBuy*qty;
const options=CITIES.filter(c=>c!==fromCity).map(destCity=>{
const sellPrice=byCity[destCity]?.sell; if(!sellPrice) return null;
const revenue=sellPrice*qty, tax=revenue*0.03, net=revenue-tax-investmentTotal;
const roi=((net/investmentTotal)*100).toFixed(1);
return { city:destCity,sellPrice,revenue:Math.round(revenue),tax:Math.round(tax),net:Math.round(net),roi:parseFloat(roi),silverPerItem:sellPrice-originBuy };
}).filter(Boolean).sort((a,b)=>b.net-a.net);
const itemMeta=TRANSPORT_ITEMS.find(i=>i.id===itemId);
setResults({ options,originBuy,investmentTotal:Math.round(investmentTotal),itemName:itemMeta?.name||itemId,qty,fromCity });
} catch(e) { setError("Error al conectar con la API."); }
setLoading(false);
};
const best=results?.options?.[0];
return (
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>CALCULADORA DE TRANSPORTE</div>
<div style={{ color:"#52525b",fontSize:14 }}>Descubre a qué ciudad transportar para máximo profit</div>
</div>
<div className="card" style={{ marginBottom:16 }}>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
<div style={{ gridColumn:"1 / -1" }}><div className="label">Item a transportar</div><select value={itemId} onChange={e=>setItemId(e.target.value)}>{TRANSPORT_ITEMS.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
<div><div className="label">Cantidad</div><input type="number" min="1" value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} onClick={e=>e.stopPropagation()} placeholder="1000"/></div>
<div><div className="label">Ciudad origen</div><select value={fromCity} onChange={e=>setFromCity(e.target.value)}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
</div>
<button className="btn" onClick={analyze} disabled={loading} style={{ width:"100%" }}>
{loading?<><Spinner/>&nbsp;&nbsp;Analizando precios…</>:"🚚 ANALIZAR RUTA"}
</button>
</div>
{error&&<div style={{ padding:14,background:"#450a0a",borderRadius:8,color:"#f87171",fontSize:14,marginBottom:16 }}>⚠️ {error}</div>}
{results&&(
<div>
<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:16 }}>
{[
{ l:"Item",v:results.itemName,c:"#d4d4d8" },
{ l:"Cantidad",v:results.qty.toLocaleString(),c:"#60a5fa" },
{ l:"Precio compra",v:results.originBuy.toLocaleString(),c:"#f97316" },
{ l:"Inversión total",v:results.investmentTotal.toLocaleString(),c:"#facc15" },
].map(item=>(
<div key={item.l} style={{ padding:12,background:"#18181b",border:"1px solid #27272a",borderRadius:8 }}>
<div className="label">{item.l}</div>
<div style={{ fontSize:16,fontWeight:700,color:item.c,fontFamily:"Oswald" }}>{item.v}</div>
</div>
))}
</div>
{best&&best.net>0&&(
<div className="card glow" style={{ borderColor:"#4ade8066",marginBottom:16,background:"#052e16" }}>
<div style={{ fontSize:12,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>✅ Mejor opción</div>
<div style={{ fontSize:18,fontWeight:700,color:"#f0fdf4",marginBottom:10 }}>
{results.qty.toLocaleString()}x {results.itemName} · <span style={{ color:"#f59e0b" }}>{results.fromCity}</span> → <span style={{ color:"#4ade80" }}>{best.city}</span>
</div>
<div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
{[{ l:"Ganancia neta",v:`+${best.net.toLocaleString()}`,c:"#4ade80" },{ l:"ROI",v:`${best.roi}%`,c:"#4ade80" },{ l:"Profit/unidad",v:`+${best.silverPerItem.toLocaleString()}`,c:"#facc15" }].map(item=>(
<div key={item.l} style={{ padding:12,background:"#09090b",borderRadius:8,textAlign:"center" }}>
<div className="label">{item.l}</div>
<div style={{ fontSize:22,fontWeight:700,color:item.c,fontFamily:"Oswald" }}>{item.v}</div>
</div>
))}
</div>
</div>
)}
{best&&best.net<=0&&<div style={{ padding:14,background:"#450a0a",borderRadius:8,color:"#f87171",fontSize:14,marginBottom:16 }}>❌ No hay rutas rentables ahora. Prueba otra ciudad origen.</div>}
<div className="card">
<div className="label" style={{ marginBottom:12 }}>Comparativa por ciudad destino</div>
<div style={{ display:"grid",gap:8 }}>
{results.options.map((opt,i)=>{
const isPositive=opt.net>0, isBest=i===0&&isPositive;
return (
<div key={opt.city} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isBest?"#052e16":"#09090b",border:`1px solid ${isBest?"#4ade8044":"#27272a"}`,borderRadius:8,borderLeft:`3px solid ${isBest?"#4ade80":isPositive?"#f59e0b":"#3f3f46"}` }}>
<div style={{ width:24,height:24,background:"#18181b",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#71717a",flexShrink:0 }}>#{i+1}</div>
<div style={{ flex:1 }}>
<div style={{ fontWeight:700,fontSize:15,color:isBest?"#4ade80":"#d4d4d8" }}>{opt.city}{isBest?" ⭐":""}</div>
<div style={{ fontSize:12,color:"#71717a",marginTop:2 }}>Venta: {opt.sellPrice.toLocaleString()} · Tax: {opt.tax.toLocaleString()}</div>
</div>
<div style={{ textAlign:"right",flexShrink:0 }}>
<div style={{ fontSize:18,fontWeight:700,color:isPositive?"#4ade80":"#ef4444",fontFamily:"Oswald" }}>{isPositive?"+":""}{opt.net.toLocaleString()}</div>
<div style={{ fontSize:12,color:"#71717a" }}>ROI: {opt.roi}%</div>
</div>
<div style={{ padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:700,flexShrink:0,background:isBest?"#4ade8022":isPositive?"#f59e0b22":"#27272a",color:isBest?"#4ade80":isPositive?"#f59e0b":"#52525b" }}>
{isBest?"MEJOR":isPositive?"OK":"PÉRDIDA"}
</div>
</div>
);
})}
</div>
</div>
</div>
)}
</div>
);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AlbionApp() {
const [server, setServer] = useState("west");
const apiBase = SERVERS.find(s => s.id === server)?.url || SERVERS[0].url;

const [tab, setTab] = useState("dashboard");
const [profit, setProfit] = useState({ buy:"",sell:"",tax:"3",qty:"1",result:null });
const [decision, setDecision] = useState({ silver:"",time:"",city:"Caerleon",build:"Recolector Silencioso",result:null });
const [selectedBuild, setSelectedBuild] = useState(null);
const [zoneFilter, setZoneFilter] = useState("todos");
const [selectedZone, setSelectedZone] = useState(null);
const [dashPrices, setDashPrices] = useState([]);
const [loadingDash, setLoadingDash] = useState(false);
const [opportunities, setOpportunities] = useState([]);
const [loadingSniper, setLoadingSniper] = useState(false);
const [lastUpdate, setLastUpdate] = useState(null);
const [sniperCat, setSniperCat] = useState(null);
const [craftCat, setCraftCat] = useState("recurso");
const [selectedRecipe, setSelectedRecipe] = useState(null);
const [craftPrices, setCraftPrices] = useState({});
const [craftQty, setCraftQty] = useState(1);
const [loadingCraft, setLoadingCraft] = useState(false);

const fetchDashPrices = useCallback(async () => {
setLoadingDash(true);
try {
const items="T5_PLANKS,T5_HIDE,T5_ORE,T5_FIBER,T5_WOOD,T6_PLANKS,T6_HIDE,T6_ORE,T6_FIBER,T6_WOOD";
const res=await fetch(`${apiBase}/${items}?locations=Caerleon,Bridgewatch,Lymhurst,Fort Sterling&qualities=1`);
const data=await res.json();
setDashPrices(data.filter(p=>p.sell_price_min>0||p.buy_price_max>0).slice(0,16));
setLastUpdate(new Date().toLocaleTimeString());
} catch { setDashPrices([]); }
setLoadingDash(false);
}, [apiBase]);

const fetchSniperData = useCallback(async () => {
setLoadingSniper(true);
try {
const ids=SNIPER_ITEMS.map(i=>i.id).join(",");
const res=await fetch(`${apiBase}/${ids}?locations=${CITIES.join(",")}&qualities=1`);
const data=await res.json();
const grouped={};
data.forEach(e=>{ if(!grouped[e.item_id]) grouped[e.item_id]=[]; grouped[e.item_id].push(e); });
const opps=[];
Object.entries(grouped).forEach(([itemId,entries])=>{
const withBuy=entries.filter(e=>e.sell_price_min>0);
const withSell=entries.filter(e=>e.buy_price_max>0);
if(withBuy.length<2||withSell.length<2) return;
const cheapest=withBuy.reduce((a,b)=>a.sell_price_min<b.sell_price_min?a:b);
const mostExp=withSell.reduce((a,b)=>a.buy_price_max>b.buy_price_max?a:b);
if(cheapest.city===mostExp.city) return;
const p=mostExp.buy_price_max-cheapest.sell_price_min;
const roi=((p/cheapest.sell_price_min)*100).toFixed(0);
if(p>500&&roi>5){
const meta=SNIPER_ITEMS.find(i=>i.id===itemId);
opps.push({ name:meta?.name||itemId.replace(/_/g," "),cat:meta?.cat,city_buy:cheapest.city,city_sell:mostExp.city,buy:cheapest.sell_price_min,sell:mostExp.buy_price_max,profit:p,roi:parseInt(roi) });
}
});
opps.sort((a,b)=>b.profit-a.profit);
setOpportunities(opps.slice(0,30));
setLastUpdate(new Date().toLocaleTimeString());
} catch(e){ console.error(e); }
setLoadingSniper(false);
}, [apiBase]);

const fetchCraftPrices = useCallback(async (recipe) => {
if(!recipe) return;
setLoadingCraft(true);
try {
const allIds=[...recipe.mat.map(m=>m.id),recipe.id].join(",");
const res=await fetch(`${apiBase}/${allIds}?locations=Caerleon,Bridgewatch,Lymhurst,Fort Sterling&qualities=1`);
const data=await res.json();
const prices={};
data.forEach(p=>{ if(!prices[p.item_id]) prices[p.item_id]={}; if(p.sell_price_min>0) prices[p.item_id].buy=Math.min(prices[p.item_id].buy||Infinity,p.sell_price_min); if(p.buy_price_max>0) prices[p.item_id].sell=Math.max(prices[p.item_id].sell||0,p.buy_price_max); });
setCraftPrices(prices);
} catch(e){ console.error(e); }
setLoadingCraft(false);
}, [apiBase]);

useEffect(()=>{ fetchDashPrices(); },[fetchDashPrices]);
useEffect(()=>{ if(tab==="sniper") fetchSniperData(); },[tab,fetchSniperData]);
useEffect(()=>{ if(selectedRecipe) fetchCraftPrices(selectedRecipe); },[selectedRecipe,fetchCraftPrices]);
useEffect(()=>{ fetchDashPrices(); },[server]);
useEffect(()=>{ if(tab==="sniper"){ setOpportunities([]); fetchSniperData(); } },[server]);

const calcProfit = () => {
const buy=parseFloat(profit.buy),sell=parseFloat(profit.sell),tax=parseFloat(profit.tax)/100,qty=parseInt(profit.qty);
if(isNaN(buy)||isNaN(sell)||isNaN(qty)) return;
const gross=(sell-buy)*qty,taxAmt=sell*tax*qty,net=gross-taxAmt;
setProfit(p=>({...p,result:{ net:Math.round(net),roi:((net/(buy*qty))*100).toFixed(1),tax:Math.round(taxAmt),gross:Math.round(gross) }}));
};

const calcDecision = () => {
const silver=parseInt(decision.silver),time=parseInt(decision.time);
if(isNaN(silver)||isNaN(time)) return;
const build=BUILDS.find(b=>b.name===decision.build)||BUILDS[0];
const zone=FARM_ZONES.find(z=>build.zones.includes(z.name))||FARM_ZONES[0];
const canAfford=silver>=build.cost;
const gain=Math.round((zone.silver/60)*time);
const action=canAfford?`Farmea en ${zone.name} con tu ${build.name} durante ${time} min`:`Ahorra ${(build.cost-silver).toLocaleString()} silver mas antes de comprar equipo`;
setDecision(d=>({...d,result:{ action,gain,zone:zone.name,risk:zone.risk,canAfford,tip:zone.tip }}));
};

const craftResult = () => {
if(!selectedRecipe) return null;
const qty=parseInt(craftQty)||1;
let matCost=0;
for(const mat of selectedRecipe.mat){ const p=craftPrices[mat.id]?.buy; if(!p) return null; matCost+=p*mat.qty*qty; }
const fee=selectedRecipe.fee*qty, totalCost=matCost+fee;
const sellPrice=craftPrices[selectedRecipe.id]?.sell; if(!sellPrice) return null;
const revenue=sellPrice*selectedRecipe.out*qty, tax=revenue*0.03, net=revenue-tax-totalCost;
const roi=((net/totalCost)*100).toFixed(1);
return { matCost,fee,totalCost,revenue,tax:Math.round(tax),net:Math.round(net),roi };
};

const filteredZones=zoneFilter==="todos"?FARM_ZONES:FARM_ZONES.filter(z=>z.risk===zoneFilter);
const craftResult_=craftResult();
const currentServer=SERVERS.find(s=>s.id===server)||SERVERS[0];

const tabs=[
{id:"dashboard",label:"⚡ Dashboard"},{id:"profit",label:"💰 Profit"},
{id:"decision",label:"🧠 Decision"},{id:"sniper",label:"🎯 Sniper"},
{id:"craft",label:"🔨 Crafting"},{id:"scanner",label:"🔍 Escáner"},
{id:"transport",label:"🚚 Transporte"},{id:"weight",label:"⚖️ Peso"},
{id:"session",label:"📊 Sesión"},{id:"routes",label:"🗺 Rutas"},
{id:"builds",label:"⚔️ Builds"},{id:"blackzone",label:"🖤 Zona Negra"},
];

return (
<div style={{ minHeight:"100vh",background:"#09090b",color:"#e4e4e7",fontFamily:"'Rajdhani','Oswald',sans-serif" }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Oswald:wght@400;500;600&display=swap'); @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-track{background:#18181b} ::-webkit-scrollbar-thumb{background:#f59e0b;border-radius:2px} input{background:#18181b!important;border:1px solid #3f3f46!important;color:#e4e4e7!important;padding:10px 14px;border-radius:6px;font-family:inherit;font-size:15px;width:100%;outline:none;transition:border-color .2s} input:focus{border-color:#f59e0b!important} select{background:#18181b;border:1px solid #3f3f46;color:#e4e4e7;padding:10px 14px;border-radius:6px;font-family:inherit;font-size:15px;width:100%;outline:none;cursor:pointer} .btn{background:linear-gradient(135deg,#d97706,#f59e0b);color:#000;border:none;padding:11px 22px;border-radius:6px;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:1px;transition:opacity .2s,transform .1s} .btn:hover{opacity:.9;transform:translateY(-1px)} .btn-sm{background:transparent;border:1px solid #3f3f46;color:#a1a1aa;padding:7px 14px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s} .btn-sm:hover{border-color:#f59e0b;color:#f59e0b} .card{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px} .label{font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:600} .glow{box-shadow:0 0 20px rgba(245,158,11,.15)} .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700} .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:pulse 2s infinite;margin-right:6px} .step{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #27272a} .step:last-child{border-bottom:none} .step-num{width:22px;height:22px;border-radius:50%;background:#f59e0b22;border:1px solid #f59e0b44;color:#f59e0b;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}`}</style>

{/* HEADER */}
<div style={{ background:"linear-gradient(180deg,#111 0%,#09090b 100%)",borderBottom:"1px solid #27272a",padding:"0 20px" }}>
<div style={{ maxWidth:960,margin:"0 auto" }}>
<div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 0 0" }}>
<div style={{ width:38,height:38,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>⚔️</div>
<div>
<div style={{ fontSize:20,fontWeight:700,letterSpacing:2,color:"#f59e0b",fontFamily:"Oswald" }}>ALBION JARVIS</div>
<div style={{ fontSize:11,color:"#52525b",letterSpacing:1 }}>ECONOMIC INTELLIGENCE v4.1 · {SNIPER_ITEMS.length} items</div>
</div>
<div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:14 }}>
<ServerSelector server={server} setServer={setServer} />
<div style={{ textAlign:"right" }}>
<div style={{ fontSize:12,color:"#4ade80" }}><span className="dot"/>API EN VIVO</div>
{lastUpdate&&<div style={{ fontSize:11,color:"#52525b" }}>Act: {lastUpdate}</div>}
</div>
</div>
</div>
<div style={{ padding:"6px 0 0",display:"flex",alignItems:"center",gap:6 }}>
<div style={{ fontSize:11,color:"#52525b" }}>Servidor activo:</div>
<div style={{ fontSize:11,fontWeight:700,color:"#f59e0b" }}>{currentServer.flag} {currentServer.label} — {currentServer.url.split("//")[1].split("/")[0]}</div>
</div>
<div style={{ display:"flex",gap:2,marginTop:10,overflowX:"auto" }}>
{tabs.map(t=>(
<button key={t.id} onClick={()=>setTab(t.id)} style={{ background:t.id==="blackzone"?(tab===t.id?"#ef4444":"transparent"):(tab===t.id?"#f59e0b":"transparent"),color:t.id==="blackzone"?(tab===t.id?"#fff":"#ef444488"):(tab===t.id?"#000":"#71717a"),border:"none",padding:"10px 14px",borderRadius:"8px 8px 0 0",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s" }}>{t.label}</button>
))}
</div>
</div>
</div>

{/* CONTENT */}
<div style={{ maxWidth:960,margin:"0 auto",padding:"24px 20px" }}>

{/* DASHBOARD */}
{tab==="dashboard"&&(
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>RESUMEN DEL DIA</div>
<div style={{ color:"#52525b",fontSize:14 }}>Precios en tiempo real · {currentServer.flag} Servidor {currentServer.label}</div>
</div>
<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20 }}>
{[
{ label:"Mejor Ruta Hoy",value:"Forest Cross",sub:"T6 Madera 410k/h",icon:"🗺",color:"#4ade80" },
{ label:"Revisa Sniper",value:"Oportunidades",sub:"Datos en tiempo real",icon:"🎯",color:"#f59e0b" },
{ label:"Zona Negra",value:"Fantasma T6",sub:"1.4M/h estimado",icon:"🖤",color:"#ef4444",onClick:()=>setTab("blackzone") },
{ label:"Build Optima Hoy",value:"Cazador T5",sub:"450k silver/h",icon:"⚔️",color:"#a78bfa" },
].map(s=>(
<div key={s.label} className="card" style={{ borderLeft:`3px solid ${s.color}`,cursor:s.onClick?"pointer":"default" }} onClick={s.onClick}>
<div style={{ fontSize:22,marginBottom:8 }}>{s.icon}</div>
<div className="label">{s.label}</div>
<div style={{ fontSize:17,fontWeight:700,color:s.color }}>{s.value}</div>
<div style={{ fontSize:12,color:"#71717a",marginTop:4 }}>{s.sub}</div>
</div>
))}
</div>
<div className="card" style={{ borderColor:"#f59e0b33" }}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
<div className="label" style={{ margin:0 }}>Precios en tiempo real ({dashPrices.length} registros) — {currentServer.flag} {currentServer.label}</div>
<button className="btn-sm" onClick={fetchDashPrices} disabled={loadingDash}>{loadingDash?<Spinner/>:"Actualizar"}</button>
</div>
{loadingDash?(
<div style={{ display:"flex",alignItems:"center",gap:10,color:"#71717a",fontSize:14,padding:"20px 0" }}><Spinner/> Cargando...</div>
):dashPrices.length>0?(
<div style={{ overflowX:"auto" }}>
<table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
<thead><tr style={{ color:"#52525b" }}>{["Item","Ciudad","Compra","Venta"].map(h=><th key={h} style={{ padding:"6px 12px",textAlign:"left",borderBottom:"1px solid #27272a",fontWeight:600 }}>{h}</th>)}</tr></thead>
<tbody>{dashPrices.map((p,i)=>(
<tr key={i} style={{ borderBottom:"1px solid #18181b" }}>
<td style={{ padding:"9px 12px",color:"#d4d4d8",fontWeight:600 }}>{p.item_id?.replace(/_/g," ")}</td>
<td style={{ padding:"9px 12px",color:"#f59e0b" }}>{p.city}</td>
<td style={{ padding:"9px 12px",color:"#4ade80" }}>{p.buy_price_max>0?p.buy_price_max.toLocaleString():"—"}</td>
<td style={{ padding:"9px 12px",color:"#60a5fa" }}>{p.sell_price_min>0?p.sell_price_min.toLocaleString():"—"}</td>
</tr>
))}</tbody>
</table>
</div>
):(
<div style={{ color:"#71717a",fontSize:13,padding:"16px 0" }}>No se pudo conectar a la API.</div>
)}
</div>
</div>
)}

{/* PROFIT */}
{tab==="profit"&&(
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>CALCULADORA DE PROFIT</div>
<div style={{ color:"#52525b",fontSize:14 }}>Ganancia neta con impuestos incluidos</div>
</div>
<div className="card" style={{ marginBottom:14 }}>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
<div><div className="label">Precio de compra</div><input type="number" placeholder="0" value={profit.buy} onChange={e=>setProfit(p=>({...p,buy:e.target.value}))}/></div>
<div><div className="label">Precio de venta</div><input type="number" placeholder="0" value={profit.sell} onChange={e=>setProfit(p=>({...p,sell:e.target.value}))}/></div>
<div><div className="label">Tax % (mercado=3%)</div><input type="number" placeholder="3" value={profit.tax} onChange={e=>setProfit(p=>({...p,tax:e.target.value}))}/></div>
<div><div className="label">Cantidad</div><input type="number" placeholder="1" value={profit.qty} onChange={e=>setProfit(p=>({...p,qty:e.target.value}))}/></div>
</div>
<button className="btn" onClick={calcProfit} style={{ width:"100%" }}>CALCULAR PROFIT</button>
</div>
{profit.result&&(
<div className="card glow" style={{ borderColor:profit.result.net>0?"#4ade8066":"#ef444466" }}>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
{[
{ l:"Profit bruto",v:profit.result.gross.toLocaleString(),c:"#d4d4d8" },
{ l:"Impuesto",v:profit.result.tax.toLocaleString(),c:"#f97316" },
{ l:"PROFIT NETO",v:profit.result.net.toLocaleString(),c:profit.result.net>0?"#4ade80":"#ef4444",big:true },
{ l:"ROI",v:`${profit.result.roi}%`,c:profit.result.roi>0?"#60a5fa":"#ef4444",big:true },
].map(item=>(
<div key={item.l} style={{ padding:14,background:"#09090b",borderRadius:8 }}>
<div className="label">{item.l}</div>
<div style={{ fontSize:item.big?26:18,fontWeight:700,color:item.c,fontFamily:"Oswald" }}>{item.v}</div>
</div>
))}
</div>
<div style={{ padding:14,background:profit.result.net>0?"#052e16":"#450a0a",borderRadius:8,fontSize:14,color:profit.result.net>0?"#4ade80":"#f87171" }}>
{profit.result.net>0?`Rentable. Por cada 1,000 items: ${Math.round(profit.result.net/parseInt(profit.qty||1)*1000).toLocaleString()} silver.`:"Perdidas. Busca mejor mercado."}
</div>
</div>
)}
</div>
)}

{/* DECISION */}
{tab==="decision"&&(
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>QUE HAGO AHORA?</div>
<div style={{ color:"#52525b",fontSize:14 }}>Dime tu situacion y te digo exactamente que hacer</div>
</div>
<div className="card" style={{ marginBottom:14 }}>
<div style={{ display:"grid",gap:14,marginBottom:14 }}>
<div><div className="label">Tu silver actual</div><input type="number" placeholder="500000" value={decision.silver} onChange={e=>setDecision(d=>({...d,silver:e.target.value}))}/></div>
<div><div className="label">Tiempo disponible (minutos)</div><input type="number" placeholder="60" value={decision.time} onChange={e=>setDecision(d=>({...d,time:e.target.value}))}/></div>
<div><div className="label">Tu ciudad base</div><select value={decision.city} onChange={e=>setDecision(d=>({...d,city:e.target.value}))}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
<div><div className="label">Tu build</div><select value={decision.build} onChange={e=>setDecision(d=>({...d,build:e.target.value}))}>{BUILDS.map(b=><option key={b.name}>{b.name} - {(b.cost/1000).toFixed(0)}k silver</option>)}</select></div>
</div>
<button className="btn" onClick={calcDecision} style={{ width:"100%" }}>DAME UNA DECISION</button>
</div>
{decision.result&&(
<div className="card glow" style={{ borderColor:"#f59e0b55" }}>
<div style={{ fontSize:12,color:"#71717a",marginBottom:8,textTransform:"uppercase",letterSpacing:1 }}>Recomendacion</div>
<div style={{ fontSize:19,fontWeight:700,color:"#f59e0b",marginBottom:16,lineHeight:1.4 }}>{decision.result.action}</div>
<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14 }}>
<div style={{ padding:12,background:"#09090b",borderRadius:8,textAlign:"center" }}><div className="label">Silver estimado</div><div style={{ fontSize:20,fontWeight:700,color:"#4ade80",fontFamily:"Oswald" }}>+{decision.result.gain.toLocaleString()}</div></div>
<div style={{ padding:12,background:"#09090b",borderRadius:8,textAlign:"center" }}><div className="label">Zona</div><div style={{ fontSize:14,fontWeight:700,color:"#60a5fa" }}>{decision.result.zone}</div></div>
<div style={{ padding:12,background:riskBg(decision.result.risk),borderRadius:8,textAlign:"center" }}><div className="label">Riesgo PvP</div><div style={{ fontSize:14,fontWeight:700,color:riskColor(decision.result.risk),textTransform:"capitalize" }}>{decision.result.risk}</div></div>
</div>
<div style={{ padding:12,background:"#09090b",borderRadius:8,fontSize:13,color:"#a1a1aa",borderLeft:"3px solid #f59e0b" }}>{decision.result.tip}</div>
{!decision.result.canAfford&&<div style={{ marginTop:12,padding:12,background:"#422006",borderRadius:8,fontSize:13,color:"#fb923c" }}>No tienes suficiente silver. Usa el Starter Economico mientras ahorras.</div>}
</div>
)}
</div>
)}

{/* SNIPER */}
{tab==="sniper"&&(
<div>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
<div>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>DETECTOR DE OPORTUNIDADES</div>
<div style={{ color:"#52525b",fontSize:14 }}>{SNIPER_ITEMS.length} items · {CITIES.length} ciudades · {currentServer.flag} {currentServer.label}</div>
</div>
<button className="btn-sm" onClick={fetchSniperData} disabled={loadingSniper}>{loadingSniper?<Spinner/>:"Actualizar"}</button>
</div>
<div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
{["todos","recurso","arma","armadura","accesorio","montura"].map(cat=>{
const icons={todos:"🔍",recurso:"🪨",arma:"⚔️",armadura:"🛡",accesorio:"🎒",montura:"🐴"};
const count=cat==="todos"?opportunities.length:opportunities.filter(o=>SNIPER_ITEMS.find(i=>i.name===o.name)?.cat===cat).length;
const active=(sniperCat||"todos")===cat;
return (
<button key={cat} onClick={()=>setSniperCat(cat==="todos"?null:cat)} style={{ padding:"7px 14px",borderRadius:20,border:`1px solid ${active?"#f59e0b":"#27272a"}`,background:active?"#f59e0b22":"transparent",color:active?"#f59e0b":"#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,textTransform:"capitalize",transition:"all .2s" }}>
{icons[cat]} {cat==="todos"?"Todos":cat}{opportunities.length>0?` (${count})`:""}</button>
);
})}
</div>
{loadingSniper?(
<div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"40px 0",color:"#71717a" }}><Spinner/><div style={{ fontSize:14 }}>Analizando {SNIPER_ITEMS.length} items...</div></div>
):opportunities.length>0?(
<div style={{ display:"grid",gap:10 }}>
{opportunities.filter(o=>!sniperCat||SNIPER_ITEMS.find(i=>i.name===o.name)?.cat===sniperCat).map((item,i)=>(
<div key={i} className="card" style={{ display:"flex",alignItems:"center",gap:16,borderLeft:`3px solid ${item.roi>50?"#4ade80":item.roi>25?"#f59e0b":"#71717a"}` }}>
<div style={{ width:26,height:26,background:"#09090b",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#71717a",flexShrink:0 }}>#{i+1}</div>
<div style={{ flex:1,minWidth:0 }}>
<div style={{ fontWeight:700,fontSize:15 }}>{item.name}</div>
<div style={{ fontSize:12,color:"#71717a",marginTop:2 }}><span style={{ color:"#60a5fa" }}>{item.city_buy}</span> ({item.buy.toLocaleString()}) → <span style={{ color:"#f59e0b" }}>{item.city_sell}</span> ({item.sell.toLocaleString()})</div>
</div>
<div style={{ textAlign:"right",flexShrink:0 }}>
<div style={{ fontSize:18,fontWeight:700,color:"#4ade80",fontFamily:"Oswald" }}>+{item.profit.toLocaleString()}</div>
<div style={{ fontSize:12,color:"#71717a" }}>ROI: {item.roi}%</div>
</div>
<div style={{ padding:"5px 12px",background:item.roi>50?"#052e16":item.roi>25?"#422006":"#18181b",borderRadius:20,fontSize:12,fontWeight:700,color:item.roi>50?"#4ade80":item.roi>25?"#f59e0b":"#71717a",flexShrink:0 }}>
{item.roi>50?"HOT":item.roi>25?"OK":"BAJO"}
</div>
</div>
))}
</div>
):(
<div style={{ padding:"40px 0",textAlign:"center",color:"#71717a" }}>Presiona Actualizar para cargar oportunidades en tiempo real</div>
)}
</div>
)}

{/* CRAFT */}
{tab==="craft"&&(
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>CALCULADORA DE CRAFTING</div>
<div style={{ color:"#52525b",fontSize:14 }}>{CRAFT_RECIPES.length} recetas disponibles · {currentServer.flag} {currentServer.label}</div>
</div>
<div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
{["recurso","arma","armadura"].map(cat=>{
const icons={recurso:"🪨",arma:"⚔️",armadura:"🛡"};
return (
<button key={cat} onClick={()=>{ setCraftCat(cat); setSelectedRecipe(null); setCraftPrices({}); }} style={{ padding:"7px 14px",borderRadius:20,border:`1px solid ${craftCat===cat?"#f59e0b":"#27272a"}`,background:craftCat===cat?"#f59e0b22":"transparent",color:craftCat===cat?"#f59e0b":"#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,textTransform:"capitalize",transition:"all .2s" }}>
{icons[cat]} {cat} ({CRAFT_RECIPES.filter(r=>r.cat===cat).length})</button>
);
})}
</div>
<div style={{ display:"grid",gap:10,marginBottom:20 }}>
{CRAFT_RECIPES.filter(r=>r.cat===craftCat).map((r,i)=>(
<div key={i} className="card" style={{ cursor:"pointer",borderColor:selectedRecipe?.id===r.id?"#f59e0b":"#27272a",transition:"border-color .2s" }} onClick={()=>setSelectedRecipe(selectedRecipe?.id===r.id?null:r)}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
<div>
<div style={{ fontWeight:700,fontSize:16 }}>{r.name}</div>
<div style={{ fontSize:12,color:"#71717a",marginTop:3 }}>{r.mat.map(m=>`${m.qty}x ${m.name}`).join(" + ")} + {r.fee.toLocaleString()} fee</div>
</div>
<div style={{ fontSize:12,color:"#52525b" }}>{selectedRecipe?.id===r.id?"▲ Cerrar":"▼ Calcular"}</div>
</div>
{selectedRecipe?.id===r.id&&(
<div style={{ marginTop:16,borderTop:"1px solid #27272a",paddingTop:16 }} onClick={e=>e.stopPropagation()}>
<div style={{ marginBottom:14 }}>
<div className="label" style={{ marginBottom:6 }}>Cantidad a fabricar</div>
<input type="number" min="1" value={craftQty} onChange={e=>setCraftQty(e.target.value)} onClick={e=>e.stopPropagation()} placeholder="1" style={{ maxWidth:120 }}/>
</div>
{loadingCraft?(
<div style={{ display:"flex",alignItems:"center",gap:8,color:"#71717a",fontSize:14 }}><Spinner/> Cargando precios...</div>
):craftResult_?(
<div>
<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14 }}>
{[
{ l:"Costo materiales",v:craftResult_.matCost.toLocaleString(),c:"#f97316" },
{ l:"Fee de crafting",v:craftResult_.fee.toLocaleString(),c:"#a78bfa" },
{ l:"Ingreso venta",v:craftResult_.revenue.toLocaleString(),c:"#60a5fa" },
{ l:"Tax (3%)",v:craftResult_.tax.toLocaleString(),c:"#f97316" },
{ l:"GANANCIA NETA",v:craftResult_.net.toLocaleString(),c:craftResult_.net>0?"#4ade80":"#ef4444",big:true },
{ l:"ROI",v:`${craftResult_.roi}%`,c:craftResult_.roi>0?"#4ade80":"#ef4444",big:true },
].map(item=>(
<div key={item.l} style={{ padding:12,background:"#09090b",borderRadius:8 }}>
<div className="label">{item.l}</div>
<div style={{ fontSize:item.big?22:16,fontWeight:700,color:item.c,fontFamily:"Oswald" }}>{item.v}</div>
</div>
))}
</div>
<div style={{ padding:14,background:craftResult_.net>0?"#052e16":"#450a0a",borderRadius:8,fontSize:14,color:craftResult_.net>0?"#4ade80":"#f87171" }}>
{craftResult_.net>0?`Rentable. Fabricar ${craftQty}x ${r.name} → +${craftResult_.net.toLocaleString()} silver neto.`:`No rentable. Perdidas de ${Math.abs(craftResult_.net).toLocaleString()} silver.`}
</div>
</div>
):(
<div style={{ color:"#71717a",fontSize:13 }}>No hay precios disponibles. Verifica tu conexion.</div>
)}
</div>
)}
</div>
))}
</div>
</div>
)}

{tab==="transport"&&<TransportTab apiBase={apiBase}/>}
{tab==="scanner"&&<AutoScannerTab apiBase={apiBase}/>}
{tab==="weight"&&<WeightTab/>}
{tab==="session"&&<SessionTab/>}
{tab==="blackzone"&&<BlackZoneTab/>}

{/* ROUTES */}
{tab==="routes"&&(
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>RUTAS DE FARMEO</div>
<div style={{ color:"#52525b",fontSize:14 }}>{FARM_ZONES.length} zonas con pasos detallados</div>
</div>
<div style={{ display:"flex",gap:8,marginBottom:18,flexWrap:"wrap" }}>
{["todos","bajo","medio","alto","muy alto"].map(f=>(
<button key={f} onClick={()=>setZoneFilter(f)} style={{ padding:"7px 16px",borderRadius:20,border:`1px solid ${zoneFilter===f?"#f59e0b":"#27272a"}`,background:zoneFilter===f?"#f59e0b22":"transparent",color:zoneFilter===f?"#f59e0b":"#71717a",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,textTransform:"capitalize",transition:"all .2s" }}>
{f==="todos"?`Todas (${FARM_ZONES.length})`:`Riesgo ${f}`}
</button>
))}
</div>
<div style={{ display:"grid",gap:12 }}>
{filteredZones.map((z,i)=>(
<div key={i} className="card" style={{ cursor:"pointer",borderLeft:`3px solid ${riskColor(z.risk)}`,borderColor:selectedZone===i?riskColor(z.risk):"#27272a" }} onClick={()=>setSelectedZone(selectedZone===i?null:i)}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
<div>
<div style={{ fontSize:17,fontWeight:700 }}>{z.name}</div>
<div style={{ fontSize:13,color:"#71717a" }}>{z.zone} · {z.tier}</div>
</div>
<span className="badge" style={{ background:riskBg(z.risk),color:riskColor(z.risk) }}>{z.pvp?"PvP":"Seguro"} · {z.risk}</span>
</div>
<div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12 }}>
<div style={{ padding:10,background:"#09090b",borderRadius:8,textAlign:"center" }}><div className="label">Recurso</div><div style={{ fontSize:13,fontWeight:600,color:"#d4d4d8" }}>{z.resource}</div></div>
<div style={{ padding:10,background:"#09090b",borderRadius:8,textAlign:"center" }}><div className="label">Tiempo</div><div style={{ fontSize:16,fontWeight:700,color:"#60a5fa",fontFamily:"Oswald" }}>{z.time} min</div></div>
<div style={{ padding:10,background:"#09090b",borderRadius:8,textAlign:"center" }}><div className="label">Silver/h</div><div style={{ fontSize:16,fontWeight:700,color:"#4ade80",fontFamily:"Oswald" }}>{(z.silver/1000).toFixed(0)}k</div></div>
</div>
{selectedZone===i&&(
<div style={{ marginTop:4,borderTop:"1px solid #27272a",paddingTop:14 }}>
<div className="label" style={{ marginBottom:10 }}>Pasos de la ruta</div>
{z.steps.map((step,si)=>(
<div key={si} className="step">
<div className="step-num">{si+1}</div>
<div style={{ fontSize:14,color:"#d4d4d8",lineHeight:1.4 }}>{step}</div>
</div>
))}
<div style={{ marginTop:12,padding:10,background:"#09090b",borderRadius:8,fontSize:13,color:"#a1a1aa",borderLeft:"3px solid #f59e0b" }}>{z.tip}</div>
</div>
)}
<div style={{ marginTop:10,fontSize:12,color:"#52525b" }}>{selectedZone===i?"Ocultar pasos":"Ver pasos detallados"}</div>
</div>
))}
</div>
</div>
)}

{/* BUILDS */}
{tab==="builds"&&(
<div>
<div style={{ marginBottom:20 }}>
<div style={{ fontSize:22,fontWeight:700,color:"#f59e0b",fontFamily:"Oswald" }}>BUILDS PARA FARMEAR</div>
<div style={{ color:"#52525b",fontSize:14 }}>{BUILDS.length} builds · principiante hasta elite</div>
</div>
<div style={{ display:"grid",gap:12 }}>
{BUILDS.map((b,i)=>(
<div key={i} className="card" style={{ cursor:"pointer",borderColor:selectedBuild===i?"#f59e0b":"#27272a",transition:"border-color .2s" }} onClick={()=>setSelectedBuild(selectedBuild===i?null:i)}>
<div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
<div><div style={{ fontSize:17,fontWeight:700 }}>{b.name}</div><div style={{ fontSize:13,color:"#71717a",marginTop:2 }}>{b.role} · {b.tier}</div></div>
<div style={{ textAlign:"right" }}>
<div style={{ fontSize:20,fontWeight:700,color:"#4ade80",fontFamily:"Oswald" }}>{(b.silver_h/1000).toFixed(0)}k/h</div>
<div style={{ fontSize:12,color:"#71717a" }}>Costo: {(b.cost/1000).toFixed(0)}k silver</div>
</div>
</div>
{selectedBuild===i&&(
<div style={{ marginTop:14,borderTop:"1px solid #27272a",paddingTop:14 }}>
<div style={{ fontSize:13,color:"#a1a1aa",marginBottom:12 }}>{b.desc}</div>
<div className="label" style={{ marginBottom:6 }}>Equipamiento</div>
<div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:12 }}>
{b.items.map(item=><span key={item} style={{ padding:"4px 12px",background:"#09090b",border:"1px solid #3f3f46",borderRadius:20,fontSize:13,color:"#d4d4d8" }}>{item}</span>)}
</div>
<div className="label" style={{ marginBottom:6 }}>Zonas recomendadas</div>
<div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
{b.zones.map(z=><span key={z} style={{ padding:"4px 12px",background:"#052e16",border:"1px solid #4ade8033",borderRadius:20,fontSize:13,color:"#4ade80" }}>{z}</span>)}
</div>
</div>
)}
<div style={{ marginTop:10,fontSize:12,color:"#52525b" }}>{selectedBuild===i?"Ocultar":"Ver equipo y zonas"}</div>
</div>
))}
</div>
</div>
)}

</div>
</div>
);
}