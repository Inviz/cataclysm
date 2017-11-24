P.Wall = function(properties) {
  P.Object.call(this, properties);
};


P.Wall.prototype = new P.Object;
P.Wall.prototype.color = new THREE.Color(0x999999)
P.Wall.prototype.alignY = 0.5

P.Wall.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.BoxBufferGeometry( 1, 1, 1, 1),
    P.materials.walls,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'walls',
      //getter: 'getWalls',
      renderForZones: true
    }
  )
};