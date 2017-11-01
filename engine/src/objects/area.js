// Base class for all kinds of locations
// Areas and zones are not present in the scene itself,
// instead they provide lists of mesh instances to render 
// (walls, people, floors, labels, overlays, sprites)

P.Area = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Area))
    return new P.Area(properties);

  this.people = []
  this.labels = []
  this.pins = []
  
  this.workplaces = []
  this.coordinates = {x: 0, y: 0, z: 0}
  
  P.Object.call(this, properties)

  this.floors = []
  this.walls = []
  this.furniture = []
  this.zones = []
  this.centering = {};

  this.currentPosition = new THREE.Vector3;
  // OLD stuff: Import from svg paths
  if (this.polygon) {
    this.setPolygon(this.polygon)
  } else {
    this.generateFloorHull()
  }

  if (!this.labelType)
    this.labelType = P.Label.Area;

  this.setLabel()
  if (this.name == 'area')
    this.label.important = true;

  this.updateCurrentPosition();

  if (!this.title)
    this.title = ''
  return this
}

P.Area.byId = function(id, source) {
  if (source == null)
    source = P.areas;
  for (var i = 0; i < source.length; i++)
    if (source[i].id === id)
      return source[i];
}

P.Area.prototype = new P.Object;

P.Area.prototype.getX = function(includeShift) {
  return this.offset.x + (includeShift === false ? 0 : this.shift.x)
};
P.Area.prototype.getY = function(includeShift) {
  return this.offset.y + (includeShift === false ? 0 : this.shift.y)
};
P.Area.prototype.getZ = function(includeShift) {
  return this.offset.z + (includeShift === false ? 0 : this.shift.z)
};
P.Area.prototype.updateCurrentPosition = function() {
  this.currentPosition.set(this.getTotalX(), this.getTotalY(), this.getTotalZ())
  if (this.zones)
    for (var i = 0; i < this.zones.length; i++)
      this.zones[i].updateCurrentPosition();
  P.Sprite.instances.changes           |= P.UPDATE_OFFSET;
  P.Floor.instances.changes            |= P.UPDATE_OFFSET;
  P.Overlay.instances.changes          |= P.UPDATE_OFFSET;
  P.Underlay.instances.changes         |= P.UPDATE_OFFSET;
  P.Background.instances.changes       |= P.UPDATE_OFFSET;
  P.Background.instances.front.changes |= P.UPDATE_OFFSET;

  P.Person.instances.changes           |= P.UPDATE_PARENT;
  P.Wall.instances.changes             |= P.UPDATE_PARENT;
  P.Furniture.instances.changes        |= P.UPDATE_PARENT;
  P.Panel.instances.changes            |= P.UPDATE_PARENT;
  P.Label.instances.changes            |= P.UPDATE_PARENT;
  P.Company.instances.changes          |= P.UPDATE_PARENT;

  P.Pin.changes                        |= P.UPDATE_PARENT;
}

P.Area.prototype.name = 'area';

P.Area.createNew = function() {

  var name = prompt('Enter name for new area (example: PMQ 7F)')
  if (!name) {
    return
  }
  var maxZ = 0;
  P.areas.forEach(function(other) {
    maxZ = Math.max(other.coordinates.z, maxZ)
  })

  var label = P.pointer._label || P.pointer.label;
  var area = new P.Area({
    title: name,
    coordinates: {
      x: 0,
      y: 0,
      z: maxZ + 1
    },
    minWidth: 300,
    minHeight: 300,
    location: P.pointer.location || (label && label.area && label.area.location) || P.locations[0]
  })

  area.location.areas.push(area)

  P.areas.push(area)
  return area
}

