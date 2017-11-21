P.Zone = function(properties) {
  if (!(this instanceof P.Zone))
    return new P.Zone(properties);

  if (!properties || !properties.labelType)
    this.labelType = P.Label.Zone

  P.Object.call(this, properties)
  if (this.polygon.length)
  this.floors = this.setPolygon(this.polygon).map(function(matrix) {
    return new P.Floor({
      area: this,
      zone: this,
      matrix: matrix
    })
  }, this)

  var that = this;
  this.currentPosition = new THREE.Vector3;
  if (this.currentPosition) {
    that.updateCurrentPosition();
  }
  return this
};

P.Zone.prototype = Object.create(P.Area.prototype);
P.Zone.prototype.name = 'zone';
P.Zone.prototype.value = 0;
P.Zone.prototype.observed = true;


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
  return
}
// legacy method to import zones from svg groups
P.Zone.prototype.generatePolygon = function(points) {
  this.generateFloorHull(points || this.hullPoints)
  this.setPolygon(this.hull)
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
