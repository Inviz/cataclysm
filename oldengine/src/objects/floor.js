P.Floor = function(properties) {
  P.Object.call(this, properties);
};

P.Floor.prototype = new P.Object;

P.Floor.prototype.computeColor = function() {
  return (this.area && this.area.floorColor) || this.highlightColor || this.temporaryColor || this.color
}

P.Floor.instanced = function() {
  return THREE.InstancedMesh.create(
    P.geometry.triangleBufferGeometry,
    P.materials.floor,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'floors',
      renderForAreas: true,
      rotateX: - Math.PI / 2,
      rotateZ: - Math.PI / 2,
      receiveShadow: true
    }
  )
};