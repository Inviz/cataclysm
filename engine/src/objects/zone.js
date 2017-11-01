P.Zone = function(properties) {
  if (!(this instanceof P.Zone))
    return new P.Zone(properties);

  if (!properties || !properties.labelType)
    this.labelType = P.Label.Zone

  P.Area.call(this, properties)
  var that = this;
  if (this.currentPosition) {
    that.updateCurrentPosition();
    this.onRename()
  }
  return this
};

P.Zone.prototype = new P.Area;
P.Zone.prototype.name = 'zone';
P.Zone.prototype.value = 0;
P.Zone.prototype.observed = true;


P.Zone.prototype.onRename = function() {
  if (this.title.match(/solid\s*ceiling/i)) {
    this.structural = true;
    this.observed = false;
    this.extrusionOpacity = 1;
    this.extrudeY = 0;
    this.extrusionOffset = 28;
    this.extrusionOffsetWallHeight = 0;
    this.targetExtrusionOpacity = 1;
  } else if (this.title.match(/solid\s*wall/i)) {
    this.structural = true;
    this.observed = false;
    this.extrusionOpacity = 1;
    this.extrudeY = 28;
    this.targetExtrudeY = this.extrudeY || 0;
    this.extrusionOffset = 0;
  } else if (this.title.match(/solid\s*column/i)) {
    this.structural = true;
    this.observed = false;
    this.extrudeY = 28;
    this.extrusionOpacity = 0.6;  
    this.targetExtrudeY = this.extrudeY || 0;
    this.targetExtrusionOpacity = this.extrusionOpacity || 0;
    this.extrusionOffset = 0;
  } else if (!this.observed) {
    this.structural = false;
    this.extrusionOpacity = 0.6; 
    this.targetExtrusionOpacity = 0.6; 
    this.extrudeY = null
    this.extrusionOffset = 27.8
    this.extrusionOffsetWallHeight = -0.2;
  } else {
    this.structural = false;
    this.extrusionOpacity = 0.6; 
    this.extrudeY = null
    this.extrusionOffset = null
  }
}

P.Zone.prototype.getPanels = function() {
  return null;
}
P.Zone.prototype.getCompanies = function() {
  if (!P.Scene.showCompanies)
    return this.companies
}
P.Zone.prototype.getOverlays = function() {
  if ((this.extrudeY > 1)) {
    return (this.floors || []).concat(this.extrusion || [])
  } 
  if (this.observed === false && P.Scene.state !== 'location') {
    return this.floors || []
  } 
}
P.Zone.prototype.getUnderlays = function() {
  if (this.structural) return

  if (P.currently.editingZone === this // highlight
  || this.area.showAllZones // search/location
  || this.highlights
  || P.Scene.state === 'location' // search/location
  || (P.currently.resizingPolygon && P.currently.editingArea === this.area))
    
    if (P.Scene.state == 'location')
      return this.underlaysOffset;
    else
      return this.underlays
}
// legacy method to import zones from svg groups
P.Zone.prototype.generatePolygon = function(points) {
  this.generateFloorHull(points || this.hullPoints)
  this.setPolygon(this.hull)
}

