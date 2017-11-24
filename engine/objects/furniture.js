P.Furniture = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Furniture))
    return new P.Furniture(properties);

  P.Object.call(this, properties)

  this.scale.set(200,200,200);
  this.opacity = 1;
  return this
}

P.Furniture.prototype = Object.create(P.Object.prototype);
P.Furniture.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.BoxBufferGeometry( 1, 1, 1, 1),
    P.materials.furniture,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'furniture',
      renderForZones: true
    }
  )
};