// current method that works with polygon
P.Area.prototype.setPolygon = function(points, temp) {
  var clockwise = P.geometry.polygonArea(points.map(function(point) {
    return {x: point[0], y: point[1]}
  }, this)) > 0;
  if (clockwise) {
    points = points.reverse()
  } 
  //P.geometry.sortPolygon(points)
  this.hull = points.map(function(point) {
    point[0] = P.Wall.atGrid(point[0])
    point[1] = P.Wall.atGrid(point[1])
    return point
  });
  this.computeBox(this.hull || [])
  if (!this.coordinates) {
    this.coordinates = this.box.min
  }
  this.setFloorsFromPolygon(points)
  this.updatePolygon(temp)
}

P.Area.prototype.updatePolygon = function() {
  this.hullPoints = [];
  if (this.hull)
    for (var i = 0; i < this.hull.length; i++) {
      this.hullPoints.push({x: this.hull[i][0], y: this.hull[i][1]})
    }
}


P.Area.prototype.getPeople = function() {
  return this.people
}
P.Area.prototype.setLabel = function() {
  var label = this.getLabel(this.labelType)
  label[this.name] = this;
  this.labels = [label]
  if (this.name === 'area') {
    var stats = this.getPanel(P.Panel.Stats);
    var loc = this.getPanel(P.Panel.Location)
    this.panels = [stats, loc]
    this.panels.stats = stats;
    this.panels.loc = loc;
  }
}

P.Area.prototype.getLabel = function(callback, area, zone) {
  if (this.label)
    return this.label;
  var object = {};
  object[this.name] = this;
  return this.label = callback(object);
}
P.Area.prototype.getPanel = function(callback, area, zone) {
  var object = {};
  object[this.name] = this;
  return this.panel = callback(object);
}

P.Area.getPolygon = function(points) {
  var polygon = points.map(function(point) {
    return [parseFloat(point.x.toFixed(4)), parseFloat(point.y.toFixed(2))]
  });

  polygon.push(polygon[0])

  return polygon;
}
P.Area.prototype.cleanup = function() {
  if (this.zones)
    this.zones.forEach(function(zone) {
      if (zone.label)
        zone.label.onDisappear();
    })
}
P.Area.prototype.import = function(area) {
  this.cleanup();
  this.walls = [];
  this.furniture = [];
  
  //this.coordinates = area.coordinates;
  this.title = area.title;
  this.tagline = area.tagline;
  if (area.minHeight)
    this.minHeight = area.minHeight
  if (area.minWidth)
    this.minWidth = area.minWidth
  if (area.id != null)
    this.id = area.id;
  if (area.workplaces)
    this.workplaces = area.workplaces;

  //this.position.set(
  //  0,
  //  0,
  //  0
  //)
  for (var i = 0, j = area.walls.length; i < j; i++) {
    var points = area.walls[i];
    for (var k = 3, l = points.length; k < l; k += 2) {
      var wall = new P.Wall({
        type: P.Wall.types[points[0]],
        v1: {x:points[k - 2], y: points[k - 1]},
        v2: {x:points[k], y: points[k + 1]},
        area: this
      })
      wall.setEnd(points[k], points[k + 1])
      this.walls.push(wall)
    }
  }
  if (area.furniture) {
    for (var i = 0, j = area.furniture.length; i < j; i++) {
      var points = area.furniture[i];
      for (var k = 4, l = points.length; k < l; k += 2) {
        var attributes = points[1] || {}
        var wall = new P.Wall({
          type: P.Wall.types[points[0]],
          frozenRatio: attributes.ratio,
          frozenSize: attributes.size,
          lastFlip: attributes.flip,
          lastAngle: attributes.angle,
          variation: attributes.variation,
          v1: {x:points[k - 2], y: points[k - 1]},
          v2: {x:points[k], y: points[k + 1]},
          area: this
        })
        wall.setEnd(points[k], points[k + 1])
        wall.toFurniture();
        wall.computeFurniture()
      }
    }
  }
  if (area.zones) {
    this.zones = area.zones.map(function(options, i) {

      var zone = new P.Zone({
        renderIndex: i,
        title: options.title,
        coordinates: options.coordinates,
        observed: options.observed ? true : false,
        polygon: options.polygon,
        area: this,
        zone_type: options.zone_type,
        hull: options.polygon,
        id: options.id,
        company_owner_id: options.company_owner_id,
        display_label: options.display_label,
        show_label: options.show_label
      });
      
      return zone;    
    }, this)

    this.zones = this.zones.sort(function(a, b) {
      return (a.coordinates.y - b.coordinates.y)
    })
  }
  if (area.polygon) {
    this.setPolygon(area.polygon)
  } else {
    this.generateFloorHull()
    this.computeBox(this.hull || [])
  }
  this.sortWalls()

  this.lines = area.lines || []
  this.lines.forEach(function(line) {
    line.area = this
  }, this)
  //this.computeAreaBox();

  return this;
};