P.Zone.prototype.compute = function() {
  if (this.area.walls) {
    for (var i = 0; i < this.area.walls.length; i++) {
      var wall = this.area.walls[i];
      if (wall.zones) {
        var index = wall.zones.indexOf(this);
        if (index > -1) {
          wall.zones.splice(index, 1)
        }
      }
      if (wall.clones)
        for (var j = 0; j < wall.clones.length; j++)
          if (wall.clones[j].zone === this) {
            wall.clones.splice(j, 1);
          }
    }
  }
  this.furniture = this.area.furniture.filter(function(wall) {
    if ((P.Area.intersectPolygon(wall.v1, this.hullPoints) || P.geometry.distanceToPolygon(wall.v1, this.hull) < 10)  &&
        (P.Area.intersectPolygon(wall.v2, this.hullPoints) || P.geometry.distanceToPolygon(wall.v2, this.hull) < 10 )) {
      wall.zone = this;
      return wall;
    }
  }, this);
  //this.people = this.area.people.filter(function(person) {
  //  if ((P.Area.intersectPolygon(person.coordinates, this.hullPoints) || P.geometry.distanceToPolygon(person.coordinates, this.hull) < 5)) {
  //    person.zone = this;
  //    return person;
  //  }
  //}, this);
  var c = {x: 0, y: 0}
  this.walls = this.area.walls.filter(function(wall) {
    var d1 = P.geometry.distanceToPolygon(wall.v1, this.hull) 
    var d2 = P.geometry.distanceToPolygon(wall.v2, this.hull)
    var i1 = P.Area.intersectPolygon(wall.v1, this.hullPoints);
    var i2 = P.Area.intersectPolygon(wall.v2, this.hullPoints);
    c = {
      x: wall.v1.x + (wall.v2.x - wall.v1.x) / 2,
      y: wall.v1.y + (wall.v2.y - wall.v1.y) / 2
    }
    var d3 = P.geometry.distanceToPolygon(c, this.hull)
    var dmin = Math.min(d1, d2)
    if ((i1 || d1 < 10)  &&
        (i2 || d2 < 10 )) {
      if (!wall.zone)
        wall.zone = this
      if (!wall.zones)
        wall.zones = [];
      if (wall.zones.indexOf(this) == -1)
        wall.zones.push(this)

      if (!wall.outside)
        wall.outside = (d1 < 5 && d2 < 5 && d3 < 5)
      if (!wall.edgy)
        wall.edgy = (d1 < 5 || d2 < 5 || d3 < 5)
      if (wall.clones) {
        for (var i = 0; i < wall.clones.length; i++)
          if (wall.clones[i].zone === this)
            return wall;
      } else {
        wall.clones = [];
      }
      // create reference to wall
      var clone = Object.create(wall);
      clone.origin = wall
      clone.zone = this;
      wall.clones.push(clone)
      return wall;
    }
  }, this)
}


P.Zone.prototype.updatePolygon = function(temp) {
  var minX = Infinity;
  var minY = Infinity
  this.hullPoints = [];
  if (this.hull)
    for (var i = 0; i < this.hull.length; i++) {
      this.hullPoints.push({x: this.hull[i][0], y: this.hull[i][1]});
      if (minX > this.hull[i][0])
        minX = this.hull[i][0]
      if (minY > this.hull[i][1])
        minY = this.hull[i][1]
    }
  if (isFinite(minX)) {
    this.coordinates.x = minX;
    this.coordinates.y = minY;
  }
  this.floors.forEach(function(floor) {
    floor.y = 0
    floor.color = this.color;
    floor.area = this.area;
    floor.zone = this;
  }, this)
  this.floorsOffset.forEach(function(floor) {
    floor.y = 0
    floor.color = this.color;
    floor.area = this.area;
    floor.zone = this;
  }, this)
  if (this.underlays) {
    this.underlays.forEach(function(floor) {
      floor.y = 0
      floor.color = this.color;
      floor.area = this.area;
      floor.zone = this;
    }, this)
    this.underlaysOffset.forEach(function(floor) {
      floor.y = 0
      floor.color = this.color;
      floor.area = this.area;
      floor.zone = this;
    }, this)
  }
  this.extrudePolygon()
  this.compute()
//  this.sortWalls()
}


