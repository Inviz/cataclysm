P.Box = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Box))
    return new P.Box(properties);

  this.definition = Game.Boxes[properties.type];
  if (this.definition) {
    for (var property in this.definition)
      if (properties[property] == null)
       properties[property] = this.definition[property]
  }
  P.Object.call(this, properties)

  return this
}

P.Box.prototype = Object.create(P.Object.prototype);
P.Box.prototype.computePosition = function() {
  if (this.placement) {
    this.shift.copy(this.placement).applyQuaternion(this.target.quaternion)
  }
  this._computePosition();

  return this.position;
}

P.Box.prototype.computeOpacity = function() {
  return this.opacity;
}

P.Box.prototype.computeColor = function() {
  if (this.type == 'wall_part')
    return P.Wall.prototype.color
  return this.color;
}

P.Box.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.BoxBufferGeometry( 1, 1, 1, 1),
    P.materials.boxes,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION  | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'boxes',
      buildList: function() {
        return this.collectFromInstances('boxes', P.Wall.instances.lastVisible, P.Furniture.instances.lastVisible)
      }
    }
  )
};