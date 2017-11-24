// Dynamic triangle geometry drawn on top of the plan, e.g. zone highlights, stack charts
P.Overlay = function(properties) {
  P.Object.call(this, properties);
};


P.Overlay.prototype = new P.Object;
//P.Overlay.prototype.color = new THREE.Color(1, 0,0)
P.Overlay.prototype.computeAlignment = function() {
  var extrudeValue = 200//this.zone.extrudeY;
  var scaleX = 1;
  var scaleZ = 1;
  var zone = this.zone;
  var extrudeY = (this.isExtrusion && extrudeValue || 1);
  if (zone)
  //if (P.Scene.state != 'location') {
    if (zone.extrusionOffsetWallHeight != null)
      var offsetY = zone.area.wallHeight + zone.extrusionOffsetWallHeight;
    else
      var offsetY = zone.extrusionOffset != null ? zone.extrusionOffset : 0;
  //}
  this.alignment.y = (offsetY || 0) + (this.inverted || ! this.isExtrusion  ? ((extrudeValue) - (!!this.isExtrusion)) : 0);
  
  return this.alignment;
};
P.Overlay.prototype.computeScale = function() {
  var extrudeValue = this.zone.extrudeY;
  var extrudeY = (this.isExtrusion && 200 || 1);
  this.scale.y = extrudeY;
  return this.scale;
}

P.Overlay.prototype.computeColor = function() {
  return this.color;
  if (this.zone) {
    if (this.zone.overlayColor)
      return this.zone.overlayColor
    if (this.zone.observed === false) {
      if (this.zone.structural)
        var color = P.styles.solidWallColor
      else
        var color = P.styles.floorPrivateColor
    }
  }
  return this.highlightColor || this.temporaryColor || color || this.color
}

P.Overlay.prototype.computeOpacity = function() {
  return 1;
  var zone = this.zone;
  var extrusionOpacity = zone.extrusionOpacity || 0
  return extrusionOpacity * (this.temporaryOpacity != null ? this.temporaryOpacity : 
                this.opacity != null ? this.opacity : 1)
}

P.Overlay.instanced = function() {
  return THREE.InstancedMesh.create(
    P.geometry.triangleBufferGeometry,
    P.materials.overlay,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'overlays',
     // getter: 'getOverlays',
      renderForZones: true,
      rotateX: - Math.PI / 2,
      rotateZ: - Math.PI / 2,
      castShadow: true,
      receiveShadow: true
    }
  )
};