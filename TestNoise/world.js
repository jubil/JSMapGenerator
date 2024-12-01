const seed = Math.trunc(Math.random() * Math.pow(2, 31));

const openSimplexAltitude = openSimplexNoise(seed);
const openSimplexTemperature = openSimplexNoise(seed - 1);
const openSimplexHumidity = openSimplexNoise(seed - 2);
const openSimplexDangerousness = openSimplexNoise(seed - 3);

let delaunay;
let voronoi;

let zoomSvg = 0;
let zoomX = 0;
let zoomY = 0;

function loadGraph(json) {
  console.log("Loading JSON", json);
  cleanGraphSVG();
  
  json.points.forEach((p) => {
    let node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    node.setAttribute("cx", p.x);
    node.setAttribute("cy", p.y);
    node.setAttribute("r", 2);
    document.getElementById("graph-points").appendChild(node);
  });

  json.edges.forEach((e) => {
    let edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let path = "M" + e.path[0].x + "," + e.path[0].y + " ";
    e.path.slice(1).forEach((p) => {
      path += "L" + p.x + "," + p.y + " ";
    });
    edge.setAttribute("d", path);
    document.getElementById("graph-edges").appendChild(edge);
  });

  json.tiles.forEach((p) => {
    let tile = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    tile.setAttribute("tuile", p.id);
    tile.setAttribute("points", p.path);
    tile.setAttribute("fill", p.color);
    tile.setAttribute("stroke", p.color);
    document.getElementById("graph-tiles").appendChild(tile);
  });

  json.routes.forEach((r) => {
    let route = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const path = [
      "M",
      r.p1[0],
      r.p1[1],
      "C",
      r.p2[0],
      r.p2[1],
      r.p3[0],
      r.p3[1],
      r.p4[0],
      r.p4[1],
    ].join(" ");

    route.setAttribute("d", path);
    document.getElementById("graph-routes-layer0").appendChild(route);
    document
      .getElementById("graph-routes-layer1")
      .appendChild(route.cloneNode());
  });
}

