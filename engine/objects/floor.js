P.Floor = function(properties) {
  P.Object.call(this, properties);
};

P.Floor.prototype = new P.Object;

P.Floor.prototype.computeColor = function() {
  if (this.zone) {
    return this.color
  } else {
    return this.color
  }
}
P.Floor.prototype.computeAlignment = function() {
  this._computeAlignment()
  if (this.zone) {
    this.alignment.y += 1;
  } else {
    this.alignment.y -= 1;
  }
  return this.alignment
}
P.Floor.prototype.computeOpacity = function() {
  if (this.zone) {
    return 1
  } else {
    return 0.3
  }
}

P.Floor.instanced = function() {
  return THREE.InstancedMesh.create(
    P.geometry.triangleBufferGeometry,
    P.materials.floor,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'floors',
      renderForZones: true,
      rotateX: - Math.PI / 2,
      rotateZ: - Math.PI / 2,
      receiveShadow: true
    }
  )
};