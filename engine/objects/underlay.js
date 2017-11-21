// Dynamic triangle geometry drawn below the objects on the plan, e.g. zone highlights
P.Underlay = function(properties) {
  P.Object.call(this, properties);
};


P.Underlay.prototype = new P.Object;

P.Underlay.prototype.computeColor = function() {
  if (this.zone && this.zone.observed === false && P.Scene.state != 'search')
    var color = P.Scene.state === 'location' ? P.styles.labelPrivateColor : P.styles.floorPrivateColor
  return this.highlightColor || this.temporaryColor || color || this.color
}

P.Underlay.prototype.computeOpacity = function() {
  if (this.zone && this.zone.observed === false && P.Scene.state != 'location')
    return opacity = 0.5;
  return this._computeOpacity()
}

P.Underlay.prototype.computeAlignment = function() {
  var offsetY = 0;
  if (this.zone === P.currently.editingZone)
    offsetY += .15;
  if (P.Scene.state === 'location')
    offsetY += this.zone.renderIndex / 20

  this.alignment.y = offsetY;
  return this.alignment
}
P.Underlay.instanced = function() {
  return THREE.InstancedMesh.create(
    P.geometry.triangleBufferGeometry,
    P.materials.underlay,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'underlays',
      getter: 'getUnderlays',
      renderForZones: true,
      rotateX: - Math.PI / 2,
      rotateZ: - Math.PI / 2
    }
  )
};