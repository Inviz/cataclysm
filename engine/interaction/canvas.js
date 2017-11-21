P.Scene.Canvas = function(styles) {
  P.Scene.call(this, styles);
};

P.Scene.Canvas.prototype = new P.Scene;
P.Scene.Canvas.prototype.constructor = P.Scene.Canvas

P.Scene.Canvas.prototype.onInitialize = function(box, target, type, zoom, point) {
  console.info(controls.target.x, controls.target.y, controls.target.z, 555, this.getTarget(), !!target)
  this.__onInitialize();
  if (box == null || box === true) {
    box = this.getBox()
  } 

  this.measurements = this.computeDimensions(box, target, type, zoom, point)
  // compute scrollable area
  var pad = true;
  this.setScrollSize(
    (this.measurements.scene.width) + (pad ? window.innerWidth / 2 : 0),
    (this.measurements.scene.height) + (pad ? window.innerHeight / 2 : 0)
  );
  this.scrollAt(target)
  this.animateScene = P.animate.progress !== 1

  var pref = camera.currentType;
  var p = P.Scene.previousState && target ? this.measurements.target : controls.target
  if (pref === 'isometric')
    P.Scene.makeIsometric(controls.target)
  else
    P.Scene.makeFlat(controls.target, 0, this.getCameraTiltY())

  this.scrollAt(target)
  this.onSceneChange();
  console.info('2d canvas', box.width, 'x', box.height, 
               ' at ', (zoom || this.getZoom()) * 100, '%',
               ' is ', this.measurements.scene.width, 'x', this.measurements.scene.height,
               ' @ ', this.measurements)
  
}

P.Scene.Canvas.prototype._onInitialize = P.Scene.Canvas.prototype.onInitialize;