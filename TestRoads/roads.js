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

  json.polygon.forEach((p) => {
    let tile = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    tile.setAttribute("points", p.points);
    //tile.setAttribute("stroke", "#F55")
    tile.setAttribute(
      "fill",
      //"#" + Math.floor(Math.random() * 16777215).toString(16)
      p.color
    );
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
  json.polygon = [];
  json.routes = [];

  for (let i = 0; i < NB_CASES; i++) {
    json.points.push({
      x: Math.floor(Math.random() * 900 + 50),
      y: Math.floor(Math.random() * 900 + 50),
    });
  }

  const delaunay = d3.Delaunay.from(json.points.map((p) => [p.x, p.y]));
  const voronoi = delaunay.voronoi([-1000000, -1000000, 1000000, 1000000]);
  //const voronoi = delaunay.voronoi([0, 0, 1000, 1000]);

  voronoi.cellPolygons().forEach((cell) => {
    let centre = null;
    json.points.forEach((p) => {
      if (voronoi.contains(cell.index, p.x, p.y)) {
        centre = [p.x, p.y];
      }
    });

    json.polygon.push({
      id: cell.index,
      color: generateColor(cell[0][0], cell[0][1]),
      centre: centre,
      points: JSON.stringify(cell)
        .replaceAll("],[", " ")
        .replaceAll("[[", "")
        .replaceAll("]]", ""),
    });

    // TODO WIP
    if (centre) {
      for (let i = 0; i < cell.length - 1; i++) {
        const sommetA = cell[i];
        const sommetB = cell[(i + 1)];

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

        let p3 
        if(isVertical(sommetA, sommetB)){
          p3 = [centre[0] + 0.5 * (dest[0] - centre[0]), dest[1]];
        }else {
          p3 = [dest[0], centre[1] + 0.5 * (dest[1] - centre[1])];
        }

        json.routes.push({
          p1: centre,
          p2: p2,
          p3: p3,
          p4: dest,
        });
      }
    }
  });

  return json;
}

function generateColor(x, y) {
  const distance = Math.sqrt(Math.pow(x - 500, 2) + Math.pow(y - 500, 2));

  const distance2 = Math.sqrt(Math.pow(x - 650, 2) + Math.pow(y - 650, 2));

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

// Vérifie si segment [AB] coupe [CD]
// usage : checkIntercection([0,0], [0,0], [0,0], [0,0])
// TODO A test
function checkIntercection(A, B, C, D) {
  function subCheckIntercection(a, b, c) {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  }
  return (
    subCheckIntercection(A, C, D) != subCheckIntercection(B, C, D) &&
    subCheckIntercection(A, B, C) != subCheckIntercection(A, B, D)
  );
}

function isVertical(A, B) {
  return Math.abs(B[0]-A[0]) < Math.abs(B[1]-A[1])
}
