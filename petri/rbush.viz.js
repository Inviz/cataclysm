var W = 1500,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

if (window.devicePixelRatio > 1) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width = canvas.width * 2;
    canvas.height = canvas.height * 2;
}

function randBox(size) {
    var x = Math.random() * (W - size),
        y = Math.random() * (W - size);
    return {
        minX: x,
        minY: y,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random()
    };
}

function randClusterPoint(dist) {
    var x = dist + Math.random() * (W - dist * 2),
        y = dist + Math.random() * (W - dist * 2);
    return {x: x, y: y};
}

function randClusterBox(cluster, dist, size) {
    var x = cluster.x - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3,
        y = cluster.y - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3;

    return {
        minX: x,
        minY: y,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random(),
        item: true
    };
}

var colors = ['#f40', '#0b0', '#37f'],
    rects;

function drawTree(node, level) {
    if (!node) { return; }

    var rect = [];

    rect.push(level ? colors[(node.height - 1) % colors.length] : 'grey');
    rect.push(level ? 1 / Math.pow(level, 1.1) : 0.2);

    if (node.hull) {
      if (false && node.height == 1) {
        rect[1] = 0.5
        rect.push(node.hull)
        hulls.push(rect);
      }
    } else if (node.points && node.parent && node.parent.leaf) {
      rect.push(node.building.points)
      polys.push(rect);
    } else {
      rect.push([
          Math.round(node.minX),
          Math.round(node.minY),
          Math.round(node.maxX - node.minX),
          Math.round(node.maxY - node.minY)
      ]);
      rects.unshift(rect);
    }
    if (level == 4)
    
      for (var hash in node.connections) {
        var n = parseInt(hash)
        var a = n % 100000000
        var b = (n - a) / 100000000
        lines.push([rect[0], 2, [
          tree.coordinates[a],
          tree.coordinates[b]
          ]])
      }

    //if (node.districtConnections)
    //  for (var i = 0; i < node.districtConnections.length; i += 3) {
    //    var hash = node.districtConnections[i + 2]
    //    var n = parseInt(hash)
    //    var a = n % 100000000
    //    var b = (n - a) / 100000000
    //    if (!tree.coordinates[a] || !tree.coordinates[b])
    //      continue
    //    tree.districtConnections = (tree.districtConnections || 0 ) + 1 
    //    lines.push(['grey', 5, [
    //      tree.coordinates[a],
    //      tree.coordinates[b]
    //      ]])
    //  }
    if (level == 0) {
      tree.union.forEach(function(polygon) {
        var skeleton = polygon.properties.skeleton
        skeleton.spokes.forEach(function(line) {
          lines.push(['green', 2, [
                      {x: line.start[0], y: line.start[1]},
                      {x: line.end[0], y: line.end[1]}
                      ]])
        })
        //polygon.properties.bones.forEach(function(line) {
        //  dots.push(['green', 5, [
        //              {x: line[0], y: line[1]},
        //              {x: line[0], y: line[1]}
        //              ]])
        //})
        if (false) polygon.properties.backbone.forEach(function(line, index) {
          lines.push(['red', 1, [
              {x: line[0][0], y: line[0][1]},
              {x: line[1][0], y: line[1][1]}
            ]])
        })
        if (false) polygon.properties.spines.forEach(function(line, index) {
          dots.push(['green', 2, [
                      {x: line[0], y: line[1]},
                      {x: line[0], y: line[1]}
                      ]])
        })
        if (false) polygon.properties.paddingPoints.forEach(function(polyline) {
          polyline.forEach(function(line, index) {

          //  if (index > 0)
          //  lines.push(['red', 1, [
          //      {x: line[0], y: line[1]},
          //      {x: polyline[index - 1][0], y: polyline[index - 1][1]}
          //    ]])
          
          var x2 = line[0] + Math.cos(line[3]) * 10
          var y2 = line[1] + Math.sin(line[3]) * 10

          lines.push(['green', 2, [
                      {x: line[0], y: line[1]},
                      {x: x2, y: y2}
                      ]])
          })
        })
        if (false) polygon.properties.marginPoints.forEach(function(polyline) {
          polyline.forEach(function(line, index) {

          //if (index > 0)
          //  lines.push(['red', 1, [
          //      {x: line[0], y: line[1]},
          //      {x: polyline[index - 1][0], y: polyline[index - 1][1]}
          //    ]])
          var x2 = line[0] + Math.cos(line[3]) * 5
          var y2 = line[1] + Math.sin(line[3]) * 5
          lines.push(['blue', 3, [
                      {x: line[0], y: line[1]},
                      {x: x2, y: y2}
                      ]])
          dots.push(['black', 2, [
                      {x: x2, y: y2},
                      {x: x2, y: y2}
                      ]])
          })
        })
      })
      if (tree.somePaths)
      tree.somePaths.forEach(function(path) {

        path.forEach(function(step, index) {
          if (index > 0)
          lines.push(['blue', 5, [
            path[index - 1],
            step
            ]])
        })
      })
      if (tree.someFails)
      tree.someFails.forEach(function(path) {

        path.forEach(function(step, index) {
          if (index > 0)
          lines.push(['red', 20, [
            path[index - 1],
            step
            ]])
        })
      })
      if (tree.things) {
      }
      //for (var hash in tree.districtNetwork) {
      //  var n = parseInt(tree.districtNetwork[hash])
      //  var a = n % 100000000
      //  var b = (n - a) / 100000000
      //  lines.push(['purple', 3, [
      //    tree.coordinates[a],
      //    tree.coordinates[b]
      //    ]])
      //}
      
      //for (var hash in tree.districtNetwork) {
      //  var n = parseInt(hash)
      //  var a = n % 100000000
      //  var b = (n - a) / 100000000
      //  if (!tree.coordinates[a] || !tree.coordinates[b])
      //    continue
      //  lines.push([rect[0], 1, [
      //    tree.coordinates[a],
      //    tree.coordinates[b]
      //    ]])
      //}
      if (tree.someDots)
      tree.someDots.forEach(function(hash) {
      
        dots.push(['red', 1, [
          tree.coordinates[hash],
          tree.coordinates[hash]
          ]])
      })

      for (var hash in tree.districtHubs) {
        dots.push([rect[0], 1, [
          tree.coordinates[hash],
          tree.coordinates[hash]
          ]])
      }
      
      //for (var hash in tree.connections) {
      //  var n = parseInt(hash)
      //  var a = n % 100000000
      //  var b = (n - a) / 100000000
      //  lines.push([rect[0], 3, [
      //    tree.coordinates[a],
      //    tree.coordinates[b]
      //    ]])
      //}
      //for (var i = 0; i < node.network.length; i++) {
      //  lines.push(rect.slice(0, 1).concat([6,  node.network[i]]))
      //}
    }


    if (!node.children) return;
    if (level === 6) { return; }

    for (var i = 0; i < node.children.length; i++) {
        drawTree(node.children[i], level + 1);
    }
}

