P.Pointer = function(x, y, camera, areas, touch) {
  if (!(this instanceof P.Pointer))
    return new P.Pointer(x, y, camera, areas);
  if (camera == null)
    return;
  var v2 = this.v2;
  var raycaster = this.raycaster;
  var sphere = this.sphere;
  var box3 = this.box3;

  this.x = x;
  this.y = y;
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
    v2.x = ( x / window.innerWidth ) * 2 - 1;
    v2.y = - ( y / window.innerHeight ) * 2 + 1;
  // update the picking ray with the camera and mouse position
  var cam = camera.inPerspectiveMode ? camera.cameraP : camera.cameraO || camera;
  cam.translateZ( 30000 );
  var far = cam.far;
  var near = cam.near;
  cam.far = 1000000;
  cam.near = -1000000;
  cam.updateMatrix()
  cam.updateMatrixWorld()
  cam.updateProjectionMatrix()
  raycaster.setFromCamera( v2, cam);
  cam.far = far;
  cam.near = near;
  cam.translateZ( - 30000 );
  cam.updateMatrix()
  cam.updateMatrixWorld()
  cam.updateProjectionMatrix()
  
  var matrix = this.matrix4;
  var quaternion = this.quaternion;
  var v3 = this.v3;
  var scale = this.scale;

  if (P.Scene.state === 'search') {
    var area = P.currently.showingArea;
    var zones = area.zones;
    for (var i = 0, j = zones.length; i < j; i++) {
      var zone = zones[i]
      if (!zone.visible) continue

      var box = zone.getBox(true, box3, 150);

      var offsetX = 0;
      var offsetY = 0;

      var point = raycaster.ray.intersectBox(box3);
      if (point) {
        this.zone = zone;
        this.area = area;
        this.position = point
        this.coordinates = {
          x: - point.z - box3.min.z,
          y: point.x - box3.min.x
        }
        break;
      }
    }
  } else {
    for (var i = 0, j = areas.length; i < j; i++) {
      var area = areas[i]
      if (!area.visible) continue

      var box = area.box;

      var offsetX = P.currently.editingArea === area ? window.innerWidth / 2 : 0;
      var offsetY = P.currently.editingArea === area ? window.innerHeight / 2 : 0;

      box3.min.x = area.offset.x + box.min.y - offsetY;
      box3.min.y = area.offset.y// + area.coordinates.z;
      box3.min.z = area.offset.z - box.max.x - offsetX

      box3.max.x = area.offset.x + box.max.y + offsetY;
      box3.max.y = area.offset.y// + 1 + area.coordinates.z;
      box3.max.z = area.offset.z - box.min.x + offsetX;

      /*
      if (!area.mesh) {
        area.mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(box3.max.x -box3.min.x, 1, box3.max.z - box3.min.z))
        scene.add(area.mesh)
      }
        area.mesh.position.x = box3.max.x - (box3.max.x -box3.min.x) / 2
        area.mesh.position.y = box3.max.y
        area.mesh.position.z = box3.max.z - (box3.max.z -box3.min.z) / 2
    
        console.log(area.mesh.position)
      */
      var point = raycaster.ray.intersectBox(box3);
      if (point) {
        this.pickArea(area, point)
      }
    }
  }

  var results = []

  if (P.Panel.instances.material.visible)
    results.push.apply(results, this.intersectLabels(P.Panel.instances))
  if (P.Label.instances.material.visible)
    results.push.apply(results, this.intersectLabels(P.Label.instances.front, null, 10))
  if (P.Icon.instances.material.visible) {
    results.push.apply(results, this.intersectLabels(P.Icon.instances.front, 35))
    results.push.apply(results, this.intersectSpheres(P.Icon.instances.front, 35))
  }
  if (P.Furniture.instances.material.visible && this.coordinates && P.Pointer.furniture)
    results.push.apply(results, this.intersectPolygons(P.Furniture.instances, null, function(furniture) {
      return furniture.type.isWorkplace
    }))
  if (P.Furniture.instances.material.visible && this.coordinates)
    results.push.apply(results, this.intersectPolygons(P.Furniture.instances, null, function(furniture) {
      return furniture.type.onClick
    }))

  if (P.Scene.state !== 'location') {
    if (P.Icon.instances.material.visible) 
      results.push.apply(results, this.intersectSpheres(P.Icon.instances, 35))
    if (P.Company.instances.material.visible) 
      results.push.apply(results, this.intersectSpheres(P.Company.instances, 35))
    if (P.Person.instances.material.visible)
      results.push.apply(results, this.intersectSpheres(P.Person.instances, 40) , function(person) {
        return !(person.workplace);
      })
    if (P.Label.instances.material.visible) 
      results.push.apply(results, this.intersectLabels(P.Label.instances, null, 15))
  } else {
    results.push.apply(results, this.intersectSpheres(P.Person.instances, 40, function(person) {
      return P.Scene.meVisible == person
    }))
  }
  //console.log(results)
  if (results.length) {
    results = results.sort(function(a, b) {
      var p1 = a.object.pointerPriority || 0;
      var p2 = b.object.pointerPriority || 0;
      if (!a.xy) a.xy = P.Scene.getScreenXY(a.center)
      if (!b.xy) b.xy = P.Scene.getScreenXY(b.center)
      var d1 = Math.sqrt(Math.pow(a.xy.x - this.x, 2) + Math.pow(a.xy.y - this.y, 2), 1 )
      var d2 = Math.sqrt(Math.pow(b.xy.x - this.x, 2) + Math.pow(b.xy.y - this.y, 2), 1 )
      return (p2 - p1) || (d1 - d2) || (b.object.opacity - a.object.opacity)
    }.bind(this))
    
    this.target = results[0];
    this.targets = results;
  }
  if (P.pointer.target && P.pointer.target != this.target && P.pointer.target.object.onHoverOut)
    P.pointer.target.object.onHoverOut(this, P.pointer.target)
  if (this.target) {
    this.target.object.onHover(this, this.target)

    // only register press while hovering on desktop
    if (!('ontouchstart' in document)) {
      if (this.target.object instanceof P.Person || this.target.object instanceof P.Workplace) {
        P.hammer.press.options.enable = true;
      } else {
        P.hammer.press.options.enable = false  ;
      }
    }
  }
  return this
}
P.Pointer.prototype.intersectPolygons = function(instances, radius, filter) {
  var results = [];
  var objects = instances.lastVisible
  if (objects) for (var k = 0, l = objects.length; k < l; k++) {
    var object = objects[k];
    if (!object.furnitureBox.polygon)
      object.exportFurniture();
    if (filter && !filter(object))
      continue

    if (P.Area.intersectPolygon(this.coordinates, object.furnitureBox.hullPoints)
      || P.geometry.distanceToPolygon(this.coordinates, object.furnitureBox.hull) < (('ontouchstart' in document) ? 20 : 10)) {
      var point = this.position.clone()
      point.center = point;
      point.object = object
      results.push(point)
    }
  }
  return results;
}

