P.Wall = function(properties) {
  P.Object.call(this, properties);
};


P.Wall.prototype = new P.Object;
P.Wall.prototype.color = new THREE.Color(0x999999)
P.Wall.prototype.alignY = 0.5
P.Wall.prototype.opacity = 0.3


P.Wall.prototype.computeColor = function() {
  if (this.type == 100)
    this.color = new THREE.Color(0.2,0.5,0.2)
  return this.color
}

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