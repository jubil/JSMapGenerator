const NB_CASES = 1000;
let delimitationTuiles = 0;
let delimitationCentreTuiles = 0;

{
  // Declare the chart dimensions and margins.
  const width = 550;
  const height = 550;

  let json = generateJSON();
  json = generateVoronoi(json);

  console.log("data", json);

  let nodes = json.points.map((d) => ({ ...d }));

  const simulation = d3
    .forceSimulation(nodes)
    //.force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-50)) //.distanceMin(10).distanceMax(100))
    //.force("collide ", d3.forceCollide(10))
    .force("x", d3.forceX(500).strength(0.2))
    .force("y", d3.forceY(500).strength(0.2))
    
    //simulation.alphaDecay(0.0001)
    //simulation.velocityDecay(0.1)
  //simulation.stop();

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "0 0 1000 1000");

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5)


  node.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  /*simulation.on("tick", () => {
    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });*/

  // Drag & Drop
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  //
  container.append(svg.node());

  //
  function debug() {
    let delaunay = d3.Delaunay.from(nodes.map((p) => [p.x, p.y]));
    let voronoi = delaunay.voronoi([0, 0, 1000, 1000]);
    
    a = [];
    voronoi.cellPolygons().forEach((cell) => {
      a.push({
        id: cell.index,
        //color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        color: generateColor(cell[0][0], cell[0][1]),
        points: JSON.stringify(cell)
          .replaceAll("],[", " ")
          .replaceAll("[[", "")
          .replaceAll("]]", ""),
      });
    });

    document.getElementById("svg").innerHTML = "";
    const tuile = svg
      .append("g")
      //.attr("fill", "#0000FF")
      .selectAll("polygon")
      .data(a)
      .join("polygon")
      .attr("points", (polygon) => polygon.points)
      .attr("fill", (polygon) => polygon.color)
      .attr("stroke", (polygon) => polygon.color)
      .attr('stroke-width', delimitationTuiles)

    const node = svg
      .append("g")
      .attr("fill","red")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", delimitationCentreTuiles)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      //.attr("fill", (d) => color(d.group));

    setTimeout(() => {
      debug();
    }, 1);
  }
  debug();
}

function generateJSON() {
  let json = JSON.parse('{"points":[], "tuiles":[]}');
  for (let i = 0; i < NB_CASES; i++) {
    json.points.push({
      x: Math.floor(Math.random() * 900 + 50),
      y: Math.floor(Math.random() * 900 + 50),
    });
  }
  return json;
}

function generateVoronoi(json) {
  const delaunay = d3.Delaunay.from(json.points.map((p) => [p.x, p.y]));
  const voronoi = delaunay.voronoi([-10000, -10000, 10000, 10000]);

  json.tuiles = [];
  voronoi.cellPolygons().forEach((cell) => {
    json.tuiles.push({
      id: cell.index,
      points: JSON.stringify(cell)
        .replaceAll("],[", " ")
        .replaceAll("[[", "")
        .replaceAll("]]", ""),
    });
  });
  return json;
}

function generateColor(x, y){
  const distance = Math.sqrt(Math.pow(x - 500, 2) + Math.pow(y - 500, 2))

  const distance2 = Math.sqrt(Math.pow(x - 650, 2) + Math.pow(y - 650, 2))
  
  if(distance2 < 50){
    return "#5555FF"
  }
  if(distance2 < 75){
    return "yellow"
  }
  if(distance < 30){
    return "#fff"
  }
  if(distance < 75){
    return "#ddd"
  }
  if(distance < 200 && y > 500){
    return "#008800"
  }
  if(distance < 200 && y <= 500 && x > 500){
    return "yellow"
  }
  if(distance < 120 && y <= 500 && x <= 500){
    return "orange"
  }
  if(distance > 120 && distance < 200 && y <= 500 && x <= 500){
    return "lime"
  }
  /*if(x > 200 && x < 800 && y > 200 && y < 800){
    return "#00cc00"
  }*/
  if(distance < 400){
    return "#00cc00"
  }
  if(distance < 450 && distance > 400){
    return "yellow"
    //return "#5555FF"
  }
  else {
    return "#5555FF"
  }
}


function delimitations(size) {
  if(delimitationTuiles > 0){
    delimitationTuiles = 0
  }else {
    delimitationTuiles += size;
  }
}

function centres() {
  if(delimitationCentreTuiles > 4){
    delimitationCentreTuiles = 0
  }else {
    delimitationCentreTuiles+=3;
  }
}