function generateJsonRandom() {
  const NB_CASES = 2000;

  json = JSON.parse("{}");

  json.points = [];
  json.edges = [];
  json.tiles = [];
  json.routes = [];

  /*   for (let i = 0; i < NB_CASES; i++) {
    json.points.push({
      x: Math.floor(Math.random() * 900 + 50),
      y: Math.floor(Math.random() * 900 + 50),
    });
  } */

  for (let i = 0; i < NB_CASES; i++) {
    json.points.push({
      x: Math.floor(Math.random() * 1000),
      y: Math.floor(Math.random() * 1000),
    });
  }

  delaunay = d3.Delaunay.from(json.points.map((p) => [p.x, p.y]));
  voronoi = delaunay.voronoi([0, 0, 1000, 1000]);
  //voronoi = delaunay.voronoi([-1000000, -1000000, 1000000, 1000000]);

  voronoi.cellPolygons().forEach((cell) => {
    let centre = [0, 0];
    for (let i = 0; i < cell.length - 1; i++) {
      centre[0] += cell[i][0];
      centre[1] += cell[i][1];
    }
    centre[0] = centre[0] / (cell.length - 1);
    centre[1] = centre[1] / (cell.length - 1);
    let altitude = generateNoise(
      openSimplexAltitude,
      120,
      120,
      centre[0],
      centre[1]
    );
    let temperature = generateNoise(
      openSimplexTemperature,
      500,
      100,
      centre[0],
      centre[1]
    );
    let humidity = generateNoise(
      openSimplexHumidity,
      80,
      80,
      centre[0],
      centre[1]
    );
    let dangerousness = generateNoise(
      openSimplexDangerousness,
      80,
      80,
      centre[0],
      centre[1]
    );
    let biome = determineBiomeTypeID(
      altitude,
      temperature,
      humidity,
      dangerousness
    );

    json.tiles.push({
      id: cell.index,
      color: generateColorFromBiomeId(biome),
      centre: centre,
      biome: {
        id: biome,
        altitude: altitude,
        temperature: temperature,
        humidity: humidity,
        danger: dangerousness,
      },
      path: JSON.stringify(cell)
        .replaceAll("],[", " ")
        .replaceAll("[[", "")
        .replaceAll("]]", ""),
      sommets: cell.slice(),
    });

    // TODO A Suppr
    // Générer des routes sur toutes les tuiles de plaines
/*     if (biome == 20) {
      for (let i = 0; i < cell.length - 1; i++) {
        const sommetA = cell[i];
        const sommetB = cell[i + 1];

        // TODO Si pas besoin de détour (les 2 centre de tuiles en ligne droite, pas besoin de courbe)
        //Si besoin de faire un détour
        let dest = [
          sommetA[0] + 0.5 * (sommetB[0] - sommetA[0]),
          sommetA[1] + 0.5 * (sommetB[1] - sommetA[1]),
        ];

        let p2 = [
          centre[0] + 0.2 * (dest[0] - centre[0]),
          centre[1] + 0.2 * (dest[1] - centre[1]),
        ];

        let p3;
        if (isVertical(sommetA, sommetB)) {
          p3 = [centre[0] + 0.3 * (dest[0] - centre[0]), dest[1]];
        } else {
          p3 = [dest[0], centre[1] + 0.3 * (dest[1] - centre[1])];
        }

        json.routes.push({
          p1: centre,
          p2: p2,
          p3: p3,
          p4: dest,
        });
      }
    } */
  });

  // Calcul la taille des tuiles
  json.tiles.forEach((t) => {
    t.size = Math.abs(d3.polygonArea(t.sommets));
  });

  // Force borders (0 = Océan || 10 = Montagne)
  // forceBorders(0);

  // Calcul voisin
  json.tiles.forEach((t) => {
    t.neighbors = Array.from(voronoi.neighbors(t.id)).map((id) => {
      let voisin = json.tiles.filter((t2) => t2.id == id)[0];

      let segmentSeparation = voisin.sommets.flatMap(sommetVoisin => {
        return t.sommets.map(sommetTuile => {
          return {
            s1: sommetTuile,
            s2: sommetVoisin,
            d: calculDistance(sommetTuile[0], sommetTuile[1], sommetVoisin[0], sommetVoisin[1])
          }
        }).filter(d => d.d == 0)
      });

      if(segmentSeparation.length == 1){
        // Quand les tuiles se touchent par le sommet
        segmentSeparation = [segmentSeparation[0].s1, segmentSeparation[0].s1]
      }else if(segmentSeparation.length >= 2){
        // Quand les tuiles se touchant par un coté
        segmentSeparation = [segmentSeparation[0].s1, segmentSeparation[1].s1]
      }
      else {
        // Erreur ne devrais pas arriver (erreur bloquante)
        // TODO Vérifier si la cas des voisins qui ne se touchent pas se produit ou pas
        console.error("Erreur dans le calcul de la séparation entre 2 tuiles voisines car les tuiles ne se touchant pas. erreur segmentSeparation", t, voisin, segmentSeparation)
      }

      return {
        id: id,
        biome: voisin.biome.id,
        distance: calculDistance(t.centre[0], t.centre[1], voisin.centre[0], voisin.centre[1]),
        segmentSeparation: segmentSeparation,
        centreSegmentSeparation: calculCentre(segmentSeparation[0][0],segmentSeparation[0][1],segmentSeparation[1][0],segmentSeparation[1][1])
      };
    });
  });

  //DEBUG
  let tuileDeVillePotentielles = json.tiles
    .filter((t) => t.biome.id == 20)
    // 1100 Taille minimum d'une tuile pour accueillir un village
    .filter((t) => t.size > 1100);
  for (let t of tuileDeVillePotentielles) {
    if (
      tuileDeVillePotentielles
        .filter((x) => x !== t)
        .map((x) => x.neighbors.map((n) => n.id))
        .flat()
        .includes(t.id)
    ) {
      tuileDeVillePotentielles = tuileDeVillePotentielles.filter(
        (x) => x !== t
      );
    }
  }
  tuileDeVillePotentielles.forEach((t) => {
    t.color = "lime";
  });

  return json;
}

// TODO A SUPPR
function generateRandomColor() {
  return (
    "rgb(" +
    Math.trunc(Math.random() * 255) +
    ", " +
    Math.trunc(Math.random() * 255) +
    ", " +
    Math.trunc(Math.random() * 255) +
    ")"
  );
}

// Vérifie si segment est plus vertical qu'horizontal
function isVertical(A, B) {
  return Math.abs(B[0] - A[0]) < Math.abs(B[1] - A[1]);
}