P.Pointer.prototype.intersectSpheres = function(instances, radius, filter) {
  var positions = instances.geometry.attributes.instancePosition.array;
  var objects = instances.lastVisible
  var results = [];
  if (objects) for (var k = 0, l = objects.length; k < l; k++) {
    var object = objects[k];
    if (!object.shouldBeDisplayed() || object.opacity < 0.4 || filter && filter(object) === false)
      continue;
    this.sphere.center.set(
      positions[k * 3],
      positions[k * 3 + 1] ,
      positions[k * 3 + 2]        
    )
    this.sphere.radius = (radius || 25) * instances.zoom * (object.zoom) / object.getZoom();
    var point = this.raycaster.ray.intersectSphere(this.sphere);
    if (point) {
      point.center = this.sphere.center.clone()
      point.object = object;
      results.push(point);
    }
  }
  return results;
}
P.Pointer.prototype.intersectLabels = function(instances, value, padding) {
  var box3 = this.box3;
  var labels = instances.lastVisible
  var results = [];

  var result = [];
  if (value == null)
    value = 0.5
  if (labels)
  for (var k = 0, l = labels.length; k < l; k++) {
    var label = labels[k];
    if (label.opacity < 0.5)
      continue;
    
    this.matrix4.compose(
      instances.getPositionAt(label.index, this.v3),
      instances.getQuaternionAt(label.index, this.quaternion), 
      instances.getScaleAt(label.index, this.scale))

    if (!padding)
      padding = 0;
    var point = null;
    if (label.isBillboard() || label.isForeground()) {
      var center = P.Scene.getScreenXY(this.v3);
      var dX = this.x - center.x;
      var dY = this.y - center.y;
      var minX = center.x - ((this.scale.x + padding) / 2) * camera.zoom + (label.paddingLeft || 0)
      var maxX = center.x + ((this.scale.x + padding) / 2) * camera.zoom + (label.paddingRight || 0)
      var minY = center.y - ((this.scale.y + padding) / 2) * camera.zoom + (label.paddingTop || 0)
      var maxY = center.y + ((this.scale.y + padding) / 2) * camera.zoom + (label.paddingBottom || 0)
      if (this.x >= minX && this.x <= maxX && this.y >= minY && this.y <= maxY) {
        var point = new THREE.Vector3(center.x + dX, center.y + dY, 0).unproject(camera)
        var intersection = {
          x: this.x - minX,
          y: this.y - minY
        }
      }
    } else {
      box3.min.set(
        -value - (padding / this.scale.x / 2),
        -value - (padding / this.scale.y / 2),
        -value - (padding / this.scale.z / 2)        
      )
      box3.max.set(
        value + (padding / this.scale.x / 2),
        value + (padding / this.scale.y / 2),
        value + (padding / this.scale.z / 2)      
      )
      
      intersection = null;
      box3.applyMatrix4(this.matrix4)
      var point = this.raycaster.ray.intersectBox(box3);
    }
      
    //if (point)
    //  console.info(point, box3.max.y - point.y, - (point.z - box3.max.z), point.x - box3.min.x)

    if (label && point) {
      if (!label.onBeforeHover || label.onBeforeHover(this, point) !== false) {
        point.intersection = intersection
        point.center = this.v3.clone()
        point.object = label;
        results.push(point);
      }
    }
  }
  return results;
}

