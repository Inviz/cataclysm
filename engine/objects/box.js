P.Box = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Box))
    return new P.Box(properties);

  P.Object.call(this, properties)
  return this
}

P.Box.prototype = Object.create(P.Object.prototype);

P.Box.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.BoxBufferGeometry( 1, 1, 1, 1),
    P.materials.boxes,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_UV | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'boxes',
      buildList: function() {
        return this.collectFromInstances(P.Furniture.instances.lastVisible, 'boxes')
      }
    }
  )
};