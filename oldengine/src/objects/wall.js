P.Wall = function(properties) {
  P.Object.call(this, properties)
  if (this.type == null)
    this.type = P.Wall.types.stoneObject

}

P.Wall.prototype = new P.Object;
P.Wall.prototype.constructor = P.Wall;



P.Wall.prototype.destroy = function() {
  var index = this.area.walls.indexOf(this);
  if (index > -1)
    this.area.walls.splice(index, 1);
  var index = this.area.furniture.indexOf(this);
  if (index > -1) {
    this.area.furniture.splice(index, 1);
  }
  if (this.index != null) {
    this.index = null;
  }

  if (this.type.imageSRC) {
    this.onDisappear()
  }
}

P.Wall.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.BoxBufferGeometry( 1, 1, 1, 1),
    P.materials.walls,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'walls',
      sort: function(a, b) {
        return a.renderIndex - b.renderIndex;
      },
      addToSortedList: function(list, object) {
        if (object.area.onlyShowDoors > 0.98 && (!object.type.isDoor || (!object.zones || !object.zones.length)))
          return;
        return list.push(object)
      },
      scaleZ: 1
    }
  )
}

P.Wall.prototype.getPoint = function(point, area, area, atGrid) {
  return {x: - point.z + area.offset.z, y:  point.x - area.offset.x}
};
P.Wall.prototype.moveEnd = function(point, area, area, atGrid) {
  return this.setEnd(- point.z + area.offset.z, point.x - area.offset.x, atGrid)
};
P.Wall.prototype.moveStart = function(point, area, area, atGrid) {
  return this.setStart(- point.z + area.offset.z, point.x - area.offset.x, atGrid)
};
P.Wall.prototype.setEnd = function(x, y, atGrid) {
  if (atGrid) {
    x = P.Wall.atGrid(x);
    y = P.Wall.atGrid(y);
  }
  this.v2.x = x
  this.v2.y = y
  this.distance = Math.sqrt(Math.pow(x - this.v1.x, 2) + Math.pow(y - this.v1.y, 2) )
  this.angle = Math.atan2((this.v2.y - this.v1.y), (this.v2.x - this.v1.x) );
  return this
};
P.Wall.prototype.setStart = function(x, y, atGrid) {
  if (atGrid) {
    x = P.Wall.atGrid(x);
    y = P.Wall.atGrid(y);
  }
  this.v1.x = x
  this.v1.y = y
  this.distance = Math.sqrt(Math.pow(this.v2.x - x, 2) + Math.pow(this.v2.y - y, 2) )
  this.angle = Math.atan2((this.v2.y - this.v1.y), (this.v2.x - this.v1.x) );
  return this
};

P.Wall.prototype.computeUV = function() {
  var size = P.Furniture.getSize(this)
  var variation = this.type.variations ? (this.variation || 0) : 0;

  this._computeUV()
  this.uv.y = this.type.isFixedSize ? 
          this.type.variations ? - (variation % 2) - 1 : 0
        : Math.max(33, size[0] || 0) / 64;
  this.uv.z = this.type.isFixedSize ? 
          this.type.variations ? - Math.floor(variation / 2) - 1 : 0
        : Math.max(33, size[1] || 0) / 64;
  return this.uv;
}

// optimized a bit
P.Wall.prototype.computePosition = function() {
  var offset = this.offset;
  var alignment = this.alignment;
  var parent = this.getParent();
  this.position.x = offset.x + alignment.x + parent.x;
  this.position.y = offset.y + alignment.y + parent.y;
  this.position.z = offset.z + alignment.z + parent.z;
  return this.position
}
P.Wall.prototype.computeScale = function() {
  if (this.type.isFurniture)
    return this.scale;
  var scaleY = this.currentScaleY;
  if (scaleY == null) {
    this.computeType()
    scaleY = this.currentScaleY;
  }
  var wallHeight = this.wallHeight || this.area.wallHeight || 28
  var height = wallHeight * (this.scaleZ || 1)
  this.scale.y = (height * scaleY)
  this.alignment.y = ((height * scaleY * (1 + this.currentTranslateY)) / 2);
  return this.scale;
}

