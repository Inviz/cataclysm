P.Furniture = function(properties) {
  P.Object.call(this, properties)
}

P.Furniture.prototype = new P.Object;
P.Furniture.prototype.height = 38
P.Furniture.prototype.width = 38
P.Furniture.prototype.opacity = 1
P.Furniture.prototype.color = new THREE.Color(1,1,1)
P.Furniture.prototype.visibilityMethod = 'isFurnitureVisible'

P.Furniture.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.furniture,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_UV | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'furniture',
      disappearing: true,
      defines: {
        USE_CHANNEL_PACKING: ''
      }
    }
  )
}


P.Furniture.prototype.onAppear = function() {
  if (this.opacity === 0)
    return;
  this.atlasIndex = this.instances.material.map.allocateShared(this, this.type.imageSRC)
  return this.atlasIndex != null;
}

P.Furniture.prototype.onDisappear = function() {
  if (this.instances.material.map)
    this.instances.material.map.releaseShared(this, this.type.imageSRC)
}


P.Furniture.getSize = function(line) {
  if (line.frozenSize || line.type.isFixedSize) 
    return line.frozenSize || line.type.isFixedSize;

  var x2 = line.v2.x
  var y2 = line.v2.y
  var x1 = line.v1.x
  var y1 = line.v1.y
  var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) )

  var z = line.frozenRatio;
  if (!z) {
    var w = Math.abs(y2 - y1);
    var h = Math.abs(x2 - x1);
    if (w <= h) {
      var c = w;
      w = h
      h = c;
    }
    var z = (w || 1) / (h || 1);
    if (!isFinite(z)) {
      z = 0.1;
    }
  }
  var height = Math.sqrt(Math.pow(distance, 2) / (Math.pow(z, 2) + 1))
  var width = Math.sqrt(Math.pow(distance, 2) / (Math.pow(1 / z, 2) + 1))

    return [Math.round(width), Math.round(height)]
};