P.Area.hull = require('concaveman');


P.Area.prototype.capLines = function(lines, Start, End) {


  this.capping = {lines: {}, points: {}, windows: {}};
  var snap = location.search.match(/snap=(\d+.*\d*)/)
  if (snap)
    snap = parseFloat(snap[1])
  else
    snap = 1;
  var getLineDegree = function(a, b, min, max) {
    var dAx = a[End].x - a[Start].x;
    var dAy = a[End].y - a[Start].y;
    var dBx = b[End].x - b[Start].x;
    var dBy = b[End].y - b[Start].y;
    var angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
    if(angle < 0) {angle = angle * -1;}
    var degrees = angle * (180 / Math.PI);
    if (degrees > 180)
      degrees -= 180
    if (min != null && min > degrees)
      return
    if (max != null && max < degrees)
      return
    return degrees
  }


  lines.slice().reverse().forEach(function(line) {
    line[Start].line = line;
    line[End].line = line;
    line.capStart = line.capEnd = null;
    line.isWindowed = line.isWalled = null;
    line.cornerStart = line.cornerEnd = null;


    var posX = this.coordinates.y
    var posY = this.coordinates.z
    var posZ = this.coordinates.x
    var l = Math.round((line[Start].x) / snap) + 'x' + Math.round((line[Start].y) / snap) + 'x' + posY
    var r = Math.round((line[End].x) / snap) + 'x' + Math.round((line[End].y) / snap) + 'x' + posY
    if (l > r) {
      var key = r + ' ' + l;
    } else {
      var key = l + ' ' + r;
    }
    var index = line.index;
    var other = this.capping.lines[key];
    if (other && other != line) {
      if (line.type.isGlass && !(line.type.isWindow && other.isWindowed)) {
        if (line.type.isWindow && !other.type.isGlass ) {
          line.isWalled = other;
          other.isWindowed = line;
        }
      } else {
        if (other.type.isWindow && !other.isWalled && !line.type.isWindow) {
          other.isWalled = line;
          line.isWindowed = other;
        }
      }
    }
    line.l = l;
    line.r = r;

    this.capping.lines[key] = line;
    if (line.type.isGlass) {
      var glass = this.capping.windows[l] || this.capping.windows[r]
      if (glass && getLineDegree(line, glass.line, 30, 150)) {
        if (this.capping.windows[l] === glass) {
          line.cornerStart = 0;
          line.capStart = -1;
        }
        else {
          line.cornerEnd = 0;
          line.capEnd = 1;
        }
        if (glass.line[Start] === glass) {
          glass.line.cornerStart = 0;
        } else {
          glass.line.cornerEnd = 0;
        }
      }
      this.capping.windows[l] = line[Start]
      this.capping.windows[r] = line[End]
    } else {
      var glass = this.capping.windows[l] || this.capping.windows[r]
      if (glass && getLineDegree(line, glass.line, 30, 150)) {
        if (glass.line[Start] === glass) {
          if (glass.line.cornerStart !== 0)
            glass.line.cornerStart = 1;
        } else {
          if (glass.line.cornerEnd !== 0)
            glass.line.cornerEnd = 1;
        }
      }

    }


  }, this)

  lines = lines.filter(function(line) {
    // avoid overdrawing shared walls
    var l = Math.round((line[Start].x) / snap) + 'x' + Math.round((line[Start].y) / snap)
    var r = Math.round((line[End].x) / snap) + 'x' + Math.round((line[End].y) / snap)

    if (l > r) {
      var key = r + ' ' + l;
    } else {
      var key = l + ' ' + r;
    }
    
    var edgy = (!line.outside && line.edgy)

    var cornerEnd = line.cornerEnd;
    var cornerStart = line.cornerStart;
    // capping detects corners and tweaks line lengths to fill corners without intersection
    var start = this.capping.points[l]
    if (start && start.line) {
      if (getLineDegree(line, start.line, 30, 150) || cornerStart) {
        if (start.line[Start] === start)  {
          if (start.line.capStart !== 0 || cornerStart)
            start.line.capStart = -1;
        } else {
          if ((start.line.capEnd !== 0 || cornerStart) && !start.line.cornerEnd)
            start.line.capEnd = 1;
        }
        line.capStart = 1;
      } else if (start.line[Start] === start ? start.line.cornerStart : start.line.cornerEnd) { 
        line.capStart = -1;
      } else {
        if (start.line[Start] === start)  {
          start.line.capStart = 0;
        } else {
          start.line.capEnd = 0;
        }
        line.capStart = 0;
      }
    } else if (!edgy) {
      this.capping.points[l] = line[Start];
    }
    var end = this.capping.points[r]
    if (end && end.line) {
      if (getLineDegree(line, end.line, 30, 150) || cornerEnd) {
        line.capEnd = -1
        if (end.line[Start] === end) {
          if (end.line.capStart !== 0 || cornerEnd)
            end.line.capStart = -1;
        } else {
          if ((end.line.capEnd !== 0 || cornerEnd)) {
            if (end.line.cornerEnd) {
              line.capEnd = 1
              end.line.capEnd = -1;
            } else {
              end.line.capEnd = 1;
            }
          }
        }
      } else if (end.line[Start] === end ? end.line.cornerStart : end.line.cornerEnd) { 
        line.capEnd = 1;
      } else {
        if (end.line[Start] === end) {
          end.line.capStart = 0;
        } else {
          end.line.capEnd = 0;
        }

        line.capEnd = 0
      }
    } else if (!edgy) {
      this.capping.points[r] = line[End];
    }

    if (line.cornerStart)
      line.capStart = 1;
    if (line.cornerEnd)
      line.capEnd = -1;
    //if (line.clones && line.zone.title.indexOf('Storage') > -1)
    //  var color = new THREE.Color(0,1,1)


    return line
  }, this)

  lines.forEach(function(line) {
    if (line.isWindowed) {
      line.cornerStart = line.isWindowed.l == line.l ? line.isWindowed.cornerStart : line.isWindowed.cornerEnd
      line.cornerEnd = line.isWindowed.l == line.l ? line.isWindowed.cornerEnd : line.isWindowed.cornerStart
    }
  })

  return lines;
  

}