// Retourne une valeur entre 0 et 1 pour des coordonnées XY données
function generateNoise(noise, zoomX, zoomY, x, y) {
  return (noise.noise2D(x / zoomX, y / zoomY) + 1) / 2;
}

// TODO Retravailler les biomes
function determineBiomeTypeID(altitude, temperature, humidity, danger) {
  if (altitude <= 0.35) {
    // OCEAN
    return 0;
  } else if (altitude > 0.7) {
    if (altitude > 0.85) {
      if (temperature > 0.65) {
        // Volcan
        return 12;
      }
      //neige
      return 11;
    }
    // Montagne
    return 10;
  } else {
    // Plaines
    return 20;
  }
}

// Transforme tous les bords (0 0 1000 1000) en un biome donné. (0 = Océan)
function forceBorders(idBiome) {
  json.tiles.forEach((tuile) => {
    if (
      tuile.sommets.some((sommet) => {
        return (
          sommet[0] === 0 ||
          sommet[1] === 0 ||
          sommet[0] === 1000 ||
          sommet[1] === 1000
        );
      })
    ) {
      tuile.biome.id = idBiome;
      tuile.color = generateColorFromBiomeId(idBiome);
    }
  });
}

function generateColorFromBiomeId(biomeId) {
  switch (biomeId) {
    case 0:
      return "#00f";
    case 10:
      return "#ddd";
    case 11:
      return "#fff";
    case 12:
      return "#f00";
    case 20:
      return "#00cc00";
    default:
      return "#ff00ff";
  }
}

function createSemiRoad(idTuile, idVoisin) {
  const centre = json.tiles.filter((t) => t.id == idTuile)[0].centre;
  const dest = json.tiles.filter((t) => t.id == idTuile)[0].neighbors.filter((n) => n.id == idVoisin)[0].centreSegmentSeparation;

  let p2 = [
    centre[0] + 0.2 * (dest[0] - centre[0]),
    centre[1] + 0.2 * (dest[1] - centre[1]),
  ];

  let p3;
  sommetA = json.tiles.filter((t) => t.id == idTuile)[0].neighbors.filter((n) => n.id == idVoisin)[0].segmentSeparation[0]
  sommetB = json.tiles.filter((t) => t.id == idTuile)[0].neighbors.filter((n) => n.id == idVoisin)[0].segmentSeparation[1]
  if (isVertical(sommetA, sommetB)) {
    p3 = [centre[0] + 0.3 * (dest[0] - centre[0]), dest[1]];
  } else {
    p3 = [dest[0], centre[1] + 0.3 * (dest[1] - centre[1])];
  }

  json.routes.push({
    p1: centre,
    p2: p2,
    p3: p3,
    p4: dest,
  });
}

function createRoad(idTuile, idVoisin){
  createSemiRoad(idTuile, idVoisin)
  createSemiRoad(idVoisin, idTuile)
}


function createLongRoad(...idTuiles) {
  for (let index = 0; index < idTuiles.length-1; index++) {
    createRoad(idTuiles[index], idTuiles[index+1])
  }
}

function calculDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function calculCentre(x1, y1, x2, y2) {
  return [0.5 * (x1 + x2), 0.5 * (y1 + y2)];
}

/////////////////////////////////////////////////////////
/////////////////////// AFFICHAGE ///////////////////////
/////////////////////////////////////////////////////////

function loadDetails() {
  let graphBiome = document.getElementById("graph-biome").getContext("2d");
  let graphAltitude = document
    .getElementById("graph-altitude")
    .getContext("2d");
  let graphTemperature = document
    .getElementById("graph-temperature")
    .getContext("2d");
  let graphHumidity = document
    .getElementById("graph-humidity")
    .getContext("2d");
  let graphDanger = document.getElementById("graph-danger").getContext("2d");
  [...Array(1000 * 1000).keys()].forEach((i) => {
    let x = Math.trunc(i / 1000);
    let y = i % 1000;

    graphBiome.fillStyle = generateGraphColorBiome(x, y);
    graphBiome.fillRect(x, y, 1000, 1000);

    graphAltitude.fillStyle = generateGraphColorAltitude(x, y);
    graphAltitude.fillRect(x, y, 1000, 1000);

    graphTemperature.fillStyle = generateGraphColorTemperature(x, y);
    graphTemperature.fillRect(x, y, 1000, 1000);

    graphHumidity.fillStyle = generateGraphColorHumidite(x, y);
    graphHumidity.fillRect(x, y, 1000, 1000);

    graphDanger.fillStyle = generateGraphColorDanger(x, y);
    graphDanger.fillRect(x, y, 1000, 1000);
  });
}