P.Wall.prototype.computeQuaternion = function() {
  return this.quaternion
}
P.Wall.prototype.computeAlignment = function() {
  return this.alignment
}

P.Wall.prototype.computeType = function() {
  if (this.type.isFurniture)
    return this.computeFurniture();

  var wallHeight = this.area.wallHeight || 28;
  var height = wallHeight * (this.scaleZ || 1)

  if (this.isWalled) {
    var scaleY = 0.5;
    var translateY = 1 / 0.5; //should be 0.5
  } else if (this.isWindowed) {
    var scaleY = 0.5;
    var translateY = 0;
  } else if (this.type.isShort) {
    var scaleY = 0.5;
    var translateY = 0
  } else {
    var scaleY = this.scaleY || 1;
    var translateY = this.translateY || 0;
  }

  this.currentScaleY = scaleY;
  this.currentTranslateY = translateY;

  var x = this.v1.x;
  var y = this.v1.y;

  var angle = this.angle;
  if (this.area.onlyShowDoors > 0.98) {
    var rotateX = 0;
  } else {
    var rotateX = (this.type.rotateX || 0);
  }
  if (angle < 0.0) {
      angle += Math.PI * 2;

  } 
  if (angle > Math.PI / 2)
      rotateX = -rotateX

  if (rotateX) {
    var cx = x + (this.v2.x - x) / 2;
    var cy = y + (this.v2.y - y) / 2;

    var tx1 = x-cx
    var ty1  = y-cy
    var shiftX = ( tx1*Math.cos(rotateX) + ty1*Math.sin(rotateX)) + cx - x
    var shiftY = (-tx1*Math.sin(rotateX) + ty1*Math.cos(rotateX)) + cy - y
  }

  var wallHeight = this.area.wallHeight || 28;
  if (this.zone && this.zone.observed === false && !this.outside) {
    this.wallHeight = 2;
    wallHeight = 2;
  }
  var height = wallHeight * (this.scaleZ || 1) * P.Wall.instances.scale.y;

  if (this.area.onlyShowDoors > 0.98 && this.zones && this.type.isDoor) {
    // doors in zones with 20px borders 
    var width = (this.angle % Math.PI) == 0 ? 40 : 25;
    var angle = this.angle
    var zone = this.zones[0]
    var offsetX = (10) / zone.width
    var offsetY = (20) / zone.height
    var scaleX = 1 - offsetX
    var scaleY = 1 - offsetY
    var x1 = (x) * scaleX + 5 + (zone.coordinates.x * offsetX);
    var x2 = (this.v2.x) * scaleX + 5 + (zone.coordinates.x * offsetX);
    var y1 = (y) * scaleY + 10 + (zone.coordinates.y * offsetY);
    var y2 = (this.v2.y) * scaleY + 10 + (zone.coordinates.y * offsetY);
    var capWidth = 0;

  } else {
    if (width == null)
    var width = this.type.isDoor ? 2 : 4 ;
    var x1 = x;
    var x2 = this.v2.x;
    var y1 = y;
    var y2 = this.v2.y;
    var capWidth = width / 2;
  }
  var dx = x2 - x1;
  var dy = y2 - y1;

  x1 = (shiftX || 0) + x1 + (this.capStart || 0) * dx * (capWidth / this.distance);
  y1 = (shiftY || 0) + y1 + (this.capStart || 0) * dy * (capWidth / this.distance);
  x2 = (shiftX || 0) + x2 + (this.capEnd || 0) * dx * (capWidth / this.distance);
  y2 = (shiftY || 0) + y2 + (this.capEnd || 0) * dy * (capWidth / this.distance);

  var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) )

  this.quaternion.setFromAxisAngle(_v3.set(0,-1, 0),angle + rotateX);
  this.scale.set(width,(height * scaleY),(distance* (this.scaleX || 1)))
  this.offset.set(
        (y1 + (y2 - y1) / 2), 
        (offsetY || 0),// + Math.random() * 10,
        - (x1 + (x2 - x1) / 2))
  this.alignment.y = ((height * scaleY) * (1 + translateY) / 2);
}

