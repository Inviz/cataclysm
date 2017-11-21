P.Road = function(properties) {
  P.Object.call(this, properties);

};

P.Road.prototype = new P.Object;

P.Road.prototype.computeColor = function() {
  return this.color
}

P.Road.instanced = function() {
  return THREE.InstancedMesh.create(
    P.geometry.triangleBufferGeometry,
    P.materials.road,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'roads',
      getter: 'getRoads',
      rotateX: - Math.PI / 2,
      rotateZ: - Math.PI / 2,
      receiveShadow: true
    }
  )
};