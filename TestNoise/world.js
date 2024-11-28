const seed = Math.trunc(Math.random() * Math.pow(2, 31));

const openSimplexAltitude = openSimplexNoise(seed);
const openSimplexTemperature = openSimplexNoise(seed - 1);
const openSimplexHumidity = openSimplexNoise(seed - 2);
const openSimplexDangerousness = openSimplexNoise(seed - 3);

function loadGraph(json) {
  console.log("DEBUG JSON", json);

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
  const NB_CASES = 1000;

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

  const delaunay = d3.Delaunay.from(json.points.map((p) => [p.x, p.y]));
  //const voronoi = delaunay.voronoi([-1000000, -1000000, 1000000, 1000000]);
  const voronoi = delaunay.voronoi([0, 0, 1000, 1000]);

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
      humidity,
      temperature,
      dangerousness
    );

    json.tiles.push({
      id: cell.index,
      //color: generateColor(cell[0][0], cell[0][1]),
      color: generateColorFromBiomeId(biome),
      centre: centre,
      biome: {
        biome: biome,
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
  });

  // Force borders
  forceBorders(0);

  return json;
}

// TODO A SUPPR
function generateColor(x, y) {
  return (
    "rgb(" +
    Math.trunc(Math.random() * 255) +
    ", " +
    Math.trunc(Math.random() * 255) +
    ", " +
    Math.trunc(Math.random() * 255) +
    ")"
  );

  if (distance2 < 50) {
    return "#5555FF";
  }
  if (distance2 < 75) {
    return "yellow";
  }
  if (distance < 30) {
    return "#fff";
  }
  if (distance < 75) {
    return "#ddd";
  }
  if (distance < 200 && y > 500) {
    return "#008800";
  }
  if (distance < 200 && y <= 500 && x > 500) {
    return "yellow";
  }
  if (distance < 120 && y <= 500 && x <= 500) {
    return "orange";
  }
  if (distance > 120 && distance < 200 && y <= 500 && x <= 500) {
    return "lime";
  }
  if (distance < 350) {
    return "#00cc00";
  }
  if (distance < 400 && distance > 350) {
    return "yellow";
  } else {
    return "#5555FF";
  }
}

// Vérifie si segment est plus vertical qu'horizontal
function isVertical(A, B) {
  return Math.abs(B[0] - A[0]) < Math.abs(B[1] - A[1]);
}

function afficherTuiles() {
  for (let p of document.getElementsByTagName("polygon")) {
    p.setAttribute("stroke", "black");
    p.setAttribute("stroke-width", "0.5px");
  }
}

function generateNoise(noise, zoomX, zoomY, x, y) {
  let alt = (noise.noise2D(x / zoomX, y / zoomY) + 1) / 2;
  return alt;
}

// TODO Retravailler les biomes
function determineBiomeTypeID(altitude, temperature, humidity, danger) {
  if (altitude <= 0.35) {
    // OCEAN
    return 0;
  } else if (altitude > 0.7) {
    if (altitude > 0.85) {
      if (temperature > 0.6) {
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
  json.tiles.forEach(tuile => {
    if(tuile.sommets.some(sommet => {
      return sommet[0] === 0 || sommet[1] === 0 || sommet[0] === 1000 || sommet[1] === 1000
    })){
      tuile.biome.biome = idBiome;
      tuile.color = generateColorFromBiomeId(idBiome)
    }
    
  })
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

// Affichage
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