P.Wall.prototype.computeColor = function() {
  return this.temporaryColor || this.highlightColor || (this.hasOwnProperty('color') && this.color) || this.type.color || this.color
}

P.Wall.prototype.computeOpacity = function() {
  return this.area.onlyShowDoors > 0.38 && this.type.isDoor ? 1 :
        this.temporaryOpacity != null ? this.temporaryOpacity : 
        this.hasOwnProperty('opacity') ? this.opacity : 
        this.type.opacity != null ? this.type.opacity : 1
}

P.Wall.prototype.clean = function(line) {
  for (var line = this; line; line = line.previous) {
    line.temporaryColor = undefined;
    line.temporaryOpacity = undefined;
  }
}

P.Wall.prototype.finish = function() {
  this.remove()
  this.clean()
}
P.Wall.prototype.undoSegment = function() {
  if (this.previous) {
    this.destroy()
    return this.previous;
  }
  return this;
}

P.Wall.prototype.remove = function() {
  this.destroy()
  this.index = null;
  var zone = this.zone;
  var area = this.area || zone && zone.area;
  if (zone) {
    var index = zone.walls.indexOf(this);
    if (index > -1)
      zone.walls.splice(index, 1);
  }
  if (area) {
    var index = area.walls.indexOf(this);
    if (index > -1)
      area.walls.splice(index, 1);
    area.sortWalls()
  }
}

P.Wall.atGrid = function(value) {
  if (value == null)
    return value;
  var grid = 5;
  return Math.floor((value) / grid) * grid;
}

P.Wall.start = function(point, area, offset, current, split) {
  
  for (var first = current; first && first.previous;)
    first = first.previous;

  var x = split ? split.v1.x : P.Wall.atGrid(- point.z + offset.offset.z);
  var y = split ? split.v1.y : P.Wall.atGrid(point.x - offset.offset.x);
  var line = new P.Wall({
    area: area,
    v1: {
      x: x,
      y: y
    },
    v2: {
      x: x,
      y: y
    },
    temporaryColor: new THREE.Color(0.5, 0.5, 1),
    temporaryOpacity: 0.75,
    type: current && current.type
  })
  line.setEnd(x, y)
  // path is closed
  if (first && first.v1.x == line.v1.x && first.v1.y == line.v1.y) {
    current.clean()
    return;
  }
  if (current)  {
    line.setStart(current.v2.x, current.v2.y)
    line.setEnd(current.v1.x, current.v1.y)
    line.previous = current
    current.temporaryOpacity = 0.5;
    current.next = line;
  }
  line.distance = Math.sqrt(Math.pow(line.v2.x - line.v1.x, 2) + Math.pow(line.v2.y - line.v1.y, 2) )

  area.addWall(line);

  return line;
};

P.Wall.splitPaths = function(point, area, offset, current, soft) {
  var lines = P.Wall.getLines(this.getAbsolutePoint(point, offset), 4, offset, [current])
  for (var i = 0; i < lines.length; i+=5) {
    line = lines[i + 1];
    if (line.type.isFurniture)
      continue;
    var split = new P.Wall({
      area: area,
      v1: {
        x: point.x,
        y: point.y
      },
      v2: {
        x: line.v2.x,
        y: line.v2.y
      },
      type: line.type
    })
    split.setStart(point.x, point.y);
    if (soft)
      return split
    line.setEnd(point.x, point.y);

    area.addWall(split)
  }
  return split
}

P.Wall.getPoints = function(point, radius, area, exclude, source) {
  var points = [];
  var walls = source || area.walls.concat(area.furniture || [])
  for (var j = 0; j < walls.length; j++) {
    var line = walls[j];
    if (exclude && exclude.indexOf(line) > -1)
      continue;


    var start = P.geometry.intersectPoint(point, line.v1, radius, area);
    if (start) {
      points.push(line.v1, line, this.getAbsolutePoint(line.v1, area), {x: line.v1.x, y: line.v1.y}, {x: line.v2.x, y: line.v2.y}) 
    }
    var end = P.geometry.intersectPoint(point, line.v2, radius, area);
    if (end) {
      points.push(line.v2, line, this.getAbsolutePoint(line.v2, area), {x: line.v1.x, y: line.v1.y}, {x: line.v2.x, y: line.v2.y}) 
    }
  }
  return points;
}

