const NB_CASES = 2000;

let delaunay;
let voronoi;

let json = JSON.parse("{}");

export class MapGenerator {
  seed;

  openSimplexAltitude;
  openSimplexTemperature;
  openSimplexHumidity;
  openSimplexDangerousness;

  constructor(seed) {
    if (seed) {
      this.seed = seed;
    } else {
      this.seed = Math.trunc(Math.random() * 2147483648);
    }

    this.openSimplexAltitude = openSimplexNoise(seed);
    this.openSimplexTemperature = openSimplexNoise(seed - 1);
    this.openSimplexHumidity = openSimplexNoise(seed - 2);
    this.openSimplexDangerousness = openSimplexNoise(seed - 3);
  }

  generate() {
    json.points = [];
    json.tiles = [];

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
        this.openSimplexAltitude,
        120,
        120,
        centre[0],
        centre[1]
      );
      let temperature = generateNoise(
        this.openSimplexTemperature,
        500,
        100,
        centre[0],
        centre[1]
      );
      let humidity = generateNoise(
        this.openSimplexHumidity,
        80,
        80,
        centre[0],
        centre[1]
      );
      let dangerousness = generateNoise(
        this.openSimplexDangerousness,
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
        routes: [],
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
    });

    // Calcul la taille des tuiles
    json.tiles.forEach((t) => {
      t.size = Math.abs(d3.polygonArea(t.sommets));
    });

    // Force borders (0 = Océan || 10 = Montagne)
    forceBorders(10);

    // Calcul voisin
    json.tiles.forEach((t) => {
      t.neighbors = Array.from(voronoi.neighbors(t.id)).map((id) => {
        let voisin = json.tiles.filter((t2) => t2.id == id)[0];

        let segmentSeparation = voisin.sommets
          .slice(0, voisin.sommets.length - 1)
          .flatMap((sommetVoisin) => {
            return t.sommets
              .slice(0, t.sommets.length - 1)
              .map((sommetTuile) => {
                return {
                  s1: sommetTuile,
                  s2: sommetVoisin,
                  d: calculDistance(
                    sommetTuile[0],
                    sommetTuile[1],
                    sommetVoisin[0],
                    sommetVoisin[1]
                  ),
                };
              })
              .filter((d) => d.d == 0);
          });

        if (segmentSeparation.length == 1) {
          // Quand les tuiles se touchent par le sommet
          segmentSeparation = [
            segmentSeparation[0].s1,
            segmentSeparation[0].s1,
          ];
        } else if (segmentSeparation.length >= 2) {
          // Quand les tuiles se touchant par un coté
          segmentSeparation = [
            segmentSeparation[0].s1,
            segmentSeparation[1].s1,
          ];
        } else {
          // Erreur ne devrais pas arriver (erreur bloquante)
          // TODO Vérifier si la cas des voisins qui ne se touchent pas se produit ou pas
          console.error(
            "Erreur dans le calcul de la séparation entre 2 tuiles voisines car les tuiles ne se touchant pas. erreur segmentSeparation",
            t,
            voisin,
            segmentSeparation
          );
        }

        return {
          id: id,
          biome: voisin.biome.id,
          distance: calculDistance(
            t.centre[0],
            t.centre[1],
            voisin.centre[0],
            voisin.centre[1]
          ),
          segmentSeparation: segmentSeparation,
          centreSegmentSeparation: calculCentre(
            segmentSeparation[0][0],
            segmentSeparation[0][1],
            segmentSeparation[1][0],
            segmentSeparation[1][1]
          ),
        };
      });
    });

    //DEBUG villes potentielles
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
      t.biome.id = 21;
      t.color = generateColorFromBiomeId(t.biome);
    });

    // DEBUG créer quelques routes pour relier les villages
    /*for (let i = 0; i < tuileDeVillePotentielles.length; i++) {
        createLongRoad(pathfinding(tuileDeVillePotentielles[i].id, tuileDeVillePotentielles[(i+1)%tuileDeVillePotentielles.length].id, [20] ));
      }*/

    // TODO A Suppr, Relier tous les villages (Pas opti = lag)
    /* tuileDeVillePotentielles.forEach(v1 => {
        tuileDeVillePotentielles.forEach(v2 => {
          if(v1 != v2){
            createLongRoad(pathfinding(v1.id, v2.id, [20]))
          }
        })
      })*/

    // DEBUG Chaque village est relié à ses 3 plus proches voisins
    tuileDeVillePotentielles
      .map((t) => {
        return {
          src: t.id,
          centre: t.centre,
          dest: tuileDeVillePotentielles
            .filter((t2) => t2.id != t.id)
            .map((t2) => {
              return {
                id: t2.id,
                dist: calculDistance(
                  t.centre[0],
                  t.centre[1],
                  t2.centre[0],
                  t2.centre[1]
                ),
              };
            })
            .sort((d1, d2) => {
              return d1.dist - d2.dist;
            })
            .slice(0, 3),
        };
      })
      .map((t) => {
        return { src: t.src, dest: t.dest.flatMap((d) => d.id) };
      })
      .forEach((road) => {
        road.dest.forEach((dest) => {
          createLongRoad(pathfinding(road.src, dest, [20]));
        });
      });

    return JSON.stringify(json);
  }
}