P.Area.intersectPolygon = function (point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point.x, y = point.y;

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i].x, yi = vs[i].y;
      var xj = vs[j].x, yj = vs[j].y;

      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }

  return inside;
};
// assign zones to walls, walls can be shared between walls

P.Area.prototype.onPropertyChange = function(context, property, value, old) {
  switch (property) {
    case 'onlyShowDoors':
      if ((old > 0.98) ^ (value > 0.98)) {
        var walls = this.walls;
        for (var i = 0; i < walls.length; i++)
          walls[i].changes |= P.UPDATE_RESET
        P.Wall.instances.changes |= P.UPDATE_CULLING
      }
      if ((old > 0.38) ^ (value > 0.38)) {
        var walls = this.walls;
        for (var i = 0; i < walls.length; i++)
          walls[i].changes |= P.UPDATE_OPACITY
      }
      break;

    case 'showAllZones':
      if ((old == 0) ^ (value == 0)) {
        P.Underlay.instances.changes |= P.UPDATE_CULLING
      }
      break;

    case 'wallHeight':
      P.Wall.instances.changes |= P.UPDATE_SCALE;
      P.Overlay.instances.changes |= P.UPDATE_OFFSET;
      break;

    case 'extrudeY':
      if ((old > 1) ^ (value > 1))
        P.Overlay.instances.changes |= P.UPDATE_RESET;
      P.Overlay.instances.changes |= P.UPDATE_ALIGNMENT;
      P.Overlay.instances.changes |= P.UPDATE_SCALE;
      break;

    case 'extrusionOpacity':
      P.Overlay.instances.changes |= P.UPDATE_OPACITY;
      break;
  }
}