P.Pointer.prototype.pickArea = function(area, point) {
  var current = this.area;
  var currentZone = this.zone;
  this.zone = null;
  // world xyz

  this.position = point;

  // map x,y coordinates
  this.coordinates = {
    x: - point.z + area.offset.z,
    y: point.x - area.offset.x
  }
  this.area = area;

  var zones = this.area.zones.slice()
  zones.sort(function(a, b) {
    if (a === P.currently.editingZone)
      return -1;
    if (b === P.currently.editingZone)
      return 1;
    return 0;
  })
  var minDistance = Infinity;

    for (var z = 0; z < zones.length; z++) {
      var d = Math.sqrt(
          Math.pow((zones[z].contentBox.min.x + zones[z].width / 2) - this.coordinates.x, 2) +
          Math.pow((zones[z].contentBox.min.y + zones[z].height / 2) - this.coordinates.y, 2)
        )
      if (P.Area.intersectPolygon(this.coordinates, zones[z].hullPoints)
        && d < minDistance) {
        minDistance = d
        this.zone = zones[z];
        this.hoverZone = this.zone;
        //console.log('zone', this.zone.title)
      }
    }

  return true;
}
P.Pointer.prototype.raycaster  = new THREE.Raycaster;
P.Pointer.prototype.v2         = new THREE.Vector2;
P.Pointer.prototype.v3         = new THREE.Vector3;
P.Pointer.prototype.scale      = new THREE.Vector3;
P.Pointer.prototype.sphere     = new THREE.Sphere;
P.Pointer.prototype.plane      = new THREE.Plane;
P.Pointer.prototype.box3       = new THREE.Box3;
P.Pointer.prototype.quaternion = new THREE.Quaternion;
P.Pointer.prototype.matrix4    = new THREE.Matrix4;

P.Pointer.prototype.getPoint = function(point) {
  if (!point)
    point = P.pointer.position;
  if (!point) return
  var grid = 5;
  return new THREE.Vector3(
    Math.floor((point.x) / grid) * grid,
    (P.currently.showingArea || P.currently.editingArea ||P.pointer.area).offset.y, 
    Math.floor((point.z ) / grid) * grid);
}

P.Pointer.prototype.shouldRender = function(old) {
  if (P.Scene.state === 'editor' || old.person != this.person || old.workplace != this.workplace || old.company != this.company || old.object != this.object)
    if (!old || old.zone != this.zone || old.area != this.area || old.person != this.person || old.workplace != this.workplace || old.company != this.company || old.object != this.object)
      return true;

};