function draw() {
    rects = [];
    polys = [];
    hulls = [];
    lines = [];
    dots = [];
    var scale = function(p) {
      return {
        x: (p.x) * zoom,
        y: (p.y) * zoom
      }
    }

    Game.World.eachRoad(function(index) {
      var poly = this.computeRoadPolygon(index)
      var p = ['black', 3, poly.map(scale)]
      polys.push(p)
    })
    Game.World.eachBuilding(function(index) {
       var poly = this.computeBuildingPolygon(index)
       poly.forEach(function(step, index) {
         lines.push(['grey', 3, [
           scale(poly[index - 1] || poly[poly.length - 1]),
           scale(step)
           ]])
       })
    })

    Game.World.eachFurniture(function(index) {
       var poly = this.computeFurniturePolygon(index)
       debugger
       poly.forEach(function(step, index) {
         lines.push([(this.getFurnitureAnchor(index) & Game.ANCHORS.INWARDS) ? 'blue' : 'green', 3, [
           scale(poly[index - 1] || poly[poly.length - 1]),
           scale(step)
           ]])
       }, this)
    })

    //drawTree(tree.data, 0);

    ctx.clearRect(0, 0, W + 1, W + 1);

    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        ctx.globalAlpha = rects[i][1];
        ctx.strokeRect.apply(ctx, rects[i][2].map(function(p) {
          return p * window.devicePixelRatio
        }));
    }
    for (var i = polys.length - 1; i >= 0; i--) {
      ctx.beginPath();
        ctx.fillStyle = 'grey'
        ctx.globalAlpha = 0.1;
      ctx.moveTo(polys[i][2][0].x * window.devicePixelRatio, polys[i][2][0].y * window.devicePixelRatio);
      ctx.lineTo(polys[i][2][1].x * window.devicePixelRatio, polys[i][2][1].y * window.devicePixelRatio);
      ctx.lineTo(polys[i][2][2].x * window.devicePixelRatio, polys[i][2][2].y * window.devicePixelRatio);
      ctx.lineTo(polys[i][2][3].x * window.devicePixelRatio, polys[i][2][3].y * window.devicePixelRatio);
      ctx.closePath()
      ctx.fill()
    }
    var r = 0;
    for (var i = hulls.length - 1; i >= 0; i--) {
      ctx.beginPath();
        ctx.strokeStyle = hulls[i][0]
        ctx.globalAlpha = 0.7
        ctx.lineWidth = 2
      ctx.moveTo(hulls[i][2][0].x * window.devicePixelRatio, hulls[i][2][0].y * window.devicePixelRatio);
      for (var p = 0; p < hulls[i][2].length; p++) {
        var pp = p ? p - 1 : hulls[i][2].length - 1;
        ctx.lineTo(hulls[i][2][p].x * window.devicePixelRatio, hulls[i][2][p].y * window.devicePixelRatio);
      }
      ctx.closePath()
      ctx.stroke()
    }

    for (var i = lines.length - 1; i >= 0; i--) {
      ctx.beginPath();
        ctx.strokeStyle = lines[i][0]
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = lines[i][1];
      ctx.moveTo(lines[i][2][0].x * window.devicePixelRatio , lines[i][2][0].y * window.devicePixelRatio);
      ctx.lineTo(lines[i][2][1].x * window.devicePixelRatio,  lines[i][2][1].y * window.devicePixelRatio);
      ctx.stroke()
    }
    for (var i = dots.length - 1; i >= 0; i--) {
      ctx.beginPath();
        ctx.strokeStyle = dots[i][0]
        ctx.globalAlpha = 1;
        ctx.lineWidth = dots[i][1]
      ctx.moveTo(dots[i][2][0].x * window.devicePixelRatio - dots[i][1] / 2 , dots[i][2][0].y * window.devicePixelRatio) - dots[i][1] / 2;
      ctx.lineTo(dots[i][2][1].x * window.devicePixelRatio + dots[i][1] / 2,  dots[i][2][1].y * window.devicePixelRatio) + dots[i][1] / 2;
      ctx.stroke()
    }
}

var times = 0;
var interval = setInterval(function() {
  times ++;
  //draw();
  if (times > 20)
    clearInterval(interval)
}, 1000)

function search(e) {
    console.time('1 pixel search');
    tree.search({
        minX: e.clientX,
        minY: e.clientY,
        maxX: e.clientX + 1,
        maxY: e.clientY + 1
    });
    console.timeEnd('1 pixel search');
}

function remove() {
    data.sort(tree.compareMinX);
    console.time('remove 10000');
    for (var i = 0; i < 10000; i++) {
        tree.remove(data[i]);
    }
    console.timeEnd('remove 10000');

    data.splice(0, 10000);

    draw();
};