// compute and triangulate hull polygon of walls
P.Area.prototype.generateFloorHull = function(points) {
  // add extra points along the line to get better hull contour
  if (points == null) {
    points =  P.Area.getPoints(this.walls)
  }

  if (points.length < 3)
    return
  var hull = P.Area.computeBoundingPolygon(points)

  // filter out points that lie on one line to reduce number of drawn polygons
  this.hull = hull.filter(function(point, index) {
    var prev = hull[index - 1];
    var next = hull[index + 1];
    if (prev == null || next == null)
      return true;

    var angle1 = Math.round(Math.atan2(point[1] - prev[1], point[0] - prev[0]) * 180 /Math.PI)
    var angle2 = Math.round(Math.atan2(next[1] - prev[1], next[0] - prev[0]) * 180 /Math.PI)

    return Math.abs(Math.abs(angle1) - Math.abs(angle2)) > 0
  }, this);

  if (this.hull.length > 1) {
    if (this.hull[0][0] === this.hull[this.hull.length - 1][0] &&
        this.hull[0][1] === this.hull[this.hull.length - 1][1]) {
      this.hull = this.hull.slice(0, this.hull.length - 1)
    }
  }

  return this.setFloorsFromPolygon(this.hull)
}

P.Area.highlightWalls = function(walls, color) {
  if (walls)
  for (var i = 0; i < walls.length; i++) {
    walls[i].highlightColor = color
  }
}
P.Area.highlightFloors = function(floors, color) {
  if (floors)
  for (var i = 0; i < floors.length; i++) {
    floors[i].highlightColor = color
  }
}

P.Area.highlightZone = function(zone, color, onlyFloors) {
  if (zone.highlights && !onlyFloors)
    P.Area.highlightWalls(zone.highlights)
  if (!onlyFloors)
    P.Area.highlightWalls(zone.walls, color)
  P.Area.highlightFloors(zone.underlays, color)
  P.Area.highlightFloors(zone.underlaysOffset, color)
  P.Area.highlightFloors(zone.floors, color)
  P.Area.highlightFloors(zone.extrusion, color)

  P.Wall.instances.changes |= P.Wall.instances.UPDATE_COLOR
  P.Overlay.instances.changes |= P.Wall.instances.UPDATE_RESET
  P.Underlay.instances.changes |= P.Wall.instances.UPDATE_RESET
  zone.highlights = zone.walls.slice();
  //zone.label.highlightColor = color
  //zone.label.visible = !!color || P.Scene.state != 'editor'
  return zone;
}