P.Wall.getLines = function(point, radius, area, exclude, source) {
  var points = [];
  var walls = source || area.walls.concat(area.furniture || [])
  for (var j = 0; j < walls.length; j++) {
    var line = walls[j];
    if (exclude && exclude.indexOf(line) > -1)
      continue;
    var intersected = P.geometry.intersectLine(point, line.v1, line.v2, radius, area)
    if (intersected) {
      points.push(intersected, line, this.getAbsolutePoint(intersected, area), {x: line.v1.x, y: line.v1.y}, {x: line.v2.x, y: line.v2.y}) 
    }
  }
  return points;
}

 
P.Wall.stopMoving = function(points) {
  for (var i = 0; i < points.length; i+=5) {
    points[i + 1].clean();
  }
}

P.Wall.getAbsolutePoint = function(point, area) {
  var grid = 1;
  return new THREE.Vector3().set(
    Math.floor(
      (point.y + (area ? area.offset.x : 0)) / grid
    ) * grid, 
    area.offset.y, 
    Math.floor(
      (- point.x + (area ? area.offset.z : 0)) / grid
    ) * grid
  )
}



P.Wall.prototype.toFurniture = function() {
  this.instances.changes |= this.instances.UPDATE_RESET
  this.instances = P.Furniture.instances
  this.instances.changes |= this.instances.UPDATE_RESET

  this.onAppear = P.Furniture.prototype.onAppear;
  this.onDisappear = P.Furniture.prototype.onDisappear;

  var index = this.area.furniture.indexOf(this);
  if (index == -1)
    this.area.furniture.push(this)
  var index = this.area.walls.indexOf(this);
  if (index > -1)
    this.area.walls.splice(index, 1);

}


P.Wall.prototype.toWall = function() {
  this.instances.changes |= this.instances.UPDATE_RESET
  this.instances = P.Wall.instances
  this.instances.changes |= this.instances.UPDATE_RESET

  this.onAppear = P.Wall.prototype.onAppear;
  this.onDisappear = P.Wall.prototype.onDisappear;

  var index = this.area.walls.indexOf(this);
  if (index == -1)
    this.area.walls.push(this)
  var index = this.area.furniture.indexOf(this);
  if (index > -1)
    this.area.furniture.splice(index, 1);
}
P.Wall.prototype.setType = function(type) {
  var oldType = this.type;
  this.type = type;
  if (oldType.isFurniture ^ type.isFurniture) {
    if (oldType.isFurniture)
      this.toWall()
    else
      this.toFurniture()
  }

  this.frozenSize = null;
  this.changes |= P.UPDATE_RESET
  this.computeFurniture();
  if (oldType.imageSRC && oldType.imageSRC != type.imageSRC) {
    this.onDisappear()
  }
  if (this.appeared)
    this.onAppear()
};


