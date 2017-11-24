P.Roof = function(properties) {
  P.Object.call(this, properties);

};

P.Roof.prototype = new P.Object;

//P.Roof.prototype.color = new THREE.Color(0x999999)

P.Roof.prototype.opacity = 1

P.Roof.instanced = function() {
  return THREE.InstancedMesh.create(
    P.geometry.triangleBufferGeometry,
    P.materials.roof,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'roofs',
      rotateX: - Math.PI / 2,
      rotateZ: - Math.PI / 2,
      renderForZones: true
    }
  )
};