// Retourne une valeur entre 0 et 1 pour des coordonnées XY données
function generateNoise(noise, zoomX, zoomY, x, y) {
  return (noise.noise2D(x / zoomX, y / zoomY) + 1) / 2;
}
// TODO Retravailler les biomes
function determineBiomeTypeID(altitude, temperature, humidity, danger) {
  if (altitude <= 0.32) {
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
function generateColorFromBiomeId(biomeId) {
  switch (biomeId) {
    case 0:
      // OCEAN
      return "#00f";
    case 10:
      // Montagne
      return "#ddd";
    case 11:
      // Montagne haute (neige)
      return "#fff";
    case 12:
      // Volcan
      return "#f00";
    case 20:
      // Plaines
      return "#00cc00";
    case 21:
      // Village
      return "#00ff00";
    default:
      return "#ff00ff";
  }
}

const forceBorders = (idBiome) => {
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
};

function calculDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function calculCentre(x1, y1, x2, y2) {
  return [0.5 * (x1 + x2), 0.5 * (y1 + y2)];
}

function createRoad(idTuile, idVoisin) {
  createSemiRoad(idTuile, idVoisin);
  createSemiRoad(idVoisin, idTuile);
}

function createLongRoad(idTuiles) {
  if (!idTuiles || idTuiles.length == 0) {
    return;
  }
  for (let index = 0; index < idTuiles.length - 1; index++) {
    createRoad(idTuiles[index], idTuiles[index + 1]);
  }
}
function createSemiRoad(idTuile, idVoisin) {
  if (
    !json.tiles
      .filter((t) => t.id == idTuile)[0]
      .neighbors.filter((n) => n.id == idVoisin)[0]
  ) {
    console.error("Les tuiles ne sont pas voisines", idTuile, idVoisin);
    return;
  }

  const centre = json.tiles.filter((t) => t.id == idTuile)[0].centre;
  const dest = json.tiles
    .filter((t) => t.id == idTuile)[0]
    .neighbors.filter((n) => n.id == idVoisin)[0].centreSegmentSeparation;

  let p2 = [
    centre[0] + 0.2 * (dest[0] - centre[0]),
    centre[1] + 0.2 * (dest[1] - centre[1]),
  ];

  let p3;
  let sommetA = json.tiles
    .filter((t) => t.id == idTuile)[0]
    .neighbors.filter((n) => n.id == idVoisin)[0].segmentSeparation[0];
  let sommetB = json.tiles
    .filter((t) => t.id == idTuile)[0]
    .neighbors.filter((n) => n.id == idVoisin)[0].segmentSeparation[1];
  if (isVertical(sommetA, sommetB)) {
    p3 = [centre[0] + 0.3 * (dest[0] - centre[0]), dest[1]];
  } else {
    p3 = [dest[0], centre[1] + 0.3 * (dest[1] - centre[1])];
  }

  // Vérifier si la route existe déjà pour ne pas créer de doublons
  if (json.tiles.filter(t => t.id == idTuile)[0].routes.filter((r) => r.p1 == centre && r.p4 == dest).length > 0) {
    return;
  }

  json.tiles.filter(t => t.id == idTuile)[0].routes.push({
    p1: centre,
    p2: p2,
    p3: p3,
    p4: dest,
  });
}

function pathfinding(idTuileDebut, idTuileFin, biomesAutorises) {
  if (!biomesAutorises) {
    biomesAutorises = [10, 20, 21];
  }

  let debut = json.tiles.filter((t) => t.id == idTuileDebut)[0];
  let fin = json.tiles.filter((t) => t.id == idTuileFin)[0];

  const data = json.tiles.map((t) => {
    return { id: t.id, dist: Infinity, prev: undefined, closed: false };
  });

  let current = debut;
  data.filter((d) => d.id == debut.id)[0].dist = 0;
  data.filter((d) => d.id == debut.id)[0].closed = true;

  while (current.id != fin.id) {
    // récupérer voisins autorisés
    let voisinsPossibles = json.tiles
      .filter((t) => t.id == current.id)[0]
      .neighbors.filter((n) => biomesAutorises.includes(n.biome));
    voisinsPossibles.forEach((v) => {
      if (
        data.filter((d) => d.id == current.id)[0].dist + v.distance <
        data.filter((d) => d.id == v.id)[0].dist
      ) {
        // Nouveau plus cour chemin pour aller en v depuis current
        data.filter((d) => d.id == v.id)[0].prev = current.id;
        data.filter((d) => d.id == v.id)[0].dist =
          data.filter((d) => d.id == current.id)[0].dist + v.distance;
      }
    });
    // Si tous les chemins bloqués
    if (data.filter((d) => !d.closed && d.dist != Infinity).length == 0) {
      // TODO Dans ce cas, ? créer des ports pour laisser un moyen de traverser la mer / ? voyages rapides
      console.error(
        "Chemins bloqués pathfinding",
        idTuileDebut,
        idTuileFin,
        biomesAutorises
      );
      return null;
    }

    // Choisir noeud suivant à bloquer
    let idSuivant = data
      .filter((d) => !d.closed && d.dist != Infinity)
      .sort((d1, d2) => {
        return d1.dist - d2.dist;
      })[0].id;
    data.filter((d) => d.id == idSuivant)[0].closed = true;
    current = json.tiles.filter((t) => t.id == idSuivant)[0];
  }

  // Reconstruire le chemin
  let path = [];
  let c = current.id;
  while (c != debut.id) {
    if (!c) {
      console.error("c undefined");
    }
    path.unshift(c);
    c = data.filter((d) => d.id == c)[0].prev;
  }
  path.unshift(debut.id);
  return path;
}
// Vérifie si segment est plus vertical qu'horizontal
function isVertical(A, B) {
  return Math.abs(B[0] - A[0]) < Math.abs(B[1] - A[1]);
}