P.Area.prototype.computeBox = function(points, useImage) {
  if (points == null)
    points = P.Area.getPoints(this.walls, true)

  // compute bounding box
  var box = this.box = new THREE.Box2;
  this.contentBox = new THREE.Box2;
  var p = new THREE.Vector2;
  this.corner = new THREE.Vector2().set(Infinity, Infinity)
  for (var i = 0; i < points.length; i++) {
    p.set(P.Wall.atGrid(points[i][0]), P.Wall.atGrid(points[i][1]))
    this.contentBox.expandByPoint(p)
    var grid = 10;
    if (this.corner.y - p.y > grid || (Math.abs(p.y - this.corner.y) < grid && p.x < this.corner.x)) {
      this.corner.copy(p)
    }
  }
 

  if (isNaN(this.contentBox.min.y))
    debugger
  if (!isFinite(this.contentBox.min.y)) {
    this.contentBox.expandByPoint(p.set(0,0))
    if (!isFinite(box.min.y))
      this.box.expandByPoint(p.set(0,0))
  } else {
    this.box.expandByPoint(this.contentBox.min)
    this.box.expandByPoint(this.contentBox.max)
  }

  // compute and normalize offset
  this.height = box.max.y - box.min.y;
  this.width = box.max.x - box.min.x;
  box.height = box.max.y - box.min.y;
  box.width = box.max.x - box.min.x;
  if (box.min.x !== 0 || box.min.y !== 0) {
    if (this.name == 'area') {
      //this.expand()
      var updatedBox = box;
    }
  }
  this.center = box.getCenter()
  return updatedBox
}
P.Area.prototype.getPeople = function() {
  return this.people;
}
P.Area.prototype.expand = function() {
  var box = this.box;
  //this.coordinates.x = box.min.x;
  //this.coordinates.y = box.min.y;
  /*this.people.forEach(function(person) {
    person.location.x -= box.min.x
    person.location.y -= box.min.y

    person.x -= box.min.x
    person.y -= box.min.y
  })*/
  this.walls.forEach(function(wall) {
    wall.v1.x -= box.min.x
    wall.v2.x -= box.min.x
    wall.v1.y -= box.min.y
    wall.v2.y -= box.min.y
  })
  this.zones.forEach(function(zone) {
    zone.coordinates.x -= box.min.x
    zone.coordinates.y -= box.min.y
    for (var i = 0; i < zone.polygon.length; i++) {
      zone.polygon[i][0] -= box.min.x;
      zone.polygon[i][1] -= box.min.y;
    }
    zone.setPolygon(zone.polygon)
  })
  box.max.x -= box.min.x;
  box.max.y -= box.min.y;
  box.min.x = 0;
  box.min.y = 0;
}

P.Area.prototype.setTilesFromPolygon = function(points, offset, repair) {
  var floors = [];
  // triangulate hull
    var svgpath = P.geometry.convertPointsToPath(points)
    var path = P.Area.path(svgpath)


  var a = new THREE.Vector3;
  var b = new THREE.Vector3;
  var c = new THREE.Vector3;
  var shapes = path.toShapes(true);
  for (j = 0; j < shapes.length; ++j) {

    var shape = shapes[j];
    var mS = (new THREE.Matrix4()).identity();
    mS.elements[0] = -1;

    try {
      var geometry = new THREE.ShapeGeometry(shape)
    } catch(e) {
      continue;
    }

    this.shapes = shapes
    geometry.applyMatrix(mS);
    for ( var f = 0; f < geometry.faces.length; f ++ ) {
    
        var face = geometry.faces[ f ];
        var temp = face.a;
        face.a = face.c;
        face.c = temp;
    
    }
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
    for ( var f = 0; f < faceVertexUvs.length; f ++ ) {
    
        var temp = faceVertexUvs[ f ][ 0 ];
        faceVertexUvs[ f ][ 0 ] = faceVertexUvs[ f ][ 2 ];
        faceVertexUvs[ f ][ 2 ] = temp;
    
    }
    geometry.computeBoundingBox();

    if (!this.area || this.area === this) {
      var klass = P.Floor
    } else {
      var klass = P.Overlay
    }
    for (var k = 0, l = geometry.faces.length; k < l; k++) {
      var face = geometry.faces[k];
      a.copy(geometry.vertices[face.a]);
      b.copy(geometry.vertices[face.b]);
      c.copy(geometry.vertices[face.c]);

      if (offset) {
        var x = (repair) ? 10 : 0
        var y = repair ? 20 : 10; 
        var offsetX = x / this.width
        var offsetY = y / this.height
        var scaleX = 1 - offsetX
        var scaleY = 1 - offsetY
        a.x = (a.x + this.coordinates.x) * scaleX - x / 2 - this.coordinates.x;
        b.x = (b.x + this.coordinates.x) * scaleX - x / 2 - this.coordinates.x;
        c.x = (c.x + this.coordinates.x) * scaleX - x / 2 - this.coordinates.x;
        a.y = (a.y - this.coordinates.y) * scaleY + y / 2 + this.coordinates.y;
        b.y = (b.y - this.coordinates.y) * scaleY + y / 2 + this.coordinates.y;
        c.y = (c.y - this.coordinates.y) * scaleY + y / 2 + this.coordinates.y;
        
      }
      var matrix = P.geometry.matrixFromStandardTriangles(a,b,c);
      floors.push(new klass({
        area: this,
        x: 0,
        y: 0,
        z: 0,
        matrix: matrix
      }))
    }

  }
  return floors
}
P.Area.prototype.setFloorsFromPolygon = function(points) {
  this.floors = [];
  this.floorsOffset = [];
  this.zoom = 1;
  this.computeBox(points)

  if (!points || points.length < 3)
    return;
  this.floors = this.setTilesFromPolygon(points);

  if (this instanceof P.Zone) {
    //try {
    //  var pts = offset.data(points.concat([points[0]])).padding(5)[0]
    //  pts.pop()
    //  this.floorsOffset = this.setTilesFromPolygon(pts, true);
    //} catch(e) {
      this.floorsOffset = this.setTilesFromPolygon(points, true, true);
    //}
  }


  this.updatePolygon()
  return this.floors;
}

