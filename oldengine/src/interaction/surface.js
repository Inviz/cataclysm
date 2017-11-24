P.Scene.Surface = function(styles) {
  P.Scene.call(this, styles);
};

P.Scene.Surface.prototype = new P.Scene;
P.Scene.Surface.prototype.constructor = P.Scene.Surface

P.Scene.Surface.prototype.anchorY = 1;
P.Scene.Surface.prototype.getCameraTiltY = function() {
  return Math.PI / 3
}

P.Scene.Surface.prototype.onInitialize = function(area, target, type, zoom, point) {
  this.__onInitialize();
  if (area == null || area === true)
    area = this.getData()

  //area.computeAreaBox();
  this.computeLayout()
  P.areas.forEach(function(area) {
    area.computeAreaBox()
  })
  this.measureLayout()

  var columns = this.columns;
  // measure one floor with given camera settings
  var baseHeight = this.applyLayout(target, type, zoom)

  // now that we know total height, compute scene again
  this.measurements = this.computeDimensions(this.layoutBox, target, type, zoom, null, this.layoutBox.width, baseHeight)
  
  // compute scrollable area
  var pad = false;
  this.setScrollSize(
    this.measurements.scene.width + (pad ? window.innerWidth / 2 : 0),
    baseHeight + (pad ? window.innerHeight / 2 : 0)
  );
  this.scrollAt(target)
  this.animateScene = P.animate.progress !== 1;

  this.onSceneChange();

  P.areas.forEach(function(area, index) {
    //if (columns === 1)
    //  P.animate.property(area, 'offset', 'z', -area.contentBox.min.x + (this.layoutBox.width - area.width) / 2)
    //else
    if (area.location && area.location.areas[0] === area) {
      P.animate.property(area.panels[1], 'offset', 'y', P.Scene.showPanels ? 160 / 0.25 : 1)
    }

  }, this)
  P.Scene.makeFlat(controls.target, 0, this.getCameraTiltY())

  console.info('2d surface', this.layoutBox.width, 'x', this.layoutBox.height, ' at ', (zoom || this.getZoom()) * 100, '% is ', this.measurements.scene.width, 'x', baseHeight)
  
}

P.Scene.prototype.applyLayout = function(target, type, zoom) {
  var measurements = this.computeDimensions(this.layoutBox, target, type, zoom)
  var currentFloor = null;
  var offsetTop = 0;
  var lastOffset = 0;

  var panels = P.Scene.showPanels;
  var gap = 200;
  // Spread floors vertically to avoid overlaps, find final height
  var previousFloor;
  var areas = P.areas.slice().sort(function(a, b) {
    return a.coordinates.z - b.coordinates.z
  })

  var location;
  areas.forEach(function(area) {
    if (currentFloor != area.floorBox) {
      var newOffset = (area.floorBox.height / this.layoutBox.height) 
                    * (measurements.scene.height);
      if (lastOffset)
        offsetTop += newOffset / 2 + gap +  (area.floorBox.min.y - currentFloor.min.y) / this.layoutBox.height* (measurements.scene.height);
      
      if (location && location != area.location) {
        offsetTop += 100 + (panels ? 150 : 0)
      }
      location = area.location

      lastOffset = newOffset
    }

    P.animate.property(area, 'offset', 'y', (offsetTop - 100) / measurements.elevation.y)
    //area.updateCurrentPosition()
    currentFloor = area.floorBox;
  }, this)
  return (offsetTop + lastOffset - gap + Math.max(600, window.innerHeight))

}

P.Scene.prototype.computeLayout = function() {
  var maxWidth = -Infinity
  var areas = P.areas;
  for (var i = 0; i < areas.length; i++) 
    if (areas[i].width > maxWidth)
      maxWidth = areas[i].width

  if (window.innerWidth > 900)
    var cols = 1;
  else
    var cols = 1;

    var current = 0;
  P.locations.forEach(function(location) {
    var r = 0;
    location.areas.forEach(function(area, i, areas) {
      if (cols == 1) {
        r = i;
        area.coordinates.x = 0;
      } else {
        r = Math.floor(i / 2);
        var maxHeight = Math.max(areas[r * 2].height, areas[r * 2 + 1] ? areas[r * 2 + 1].height : 0)
        
        if (i % 2 == 0) {
          area.coordinates.x = P.Wall.atGrid(-maxWidth / 2- 50);
        } else {
          area.coordinates.x = P.Wall.atGrid(maxWidth / 2 +  50);
        }
      }
        area.coordinates.z = - (r + current);
    })
    current += r + 1;
  })
  for (var i = 0; i < areas.length; i++) {
    
  }
  this.columns = cols;

  

  
}

P.Scene.Surface.prototype.measureLayout = function() {
  var box = new THREE.Box3;
  this.layoutBox = box;
  var min = new THREE.Vector3;
  var max = new THREE.Vector3;
  var floorBoxes = {};

  var maxWidth = -Infinity
  var areas = P.areas;
  for (var i = 0; i < areas.length; i++) 
    if (areas[i].width > maxWidth)
      maxWidth = areas[i].width

  for (var i = 0; i < P.areas.length; i++) {
    var z = P.areas[i].coordinates.z;
    var floorBox = floorBoxes[z] || (floorBoxes[z] = new THREE.Box3);
    if (floorBox.minX == null) {
      floorBox.minX = Infinity;
      floorBox.minY = Infinity;
      floorBox.maxY = -Infinity;
    }
    max.copy(P.areas[i].areaBox.max)
    //max.x = P.areas[i].areaBox.min.x + maxWidth;
    max.x += 100;
    min.copy(P.areas[i].areaBox.min)
    min.x -= 100;
    min.x += P.areas[i].contentBox.min.x;
    min.y += P.areas[i].contentBox.min.y;
    floorBox.expandByPoint(min)
    floorBox.expandByPoint(max)
    P.areas[i].floorBox = floorBox;
    box.expandByPoint(min)
    box.expandByPoint(max)

    var areaBox = P.areas[i].areaBox;
    if (areaBox.min.x < floorBox.minX || (areaBox.min.x == floorBox.minX && areaBox.min.y < floorBox.minY)) {
      floorBox.minX = areaBox.min.x;
      floorBox.minY = areaBox.min.y;
      floorBox.topLeft = P.areas[i]
    }
    if (areaBox.min.x < floorBox.minX || (areaBox.min.x == floorBox.minX && areaBox.max.y > floorBox.maxY)) {
      floorBox.minX = areaBox.min.x;
      floorBox.maxY = areaBox.max.y;
      floorBox.bottomLeft = P.areas[i]
    }

    box.center = box.getCenter();
    box.height = box.max.y - box.min.y;
    box.width = box.max.x - box.min.x;
    box.depth = box.max.z - box.min.z;
    floorBox.center = floorBox.getCenter();
    floorBox.height = floorBox.max.y - floorBox.min.y;
    floorBox.width = floorBox.max.x - floorBox.min.x;
    floorBox.depth = floorBox.max.z - floorBox.min.z;
  }
}

P.Scene.Surface.prototype._onInitialize = P.Scene.Surface.prototype.onInitialize;