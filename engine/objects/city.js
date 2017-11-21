P.City = function(properties) {
  if (!(this instanceof P.City))
    return new P.City(properties);

  P.Object.call(this, properties)
  this.roads = this.setPolygon(this.roadNetwork).map(function(matrix) {
    return new P.Road({
      city: this,
      matrix: matrix
    })
  }, this)

  this.areas.forEach(function(area) {
    this.contentBox.expandByPoint(area.contentBox.min)
    this.contentBox.expandByPoint(area.contentBox.max)
  }, this)
  this.coordinates = this.contentBox.min;
  this.computeAreaBox()

  this.currentPosition = new THREE.Vector3;
  this.updateCurrentPosition();
  return this
};

P.City.prototype = Object.create(P.Area.prototype);
P.City.prototype.name = 'city';
