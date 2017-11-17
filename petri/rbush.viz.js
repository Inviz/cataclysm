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
      polys.push([rect]);
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
          if (index)
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
      /*var angle = 90;
      ctx.beginPath();
      ctx.strokeStyle = 'red'
        ctx.lineWidth = 2
      ctx.moveTo(1500, 1500)
      ctx.lineTo(1500 + Math.cos(angle * (Math.PI / 180)) * 500, 1500 + Math.sin(angle * (Math.PI / 180)) * 500)
      
      ctx.stroke()
      ctx.beginPath();
      ctx.strokeStyle = 'blue'
      ctx.moveTo(1510, 1500)
      ctx.lineTo(1510 + Math.cos(angle * (Math.PI / 180)) * 400, 1500 + Math.sin(angle * (Math.PI / 180)) * 400)
      ctx.stroke()*/
    rects = [];
    polys = [];
    hulls = [];
    lines = [];
    dots = [];
    var scale = function(p) {
      if (p[0] != null)
        return {
          x: (p[0] - minX) * zoom,
          y: (p[1] - minY) * zoom
        }
      return {
        x: (p.x - minX) * zoom,
        y: (p.y - minY) * zoom
      }
    }

    Game.World.eachRoad(function(index) {
      var poly = this.computeRoadOuterPolygon(index)
      var p = ['black', 3, poly.map(scale)]
      if (index > times && times)
        return
      var noise = this.getRoadPopulation(index)
      var color = 'rgb(0, ' + Math.floor((noise) * 255) + ',0)'
      dots.push(['black', 2, [
                  scale({x: this.getRoadEx(index), y: this.getRoadEy(index)}),
                  scale({x: this.getRoadEx(index), y: this.getRoadEy(index)})
                  ]])
      //dots.push([color, 5, [
      //            scale({x: this.getRoadX(index), y: this.getRoadY(index)}),
      //            scale({x: this.getRoadX(index), y: this.getRoadY(index)})
      //            ]])
      //polys.push(p)
          if (poly.marginPoints)
            poly.marginPoints[0].forEach(function(line) {
              var x2 = line[0] + Math.cos(line[3]) * 5
              var y2 = line[1] + Math.sin(line[3]) * 5
              //lines.push(['blue', 3, [
              //            scale({x: line[0], y: line[1]}),
              //            scale({x: x2, y: y2})
              //            ]])
              //dots.push(['black', 2, [
              //            scale({x: x2, y: y2}),
              //            scale({x: x2, y: y2})
              //            ]])
            })
    })
    //Game.World.allOriginalPoints.forEach(function(line) {
    //  line.forEach(function(point) {
    //    dots.push(['black', 6, [
    //                scale(point),
    //                scale(point)
    //                ]])
    //  });
    //})
    Game.World.eachBuilding(function(b) {
       var pslg = this.computeBuildingPSLG(b)
       var network = this.computeBuildingNavigationNetwork(b)
       pslg.edges.forEach(function(edge, index) {
         var p1 = pslg.points[edge[0]]
         var p2 = pslg.points[edge[1]];
         lines.push([pslg.points.length % 4 ? 'red' : 'grey', 3, [
           scale(pslg.points[edge[0]]),
           scale(pslg.points[edge[1]])
           ]])
       }, this)
    })
    //Game.World.eachRoom(function(r) {
    //   var poly = this.computeRoomPolygon(r)
    //   poly.forEach(function(step, index) {
    //     lines.push([this.getRoomNumber(r) ? 'red' : 'grey', 3, [
    //       scale(poly[index - 1] || poly[poly.length - 1]),
    //       scale(step)
    //       ]])
    //   }, this)
    //})
    var blocks = [];
    var sidewalks = [];
    polys.push(['black', 3, Game.World.Road.network.map(function(poly, index) {

       return poly.map(scale)
    })])
    

    Game.World.eachBlock(function(block) {
      var p = this.computeBlockInnerPolygon(block);
      if (p.length) {
        //if (this.getBlockLoop(block)) {
        //  this.computeBlockInnerPolygon(block)[0].paddingPoints[0].forEach(function(point) {
        //      var x2 = point[0] + Math.cos(point[3]) * 500
        //      var y2 = point[1] + Math.sin(point[3]) * 500
        //    lines.push(['red', 5, [
        //      scale(point),
        //      scale([x2, y2])
        //      ]])
        //  })
        //}
        sidewalks.push.apply(sidewalks, p.map(function(l) {return l.map(scale)})) 
      }
    })

    sidewalks.forEach(function(poly) {
       hulls.push(['lightgrey', 3, poly.map(scale)])
    })

   Game.World.eachFurniture(function(f) {
      var poly = this.computeFurniturePolygon(f)
      poly.forEach(function(step, index) {
        lines.push([(this.getFurnitureAnchor(f) & Game.ANCHORS.INWARDS) ? 'blue' : 'green', 3, [
          scale(poly[index - 1] || poly[poly.length - 1]),
          scale(step)
          ]])
      }, this)
   })

  // hulls.push(['lightgrey', 2, Game.World.Road.networkPadding.map(scale)])
    //drawTree(tree.data, 0);
    //sidewalks.push.apply(sidewalks, Game.World.allPoints.map(function(pp) {
    //  return pp.map(scale)
    //}))
    if ( Game.World.allLines)
    Game.World.allLines.forEach(function(loop) {
      lines.push(['green', 3, [
        scale(loop[0]),
        scale(loop[1])
        ]])
    }, this)
    if (Game.World.allVoronoi)
    Game.World.allVoronoi.forEach(function(loop) {
      hulls.push(['lightgrey', 2, loop.map(scale)])
    })
  if (Game.World.allPoints)
     Game.World.allPoints.forEach(function(loop) {
 
    hulls.push(['lightgrey', 2, loop.map(scale)])
     })
    for (var i = dots.length - 1; i >= 0; i--) {
      ctx.beginPath();
        ctx.strokeStyle = dots[i][0]
        ctx.globalAlpha = 1;
        ctx.lineWidth = dots[i][1]
      ctx.moveTo(dots[i][2][0].x * window.devicePixelRatio - dots[i][1] / 2 , dots[i][2][0].y * window.devicePixelRatio) - dots[i][1] / 2;
      ctx.lineTo(dots[i][2][1].x * window.devicePixelRatio + dots[i][1] / 2,  dots[i][2][1].y * window.devicePixelRatio) + dots[i][1] / 2;
      ctx.stroke()
    }
    if (times > 1) return;
    if (location.search.indexOf('heatmap') > -1) {
    for (var x = minX; x < maxX; x += 2000)
      for (var y = minY; y < maxY; y += 2000) {
        var p = scale([x, y])
        var noise = Game.World.computeTripleNoise(x, y);
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.moveTo(p.x * window.devicePixelRatio, p.y * window.devicePixelRatio)
        ctx.lineTo((p.x + 100) * window.devicePixelRatio, p.y * window.devicePixelRatio);
        ctx.lineTo((p.x + 100) * window.devicePixelRatio, (p.y + 100) * window.devicePixelRatio);
        ctx.lineTo(p.x * window.devicePixelRatio, (p.y + 100) * window.devicePixelRatio);
        ctx.closePath()
        ctx.fillStyle = 'rgb(0, ' + Math.floor((noise) * 255) + ',0)'
        ctx.fill()
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
    var r = 0;
    for (var i = hulls.length - 1; i >= 0; i--) {
      ctx.beginPath();
        ctx.strokeStyle = hulls[i][0]
        ctx.globalAlpha = 0.7
        ctx.lineWidth = 1
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


    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        ctx.globalAlpha = rects[i][1];
        ctx.strokeRect.apply(ctx, rects[i][2].map(function(p) {
          return p * window.devicePixelRatio
        }));
    }
    for (var i = polys.length - 1; i >= 0; i--) {
      var poly = polys[i][2];
      ctx.beginPath();
        ctx.fillStyle = 'grey'
        ctx.globalAlpha = 0.1;
      for (var j = 0; j < poly.length; j++) {
        ctx.moveTo(poly[j][0].x * window.devicePixelRatio, poly[j][0].y * window.devicePixelRatio);
        for (var p = 0; p < poly[j].length; p++) {
          var pp = p ? p - 1 : poly[j].length - 1;
          ctx.lineTo(poly[j][p].x * window.devicePixelRatio, poly[j][p].y * window.devicePixelRatio);
        }      
      }

      ctx.closePath()
      ctx.fill()
    }
    for (var i = sidewalks.length - 1; i >= 0; i--) {
      var poly = sidewalks[i];
      ctx.beginPath();
        ctx.fillStyle = 'green'
        ctx.globalAlpha = 0.05;
      ctx.moveTo(poly[0].x * window.devicePixelRatio, poly[0].y * window.devicePixelRatio);
      for (var j = 0; j < poly.length; j++) {
          ctx.lineTo(poly[j].x * window.devicePixelRatio, poly[j].y * window.devicePixelRatio);
      }

      ctx.closePath()
      ctx.fill()
    }
}

var times = 0;
var interval = setInterval(function() {
  times ++;
  //draw();
  if (times > 50)
    clearInterval(interval)
}, 300)

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