(function() {
var box = new THREE.Box3;
var v3 = new THREE.Vector3;
var euler = new THREE.Euler;
var quaternion = new THREE.Quaternion;
var scale = new THREE.Vector3;
var matrix = new THREE.Matrix4
var a = new THREE.Vector3;
var b = new THREE.Vector3;
var c = new THREE.Vector3;
var d = new THREE.Vector3;
var z = new THREE.Vector3;
P.Wall.prototype.exportFurniture = function() {
  var h = this.furnitureBox.height * this.furnitureBox.scale;
  var w = this.furnitureBox.width * this.furnitureBox.scale
  matrix.compose(
    v3.set(
      this.furnitureBox.x,
      this.furnitureBox.y,
      0
    ),
    quaternion.setFromEuler(
      euler.set(0, 0, this.furnitureBox.finalAngle)
    ),
    scale.set(
      1,
      1,
      1)
  )

  z.set(0.75 * h, 0,0).applyMatrix4(matrix);

  a.set(-0.5 * h,-0.5*w,0).applyMatrix4(matrix);
  b.set(0.5  * h,-0.5*w,0).applyMatrix4(matrix);
  c.set(0.5  * h,0.5 *w,0).applyMatrix4(matrix);
  d.set(-0.5 * h,0.5 *w,0).applyMatrix4(matrix);
  this.furnitureBox.polygon = [
    this.furnitureBox.type,
    parseFloat(a.x.toFixed(4)),
    parseFloat(a.y.toFixed(4)),
    parseFloat(b.x.toFixed(4)),
    parseFloat(b.y.toFixed(4)),
    parseFloat(c.x.toFixed(4)),
    parseFloat(c.y.toFixed(4)),
    parseFloat(d.x.toFixed(4)),
    parseFloat(d.y.toFixed(4))
  ];
  this.furnitureBox.attach = {x: z.x, y: z.y}
  this.furnitureBox.hullPoints = [{x: a.x, y: a.y}, {x: b.x, y: b.y}, {x: c.x, y: c.y}, {x: d.x, y: d.y}]
  this.furnitureBox.hull = [[a.x,a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]
  /*
  if (!P.svg) P.svg = '';
  var points = [];
  for (var i = 0; i < 8; i += 2)
    points.push(this.furnitureBox.polygon[i] + ',' + this.furnitureBox.polygon[i + 1])

  P.svg += '<polygon points="' + points.join(' ') + '" style="fill:lime"/>'
  for (var i = 0; i < 4; i++)
    this.furnitureBox.polygon[i] = parseFloat(this.furnitureBox.polygon[i].toFixed(4))
  if (!this.mesh) {
    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1,1,1,1))
    this.mesh.scale.x = this.furnitureBox.width * this.furnitureBox.scale;
    this.mesh.scale.y = this.furnitureBox.height * this.furnitureBox.scale;

    this.mesh.rotation.z = - (this.furnitureBox.rotateX || 0) - (this.furnitureBox.angle || 0)
    this.mesh.rotation.x = -Math.PI / 2
    scene.add(this.mesh)
  }
  this.mesh.position.x = this.area.getX() + this.furnitureBox.y;
  this.mesh.position.z = this.area.getZ() + - this.furnitureBox.x;
  this.mesh.position.y = this.area.getY() + 3;

*/
  return this.furnitureBox.polygon
}

})();

P.Wall.prototype.computeFurniture = function() {
  var scale = 1 * (this.type.scale || 1);


  var x2 = this.v2.x
  var y2 = this.v2.y
  var x1 = this.v1.x
  var y1 = this.v1.y
  var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) )


  var rotateX = this.rotateX || 0;// this.rotateX || 0
  //var scaleY = 1;
  //var height = 0.0001;
