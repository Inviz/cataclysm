P.Furniture = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Furniture))
    return new P.Furniture(properties);

  this.definition = Game.Furniture[properties.type];
  if (this.definition) {
    for (var property in this.definition)
      if (properties[property] == null)
        properties[property] = this.definition[property]
    var children = this.definition.children;
    if (children)
      this.boxes = children.map(function(child) {
        var box = new P.Box(child)
        box.parent = this;
        box.target = this;
        if (properties.boxColor)
        box.color = properties.boxColor;
        return box;
      }, this)
  }
  P.Object.call(this, properties)

  this.computeScale()
  return this
}

P.Furniture.prototype = Object.create(P.Object.prototype);
P.Furniture.prototype.alignY = 0.5
P.Furniture.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.BoxBufferGeometry( 1, 1, 1, 1),
    P.materials.furniture,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'furniture',
      renderForZones: true,
      visible: false
    }
  )
};