P.Area.path = function(svgpath) {
  var path = $d3g.transformSVGPath( svgpath.d);
  var offsetX = svgpath.offsetX || 0;
  var offsetY = svgpath.offsetY || 0;
  var scale   = svgpath.scale || 1;
  path.points = [];
  path.subPaths.forEach(function(subpath) {
    subpath.curves.forEach(function(line) {

      line.v1.x = (line.v1.x + offsetX) * scale
      line.v2.x = (line.v2.x + offsetX) * scale
      line.v1.y = (line.v1.y + offsetY) * scale
      line.v2.y = (line.v2.y + offsetY) * scale

      line.distance = Math.sqrt(Math.pow(line.v2.x - line.v1.x, 2) + Math.pow(line.v2.y - line.v1.y, 2) )

      path.points.push(line.v1, line.v2)
    })
  })
  return path;
}

P.Area.prototype.sortWalls = function(walls) {
  if (!walls)
    walls = this.walls;

  (walls || this.walls).sort(function(a, b) {
    var ao = a.hasOwnProperty('opacity') ? a.opacity : a.type.opacity != null ? a.type.opacity : 1;
    var bo = b.hasOwnProperty('opacity') ? b.opacity : b.type.opacity != null ? b.type.opacity : 1;
    // draw shorter transparent fragments first
    if (ao !== 1 && bo !== 1) {
      return b.distance - a.distance;
    }
    // draw solid objects before transparent
    // draw longer solid objects before shorter objects
    return (bo - ao) || (b.distance - a.distance);
  });
  (walls || this.walls).forEach(function(wall, index) {
    wall.renderIndex = index
  });
  this.walls = this.capLines(this.walls, 'v1', 'v2')

}

