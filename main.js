/*json = {
    "points": [
        { "x": 0, "y": 0 },
        { "x": 0, "y": 100 },
        { "x": 100, "y": 0 },
        { "x": 100, "y": 100 },
        { "x": 50, "y": 50 }
    ],
    "edges": [
        {
            "path": [
                { "x": 50, "y": 50 },
                { "x": 60, "y": 60 },
                { "x": 87, "y": 58 },
                { "x": 98, "y": 86 },
                { "x": 100, "y": 100 }
            ]
        }
    ],
    "polygon": [
        {
            //"id": "TODO id",
            //"metadata": "TODO metadata",
            "points": "50,50 25,25 10,20, 40,10"
        }
    ]
}*/

function loadGraph(json) {
    console.log("DEBUG JSON", json)

    json.points.forEach(p => {
        let node = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        node.setAttribute("cx", p.x)
        node.setAttribute("cy", p.y)
        node.setAttribute("r", 2)
        document.getElementById("graph-points").appendChild(node)
    })

    json.edges.forEach(e => {
        let edge = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        let path = "M" + e.path[0].x + "," + e.path[0].y + " ";
        e.path.slice(1).forEach(p => {
            path += "L" + p.x + "," + p.y + " ";
        })
        edge.setAttribute("d", path);
        document.getElementById("graph-edges").appendChild(edge)
    })
    json.polygon.forEach(p => {
        let tile = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        tile.setAttribute("points", p.points)
        //tile.setAttribute("stroke", "#F55")
        tile.setAttribute("fill", "#" + Math.floor(Math.random() * 16777215).toString(16))
        document.getElementById("graph-tiles").appendChild(tile)

    })

}

function generateJsonRandom() {
    json = JSON.parse("{}")
    //json.points = [{x:10, y: 25}]
    //json.edges = [{path:[{x:10, y: 25}, {x:10, y: 30}, {x:20, y: 25}]}]
    //json.polygon = [{points:"50,50 25,25 10,20, 40,10"}]

    json.points = []
    json.edges = []
    json.polygon = []

    for (let i = 0; i < 1000; i++) {
        json.points.push({x:Math.floor(Math.random() * 500 + 250),y:Math.floor(Math.random() * 500 + 250)})
    }
    
    //console.log("points", json.points.map(p => [p.x, p.y]))
    //const delaunay = d3.Delaunay.from([[0, 0], [0, 100], [100, 0], [100, 100]]);
    
    const delaunay = d3.Delaunay.from(json.points.map(p => [p.x, p.y]));
    //console.log("delaunay", delaunay)
    //const voronoi = delaunay.voronoi([-10000, -10000, 10000, 10000]);
    const voronoi = delaunay.voronoi([100, 100, 900, 900]);
    //console.log("voronoi", voronoi)
    
    console.log("voronoi cells", voronoi.cellPolygons())
    voronoi.cellPolygons().forEach(cell => {
        json.polygon.push({"points": JSON.stringify(cell)
        .replaceAll("],[", " ")
        .replaceAll("[[", "")
        .replaceAll("]]", "")})
    })
    return json
}