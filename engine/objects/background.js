P.Background = function(properties) {
  if (properties != null)
    P.Object.call(this, properties)
}


P.Background.prototype = new P.Object;

P.Background.prototype.computeUV = function() {
  if (this.atlasIndex == null)
    this.atlasIndex = this.instances.material.map.allocate(null, P.sprites[this.name])
  return this.uv.set(
    this.instances.material.map.gridX + (this.instances.material.map.gridY / 10000),
    this.width == null ? this.scale.x / (64 *(this.radius || 1)) * camera.zoom : 0,
    this.width == null ? this.scale.y / (64*(this.radius || 1)) * camera.zoom: 0
  )
}
P.Background.prototype.onAppear = function(force) {
  if (force === true)
    return this._onAppear()
  this.computeUV()
  return this.atlasIndex != null
}


/*
P.Background.prototype.computeColor = function() {
  return    object.highlighted ? P.styles.targetColor :
      (object.zone && object.zone.label == object && object.zone.observed === false) ? P.styles.labelPrivateColor
      : (object === P.pointer.person && sprite.highlightingColor) ||
        ((object === P.Scene.target || (object === P.Scene.target && P.Scene.target.clone)) && sprite.targetColor) || sprite.color);
    
}


P.Background.prototype.computeOpacity = function() {
    if (object.backgroundOpacity) {
      var opacity = object.backgroundOpacity;
    }
  object instanceof P.Panel && P.Scene.makingScreenshot ? 0 :
  (sprite.opacity != null ? sprite.opacity : 1) * (opacity != null ? opacity : object.opacity)
}


P.Background.prototype.computeScale = function() {
  if (this.target) {

  } else {
    return this._computeScale()
  }
  var scales = instances.geometry.attributes.instanceScale.array;
  var width = scales[object.index * 3]      + (sprite.padding * 2 + (object.paddingLeft || 0) + (object.paddingRight || 0)) / camera.zoom
  var height = scales[object.index * 3 + 1] + (sprite.padding * 2 + (object.paddingTop || 0) + (object.paddingBottom || 0)) / camera.zoom;
  this.setScaleAt(index, _v3.set(
    width,
    height,
    scales[object.index * 3 + 2]
  ))
  var offset = _v3.set(
    ((object.paddingRight || 0) - (object.paddingLeft || 0)) / 2  / camera.zoom,
    (object.paddingTop || 0) / 2 / camera.zoom,
    0
  ).applyQuaternion(_q)
}

P.Background.prototype.computeUV = function() {
labels[j].company ? P.sprites.button_dark : 
            labels[j].zone && (P.Scene.state != 'chart' || labels[j].zone.area !== P.currently.showingArea || labels[j].zone.observed === false) 
          ? P.sprites.label 
         : (labels[j].isSticky() ? P.sprites.button : P.sprites.background));
}
*/
P.Background.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.backgrounds,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_UV | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'backgrounds',
      disappearing: true,
      buildList: function() {
        return this.collectFromInstances('backgrounds', 
          P.Label.instances.lastVisible)
      }
    },
    {
      name: 'backgrounds_front',
      buildList: function() {
        return this.collectFromInstances('backgrounds', 
          P.Icon.instances.front.lastVisible,
          P.Label.instances.front.lastVisible,
          P.Panel.instances.lastVisible)
      }
    }
  )

};