P.Area.prototype.computeAreaBox = function(realBox) {
  this.areaBox = new THREE.Box3;
  this.areaBox.area = this;
  this.areaBox.min.set(
    - this.contentBox.min.x + this.coordinates.x, 
    - this.contentBox.min.y + this.coordinates.y, 
    this.coordinates.z);
  this.areaBox.max.set(
    this.areaBox.min.x + this.contentBox.max.x, 
    this.areaBox.min.y + this.contentBox.max.y, 
    this.areaBox.min.z);
  this.areaBox.height = this.areaBox.max.y - this.areaBox.min.y;
  this.areaBox.width  = this.areaBox.max.x - this.areaBox.min.x;
  this.areaBox.depth  = this.areaBox.max.z - this.areaBox.min.z;
  this.areaBox.center = this.areaBox.getCenter();

  this.offset.x = this.areaBox.min.y
  this.offset.z = - this.areaBox.min.x
  this.needsUpdate(P.UPDATE_OFFSET)
  /*
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1000,1,1000))
      scene.add(this.mesh)
    }
      this.mesh.position.x = this.coordinates.y + 500
      this.mesh.position.y = this.offset.y
      this.mesh.position.z = - this.coordinates.x - 500*/
  return this;
}


P.Area.formatTitle = function(title) {
  return title.split('-').join(' ');
};


P.Area.getPoints = function(walls, arrays) {
  var points = [];
  //var ignoreShortWalls = walls[0] && walls[0].area.title.match(/we\s*work/i)
  for (var i = 0; i < walls.length; i++) {
    //if (ignoreShortWalls && walls[i].type.isShort)
    //  continue;
    points.push(arrays ? [walls[i].v1.x, walls[i].v1.y] : walls[i].v1)
    points.push(arrays ? [walls[i].v2.x, walls[i].v2.y] : walls[i].v2)
  }
  return points;
}


P.Area.computeBoundingPolygon = function(points, pad) {
  var cloud = [];

  for (var i = 0; i < points.length; i++) {
    cloud.push([
      points[i].x,
      points[i].y
    ])

  if (pad !== false)
    // add dots every 3 grid points along the wall
    if (i % 2 == 1) {
      var distance = Math.sqrt(Math.pow(points[i].x - points[i - 1].x, 2) + Math.pow(points[i].y - points[i - 1].y, 2) )
      var grid = 14;
      for (var px = grid / 2; px < distance - grid / 2; px+= grid) {
        cloud.push([
          points[i - 1].x + (points[i].x - points[i - 1].x) * (px / distance), 
          points[i - 1].y + (points[i].y - points[i - 1].y) * (px / distance)
        ])
      }
    }
  }
  return P.Area.hull(cloud, 0.8, 10);
}

P.Area.prototype.getPanels = function() {
  var panels = this.panels ? this.panels.slice() : [];
  var people = this.people;
  if (people) {
    for (var i = 0; i < people.length; i++)
      if (people[i].panel.opacity)
        panels.push(people[i].panel);
  }
  var workplaces = this.workplaces;
  if (workplaces) {
    for (var i = 0; i < workplaces.length; i++)
      if (workplaces[i].panel.opacity)
        panels.push(workplaces[i].panel);
  }
  var pins = this.pins;
  if (pins) {
    for (var i = 0; i < pins.length; i++)
      if (pins[i].panel.opacity)
        panels.push(pins[i].panel);
  }
  return panels;
}
P.Area.prototype.getLabels = function() {
  if (!this.zone || this.zone.area == P.currently.showingArea) 
    var labels = this.labels;

  var pins = this.pins;
  if (pins) {
    labels = labels ? labels.slice() : []
    for (var i = 0; i < pins.length; i++) {
      if (pins[i].label)
        labels.push(pins[i].label)
    }
  }

  return labels || [];
}
P.Area.prototype.getIcons = function() {
  var pins = this.pins;
  var icons = [];
  if (pins) {
    for (var i = 0; i < pins.length; i++) {
      if (pins[i].icon)
        icons.push(pins[i].icon)
    }
  }
  return icons;
}

P.Area.prototype.wallHeight = 28;


P.Area.prototype.onAppear = function() {
  return true;
}

P.Area.prototype.setPeople = function(people, allPeople) {
  this.people.forEach(function(person) {
    person.zone = this.zones.filter(function(zone) {
      return zone.id == person.zone_id
    })[0]
    person.area = this;
    if (person.zone)
      (person.zone.people || (person.zone.people = [])).push(person);
  }, this);
}
