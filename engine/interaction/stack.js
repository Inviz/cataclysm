P.Scene.Stack = function(styles) {
  P.Scene.call(this, styles);
};

P.Scene.Stack.prototype = new P.Scene;
P.Scene.Stack.prototype.constructor = P.Scene.Stack

P.Scene.Stack.prototype.anchorY = 0;

P.Scene.Stack.prototype.onInitialize = function(area, target, type, zoom, point) {
  this.__onInitialize();
  if (area == null)
    area = this.getData()

  // Spread zones vertically to avoid overlaps, find final height
  var maxWidth = 0;
  var maxHeight = 0;
  P.currently.showingZones.forEach(function(zone) {
    maxWidth = Math.max(zone.width, maxWidth);
    maxHeight = Math.max(zone.height, maxHeight);
  });

  // measure one floor with given camera settings
  var offsetTop = 0;
  var lastOffset = 0;

  var oldPosition = controls.target.clone()
  var tiltY = this.getCameraTiltY();

  var first = -window.innerHeight / 2 + 50 //-P.currently.showingZones[0].height / 2
  P.currently.showingZones.forEach(function(zone) {
    offsetTop += 100;

    P.animate.property(zone, 'shift', 'x', offsetTop + first + area.areaBox.height / 2 + - zone.coordinates.y)
    P.animate.property(zone, 'shift', 'z', -area.areaBox.width / 2 + zone.width / 2 + zone.coordinates.x)
   
    offsetTop += zone.box.height;
  
  })
  var baseHeight = offsetTop;

  // now that we know total height, compute scene again
  this.measurements = this.computeDimensions(area.areaBox, null, type, zoom, null, maxWidth, baseHeight)
  
  // compute scrollable area
  var pad = true;
  this.setScrollSize(
    this.measurements.scene.width,
    this.measurements.scene.height + 200
  );
  this.scrollAt(target)
  this.animateScene = P.animate.progress !== 1;


  //var pref = camera.currentType;
  //if (pref === 'isometric')
  //  P.Scene.makeIsometric(this.measurements.position)
  //else
    P.Scene.makeFlat(controls.target, 0, this.getCameraTiltY())

  console.info('2d stack', area.areaBox.width, 'x', area.areaBox.height, 
               ' at ', (zoom || this.getZoom()) * 100, '%',
               ' is ', this.measurements.scene.width, 'x', this.measurements.scene.height,
               ' @ ', this.measurements.center)
}

P.Scene.Stack.prototype._onInitialize = P.Scene.Stack.prototype.onInitialize;