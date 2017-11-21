// Base class for all kinds of locations
// Areas and zones are not present in the scene itself,
// instead they provide lists of mesh instances to render 
// (walls, people, floors, labels, overlays, sprites)

P.Area = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Area))
    return new P.Area(properties);
  P.Object.call(this, properties)

  if (this.polygon.length)
  this.floors = this.setPolygon(this.polygon).map(function(matrix) {
    return new P.Floor({
      area: this,
      matrix: matrix
    })
  }, this)

  if (!this.labelType)
    this.labelType = P.Label.Area;

  //this.setLabel()
  //if (this.name == 'area')
  //  this.label.important = true;

  this.currentPosition = new THREE.Vector3;
  this.updateCurrentPosition();

  return this
}

P.Area.prototype = new P.Object;
P.Area.prototype.name = 'area';

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
  //if (this.zones)
  //  for (var i = 0; i < this.zones.length; i++)
  //    this.zones[i].updateCurrentPosition();
  //P.Sprite.instances.changes           |= P.UPDATE_OFFSET;
  //P.Floor.instances.changes            |= P.UPDATE_OFFSET;
  //P.Overlay.instances.changes          |= P.UPDATE_OFFSET;
  //P.Underlay.instances.changes         |= P.UPDATE_OFFSET;
  //P.Background.instances.changes       |= P.UPDATE_OFFSET;
  //P.Background.instances.front.changes |= P.UPDATE_OFFSET;
//
  //P.Person.instances.changes           |= P.UPDATE_PARENT;
  //P.Wall.instances.changes             |= P.UPDATE_PARENT;
  //P.Furniture.instances.changes        |= P.UPDATE_PARENT;
  //P.Panel.instances.changes            |= P.UPDATE_PARENT;
  //P.Label.instances.changes            |= P.UPDATE_PARENT;
  //P.Company.instances.changes          |= P.UPDATE_PARENT;
//
  //P.Pin.changes                        |= P.UPDATE_PARENT;
}


P.Area.prototype.computeAreaBox = function() {
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


P.Area.prototype.onAppear = function() {
  return true;
}