P.Zone.prototype.extrudePolygon = function(height) {
  if (!this.shapes)
    return
  var extrude = new THREE.ExtrudeGeometry( this.shapes[0], {
    bevelEnabled: false
  } );

  //if (!this.mesh && this.name == 'zone') {
  //  extrude.faceVertexUvs = []
  //  debugger
  //  extrude.faces = extrude.faces.filter(function(face) {
  //    return !(face.normal.x == 0 && face.normal.y == 0)
  //  })
  //  //this.mesh = new THREE.Mesh(extrude)
  //  //scene.add(this.mesh)
  //}

  height = 1;
  var j = this.hullPoints.length;
  var extrusion = [];
  var a = {x: 0, y: 0};
  var b = {x: 0, y: 0};
  var c = {x: 0, y: 0};
  var changeOrigin = new THREE.Matrix4()
  var changeOriginBack = new THREE.Matrix4()

  var position   = new THREE.Vector3;
  var quaternion = new THREE.Quaternion;
  var scale      = new THREE.Vector3;
  var v          = new THREE.Vector3;
  var euler      = new THREE.Euler;
 for (var i = 0; i < j; i++) {
   var f = this.hullPoints[(i || j) - 1];
   var t = this.hullPoints[i];
  //for (var i = 0; i < extrude.faces.length; i++) {
  //  var face = extrude.faces[i]
  //  var A = extrude.vertices[face.a];
  //  var B = extrude.vertices[face.b];
  //  var C = extrude.vertices[face.c];
  //  debugger
  //  var f = {x: B.x, y: B.y}
  //  var t = {x: A.x, y: A.y}
    a.x = 0;
    a.y = 0;
    b.x = (t.x - f.x);
    b.y = (t.y - f.y);
    c.x = 0;
    c.y = 0 + height;

    var distance = Math.sqrt(Math.pow(t.x - f.x, 2) + Math.pow(t.y - f.y, 2) );
    scale.set(distance, 1,100)
    quaternion.setFromEuler(
      euler.set(Math.PI / 2, Math.PI - (Math.atan2(t.y - f.y, t.x - f.x)), 0)
    )
    position.set(-f.x,f.y, 0)

    extrusion.push(new P.Overlay({
      isExtrusion: true,
      area: this.area,
      zone: this,
      x: 0,
      y: 0.02,
      z: 0,
      //centerX: this.coordinates.y + this.height / 2,
      //centerY: 0,
      //centerZ: - (this.coordinates.x + this.width / 2),
      matrix: new THREE.Matrix4().compose(position, quaternion, scale)
    }))

    quaternion.setFromEuler(
      euler.set(Math.PI / 2, Math.PI - (Math.atan2(t.y - f.y, t.x - f.x)), Math.PI )
    )
    var m = new THREE.Matrix4().compose(position, quaternion, scale)
    changeOrigin.makeTranslation(-1,-1,0)
    m.multiply(changeOrigin)
    extrusion.push(new P.Overlay({
      isExtrusion: true,
      area: this.area,
      zone: this,
      x: 0,
      y: 0.02,
      z: 0,
      //centerX: this.coordinates.y + this.height / 2,
      //centerY: 0,
      //centerZ: - (this.coordinates.x + this.width / 2),
      matrix: m,
      inverted: true
    }))

  }
  this.extrusion = extrusion
} 

P.Zone.prototype.setFloorsFromPolygon = function() {
  P.Area.prototype.setFloorsFromPolygon.apply(this, arguments);
  this.underlays = this.floors.map(function(floor) {
    return new P.Underlay({
      area: floor.area,
      x: floor.x,
      y: floor.y,
      z: floor.z,
      matrix: floor.matrix
    })
  })
  if (this.floorsOffset)
  this.underlaysOffset = this.floorsOffset.map(function(floor) {
    return new P.Underlay({
      area: floor.area,
      x: floor.x,
      y: floor.y,
      z: floor.z,
      matrix: floor.matrix
    })
  })
}

P.Zone.prototype.onAppear = function() {
  
  return true;
}

P.Zone.prototype.getBox = function(includeOffsets, box3, offset) {
  if (box3 == null)
    box3 = new THREE.Box3;
  var box = this.box;
  var offset = 150;
  box3.min.x = this.getTotalX(includeOffsets) + box.min.y  - offset;
  box3.min.y = this.getTotalY(includeOffsets)// + zone.coordinates.z;
  box3.min.z = this.getTotalZ(includeOffsets) - box.max.x  - offset

  box3.max.x = this.getTotalX(includeOffsets) + box.max.y  + offset;
  box3.max.y = this.getTotalY(includeOffsets)// + 1 + zone.coordinates.z;
  box3.max.z = this.getTotalZ(includeOffsets) - box.min.x + offset;

  /*
  if (!zone.mesh) {
    zone.mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(box3.max.x -box3.min.x, 1, box3.max.z - box3.min.z))
    scene.add(zone.mesh)
  }
    zone.mesh.position.x = box3.max.x - (box3.max.x -box3.min.x) / 2
    zone.mesh.position.y = box3.max.y
    zone.mesh.position.z = box3.max.z - (box3.max.z -box3.min.z) / 2
  */
  return box3;
}


P.Zone.prototype.getTotalX = function(includeShifts) {
  return this.area.getTotalX(includeShifts !== false) + this.getX(includeShifts !== false)
}
P.Zone.prototype.getTotalY = function(includeShifts) {
  return this.area.getTotalY(includeShifts !== false) + this.getY(includeShifts !== false)
}
P.Zone.prototype.getTotalZ = function(includeShifts) {
  return this.area.getTotalZ(includeShifts !== false) + this.getZ(includeShifts !== false)
}

P.Zone.prototype.getPosition = function(includeShift, v3) {
  if (v3 == null)
    v3 = new THREE.Vector3;
  return v3.set(
    this.area.getTotalX(includeShift) + this.coordinates.y, 
    this.area.getTotalY(includeShift), 
    this.area.getTotalZ(includeShift) - this.coordinates.x);
};
