json = {
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
        },
    ]
}

function loadGraph() {
    console.log("DEBUG JSON", json)

    json.points.forEach(p => {
        let node = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        node.setAttribute("cx", p.x)
        node.setAttribute("cy", p.y)
        node.setAttribute("r", 2)
        document.getElementById("graph-big-points").appendChild(node)
    })

    json.edges.forEach(e => {
        // TODO Path
        let edge = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        let path = "M" + e.path[0].x + "," + e.path[0].y + " ";
        e.path.slice(1).forEach(p => {
            path += "L" + p.x +"," + p.y + " ";
        })
        edge.setAttribute("d", path);

        // 
        e.path.slice(1, e.path.length - 1).forEach(p => {
            let edgeNode = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            edgeNode.setAttribute("cx", p.x)
            edgeNode.setAttribute("cy", p.y)
            edgeNode.setAttribute("r", 1)
            document.getElementById("graph-small-points").appendChild(edgeNode)
        })


        document.getElementById("edge").appendChild(edge)
    })

}