function generateGraphColorBiome(x, y) {
  let altitude = generateNoise(openSimplexAltitude, 120, 120, x, y);
  let temperature = generateNoise(openSimplexTemperature, 500, 100, x, y);
  let humidity = generateNoise(openSimplexHumidity, 300, 300, x, y);
  let dangerousness = generateNoise(openSimplexDangerousness, 80, 80, x, y);

  const idBiome = determineBiomeTypeID(
    altitude,
    temperature,
    humidity,
    dangerousness
  );
  return generateColorFromBiomeId(idBiome);
}

function generateGraphColorAltitude(x, y) {
  const zoom = 120;
  let alt = Math.trunc(
    ((openSimplexAltitude.noise2D(x / zoom, y / zoom) + 1) / 2) * 255
  );
  return "rgb(" + alt + "," + alt + "," + alt + ")";
}

function generateGraphColorTemperature(x, y) {
  let temperature = Math.trunc(
    ((openSimplexTemperature.noise2D(x / 500, y / 100) + 1) / 2) * 255
  );
  return "rgb(" + temperature + "," + 0 + "," + (255 - temperature) + ")";
}

function generateGraphColorHumidite(x, y) {
  const zoom = 300;
  let hum = Math.trunc(
    ((openSimplexHumidity.noise2D(x / zoom, y / zoom) + 1) / 2) * 255
  );
  return "rgb(" + (255 - hum) + "," + (255 - hum) + "," + 255 + ")";
}

function generateGraphColorDanger(x, y) {
  const zoom = 80;
  let danger = Math.trunc(
    ((openSimplexDangerousness.noise2D(x / zoom, y / zoom) + 1) / 2) * 255
  );
  return "rgb(" + 255 + "," + (255 - danger) + "," + (255 - danger) + ")";
}

function downloadMapAsJSON() {
  let j = document.createElement("a");
  j.download = "Map.json";
  j.href = URL.createObjectURL(new Blob([JSON.stringify(json)]));
  j.click();
}

//Commandes clavier
document.addEventListener("keydown", (e) => {
  if (e.key == "+") {
    zoomSvg += 20;
  } else if (e.key == "-") {
    zoomSvg -= 20;
  } else if (e.key == "z" || e.key == "w") {
    zoomY -= 20;
  } else if (e.key == "s") {
    zoomY += 20;
  } else if (e.key == "q" || e.key == "a") {
    zoomX -= 20;
  } else if (e.key == "d") {
    zoomX += 20;
  }

  document
    .getElementById("graph")
    .setAttribute(
      "viewBox",
      zoomX +
        zoomSvg +
        " " +
        (zoomY + zoomSvg) +
        " " +
        (1000 - 2 * zoomSvg) +
        " " +
        (1000 - 2 * zoomSvg)
    );
});

function btnChargerLesDetails() {
  document
    .getElementById("details-carte-btn")
    .setAttribute("style", "display:none");
  document.getElementById("details-carte").removeAttribute("style");
  setTimeout(() => {
    loadDetails();
  }, 500);
}

// Méthode d'affichage des contours des tuiles
function afficherTuiles() {
  for (let p of document.getElementsByTagName("polygon")) {
    p.setAttribute("stroke", "black");
    p.setAttribute("stroke-width", "0.5px");
  }
}

function paintTile(idTile, color){
  if(!color){
    color = "yellow"
  }
  Array.from(document.getElementsByTagName("polygon")).filter(p => p.getAttribute("tuile") == idTile)[0].setAttribute("fill", color)
}

// A Refacto, drop all and recreate <g> tags
function cleanGraphSVG() {
  document.getElementById("graph-tiles").innerHTML = "";
  document.getElementById("graph-routes-layer0").innerHTML = "";
  document.getElementById("graph-routes-layer1").innerHTML = "";
  document.getElementById("graph-points").innerHTML = "";
}