//
  var w = Math.abs(y2 - y1);
  var h = Math.abs(x2 - x1);
  //var offsetY = 1;

  // flip object of fixed size to given orientation
  // updates coordinates, consider it an abstraction-breaking hack
  var frozenSize = this.frozenSize || this.type.isFixedSize;
  if (frozenSize && !this.frozenRatio) {
    var width = frozenSize[0]
    var height = frozenSize[1]
    if (Math.abs(y2 - y1) > Math.abs(x2 - x1)) {
      if (y1 < y2) {
        y2 = y1 + width
      } else {
        y2 = y1 - width
      }
      if (x1 < x2) {
        x2 = x1 + height
      } else {
        x2 = x1 - height
      }
    } else {
      if (y1 < y2) {
        y2 = y1 + height
      } else {
        y2 = y1 - height
      }
      if (x1 < x2) {
        x2 = x1 + width
      } else {
        x2 = x1 - width
      }
    }
    this.setEnd(x2, y2)
  } 

  var angle =this.angle;
  //var width = Math.sqrt()

  // rotate/scale rectangle diagonal keeping its ratio
  if (this.frozenRatio) {
    //var z = this.frozenRatio
    //var angle = this.angle
    //rotateX += Math.atan2((x2-x1) * z,x2-x1)
    //if (this.frozenFlip == null) {
    //  if (w <= h) {
    //    rotateX = - rotateX;
    //  }
    //  if (y1 < y2) {
    //    rotateX = - rotateX;
    //  }
    //  if (x1 > x2) {
    //    rotateX = - rotateX;
    //  }
    //  if (x1 < x2) {
    //    rotateX -= Math.PI
    //  }
    //  this.frozenFlip = rotateX;
    //} else {
    //  rotateX = this.frozenFlip
    //}
    var z = this.frozenRatio
    rotateX = this.lastFlip
    var angle = this.angle - (this.lastAngle || 0)

    var frozenSize = this.frozenSize || this.type.isFixedSize;
    var downscale = frozenSize ? Math.sqrt(frozenSize[0] * frozenSize[0] + frozenSize[1] * frozenSize[1]) / distance: 1
    x2 = this.v1.x + (this.v2.x - this.v1.x) * downscale;
    y2 = this.v1.y + (this.v2.y - this.v1.y) * downscale;
    this.setEnd(x2, y2)
    distance = this.distance
  } else {
    if (w === h && this.lastFlip != null) {
      rotateX = this.lastFlip;
      var z = (w || 5) / (h || 5);
    } else {
      // draw rectangle in given orientation
      // keep width the biggest dimension
      if (this.type.isFixedSize) {

        rotateX = Math.floor((this.angle) / (Math.PI / 2)) * Math.PI / 2 + Math.PI
      } else {
        if (w <= h) {
          var c = w;
          w = h
          h = c;
          rotateX += Math.PI / 2
          if (y1 < y2) {
            rotateX -= Math.PI
          }
        } else {
          if (x1 < x2) {
            rotateX -= Math.PI
          } 
        }
        var z = (w || 5) / (h || 5);
        if (!isFinite(z)) {
          z = 0.1;
        }
      }
      this.lastRatio = z;
      this.lastFlip = rotateX;
    }
    this.lastAngle = this.angle;

    var angle = 0//this.angle;
  }

  if (height == null) {
    var height = Math.sqrt(Math.pow(distance, 2) / (Math.pow(z, 2) + 1))
    var width = Math.sqrt(Math.pow(distance, 2) / (Math.pow(1 / z, 2) + 1))
  }

  if (!this.furnitureBox)
    this.furnitureBox = {};

  var box = this.furnitureBox;
  box.x1 = x1
  box.x2 = x2
  box.y1 = y1
  box.y2 = y2
  box.x = x1 + (x2 - x1) / 2
  box.y = y1 + (y2 - y1) / 2
  box.angle = angle
  box.rotateX = rotateX
  box.finalAngle = (rotateX || 0) + (angle || 0)
  box.width = width;
  box.height = height;
  box.scale = scale;
  box.type = this.type.isChair ? 'chair' : this.type.isTable ? 'table' : this.type.isSofa ? 'sofa' : null;
  box.index = this.type.index;


  this.quaternion.setFromAxisAngle(this._v3.set(0,-1, 0), this.furnitureBox.finalAngle);
  this._q.setFromAxisAngle(this._v3.set(-1,0, 0), Math.PI / 2)
  this.quaternion.multiply(this._q)

  this.offset.set(
        box.y, 
        0.05 - (this.type.zIndex || 0) * 0.05,
        - box.x)

  this.scale.set(box.width * box.scale,box.height* box.scale, 1* box.scale);
  return this.furnitureBox;
}

P.Wall.prototype.onHover = function(pointer) {
  pointer.object = this;
  this.temporaryColor = new THREE.Color(0.6,0.8,0.6)
  P.Furniture.instances.changes |= P.Furniture.instances.UPDATE_COLOR

}
P.Wall.prototype.onHoverOut = function(pointer) {
  this.temporaryColor = null
  P.Furniture.instances.changes |= P.Furniture.instances.UPDATE_COLOR

}
