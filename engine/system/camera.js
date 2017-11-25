
P.Scene.cameraDirection = new THREE.Vector3;
P.Scene.v3 = new THREE.Vector3;



P.Scene.nextCamera = function(remember) {
  P.Scene.cameraPreference = camera.currentType == 'flat' ? 'isometric' : 'flat'
  P.Scene.current.onInitialize()
  P.Scene.stopStickyPerson()
  P.animate.start()
}

P.Scene.onCameraMove = function(rotated) {
  P.instances.list.forEach(function(instances) {
    if (rotated === true)
      instances.changes |= P.UPDATE_ROTATION
    instances.changes |= P.UPDATE_ALIGNMENT;
  })
}
P.Scene.needsUpdate = function(hard) {
  P.instances.list.forEach(function(instances) {
    instances.changes |= P.UPDATE_CULLING;
  })
}

P.Scene.prototype.computeDimensions = function(box, target, type, zoom, point, width, height, depth, centered) {

  if (target == null) {
    target = this.getTarget();
  }
  if (type == null)
    type = this.getPerspectiveType()
  if (zoom == null)
    zoom = this.getZoom();

  // remember current camera settings
  var pos = camera.position.clone()
  var rotation = camera.rotation.clone()
  var oldType = camera.currentType
  var oldZoom = camera.zoom;
  var controlPoint = controls.target.clone();
  if (zoom == null)
    zoom =  1;
  camera.currentZoom = zoom;

  if (width == null) {
    var width = box.max.x - box.min.x;
    var height = box.max.y - box.min.y;
  }

  // reset camera to look at the center of the scene
  // in the target camera mode
  camera.zoom = zoom;
  var oldTarget = controls.target.clone()
  // Set up camera in the middle of area at its current position
  controls.target.set(
    box.center.y, 
    (depth || 0) + (box.area && box.area.getY(false) || 0), 
    - box.center.x
  )
  var center = controls.target.clone()
  var oldType = camera.currentType;
  if (!type)
    type = oldType;
  var tiltY = this.getCameraTiltY ? this.getCameraTiltY() : 0;
  // initialize desired camera angle and position without animation
  P.animate.lock()
  if (type === 'isometric') {
    P.Scene.makeIsometric(controls.target)
  } else if (type === 'flat') {
    P.Scene.makeFlat(controls.target, 0, tiltY)
  }

  P.animate.unlock()

  // remember points
  var cameraX = camera.position.x;
  var cameraY = camera.position.y;
  var cameraZ = camera.position.z;
  var targetX = controls.target.x;
  var targetY = controls.target.y;
  var targetZ = controls.target.z;

  // compute bounding box of the scene as seen by camera
  var min = new THREE.Vector3().set(targetX - height / 2, targetY, targetZ - width / 2)
  var min2 = new THREE.Vector3().set(targetX - height / 2, targetY, targetZ + width / 2);
  var max = new THREE.Vector3().set(targetX + height / 2, targetY, targetZ - width / 2)
  var max2 = new THREE.Vector3().set(targetX + height / 2, targetY, targetZ + width / 2)
  var screen = new THREE.Box3()
  var points = [max,min,max2,min2];
  for (var i = 0; i < 4; i++)
    screen.expandByPoint(P.Scene.getScreenXY(points[i]))

  var elevation1 = P.Scene.getScreenXY(new THREE.Vector3(
    controls.target.x,
    controls.target.y,
    controls.target.z
  ))
  var elevation2 = P.Scene.getScreenXY(new THREE.Vector3(
    controls.target.x,
    controls.target.y + 1,
    controls.target.z
  ))
  var pan1 = P.Scene.getScreenXY(new THREE.Vector3(
    controls.target.x,
    controls.target.y,
    controls.target.z
  ))
  var pan2 = P.Scene.getScreenXY(new THREE.Vector3(
    controls.target.x,
    controls.target.y,
    controls.target.z + 1
  ))
  var elevation = {
    x: elevation1.x - elevation2.x,
    y: elevation1.y - elevation2.y,
    z: elevation1.z - elevation2.z
  }
  var pan = {
    x: pan1.x - pan2.x,
    y: pan1.y - pan2.y,
    z: pan1.z - pan2.z
  }

  var screenCenter = P.Scene.getScreenXY(center);
  var screenCenterOffset = screenCenter.clone()
  screenCenterOffset.x -= window.innerWidth / 2
  screenCenterOffset.y -= window.innerHeight / 2


  // measure pan values
  controls.panOffset.set(0,0,0)
  controls.pan(1, 0)
  var offsetW = controls.panOffset.clone()
  controls.panOffset.set(0,0,0)
  controls.pan(0, 1)
  var offsetH = controls.panOffset.clone()
  controls.panOffset.set(0,0,0)

  var target = (typeof target == 'function' ? target(oldTarget) : target) || oldTarget;
  var targetXYZ = P.Scene.getScreenXY(target);

  //restore camera settings

  controls.target.copy(controlPoint)
  camera.rotation.copy(rotation)
  camera.position.copy(pos)
  camera.zoom = oldZoom;
  P.Scene.setCamera()

  screen.width = screen.max.x - screen.min.x
  screen.height = screen.max.y - screen.min.y
  return {
    scene: screen,

    width: width,
    height: height,

    offsetW: offsetW,
    offsetH: offsetH,
    cameraX: cameraX,
    cameraY: cameraY,
    cameraZ: cameraZ,
    targetX: targetX,
    targetY: targetY,
    targetZ: targetZ,

    // how many pixels is 1 unit-high
    elevation: elevation,
    pan: pan,

    // where is the center of the zone
    center: center,
    screenCenter: screenCenter,

    // how many pixels does camera angle shift centering 
    screenCenterOffset: screenCenterOffset,

    // Compute dimensions of target
    target: targetXYZ,

    position: target

  }
}

P.Scene.makeFlat = function(point, x, y, z) {
  //if (camera.currentType === 'flat' && !point)
  //  return
  if (!point || !camera.currentType)
    point = controls.target;
  controls.enableRotate = false;
  if (camera.currentType != 'flat')
    P.Scene.onPerspectiveChange('flat');
  camera.currentType = 'flat'
  var m1 = new THREE.Matrix4();

  //  camera.position.x = point.x,
  //  camera.position.y = window.innerWidth,
  //  camera.position.z = point.z


  var euler = new THREE.Euler;
  euler.x = - Math.PI / 2 + (x || 0);
  euler.y = (y || 0);
  euler.z = Math.PI / 2 + (z || 0);

  camera.tiltY = y || 0;

  camera.offsetX = 0
  camera.offsetY = 1500
  camera.offsetZ = 0

  controls.target.copy(point);


  
  if (P.animate.locks) {
    camera.position.x = point.x + camera.offsetX;
    camera.position.y = point.y + camera.offsetY;
    camera.position.z = point.z + camera.offsetZ;
    camera.rotation.copy(euler)
    P.Scene.setCamera()
  } else {
    P.animate.scene({
      camera: {
        rotateX: euler.x,
        rotateY: euler.y,
        rotateZ: euler.z,
        x: point.x + camera.offsetX,
        y: point.y + camera.offsetY,
        z: point.z + camera.offsetZ
      }
    });
  }
}


P.Scene.makeIsometric = function(point) {
  if (camera.currentType === 'isometric' && !point)
    return
  if (!point || !camera.currentType)
    point = controls.target;
  controls.enableRotate = true;
  if (camera.currentType != 'isometric')
    P.Scene.onPerspectiveChange('isometric');
  camera.currentType = 'isometric'
  var m1 = new THREE.Matrix4();
  m1.lookAt( camera.position, new THREE.Vector3(
    camera.position.x - 1,
    camera.position.y - 1,
    camera.position.z - 1
  ), camera.up );
  var euler = new THREE.Euler().setFromRotationMatrix(m1)

  controls.target.copy(point);

  if (P.Scene.rotatedPoint) {
    camera.offsetX = P.Scene.rotatedPoint.x;
    camera.offsetY = P.Scene.rotatedPoint.y;
    camera.offsetZ = P.Scene.rotatedPoint.z;
    euler._x = P.Scene.rotationAngle.x
    euler._y = P.Scene.rotationAngle.y
    euler._z = P.Scene.rotationAngle.z
  } else {
    camera.offsetX = 1500
    camera.offsetY = 1500
    camera.offsetZ = 1500
  }

  camera.tiltY = 0;


  if (P.animate.locks) {
    camera.rotation.x = euler._x
    camera.rotation.y = euler._y
    camera.rotation.z = euler._z

    camera.position.x = point.x + camera.offsetX;
    camera.position.y = point.y + camera.offsetY;
    camera.position.z = point.z + camera.offsetZ;

    P.Scene.setCamera()
  } else {
    P.animate.scene({
      camera: {
        rotateX: euler.x,
        rotateY: euler.y,
        rotateZ: euler.z,
        x: point.x + camera.offsetX,
        y: point.y + camera.offsetY,
        z: point.z + camera.offsetZ
      }
    });
  }
}
P.Scene.onPerspectiveChange = function(type) {
  
}

P.Scene.setCamera = function(factor) {
  if (factor == null && camera)
    factor = camera.sizeFactor;
  if (factor == null)
    factor = 1; 
  var d = window.innerHeight * 1 / 2 * factor;
  if (camera) {
    //if (window.innerHeight > window.innerWidth) {
      camera.left = - d * window.innerWidth / window.innerHeight;
      camera.right = d * window.innerWidth / window.innerHeight;
      camera.top = d;
      camera.bottom = -d;
    //} else {
    //  var d = window.innerHeight * 1 / 2//factor;
    //  camera.left = - d;
    //  camera.right = d;
    //  camera.top = d * window.innerHeight / window.innerWidth;
    //  camera.bottom = -d * window.innerHeight / window.innerWidth;
    //}
  } else {
    //camera = new THREE.CombinedCamera(
    //  window.innerWidth, window.innerHeight, 60, -1000, 2000, -1000, 4000
    //) 
    camera = new THREE.OrthographicCamera(
    - d * window.innerWidth / window.innerHeight, 
      d * window.innerWidth / window.innerHeight, 
      d, 
      - d, -100, 800 );

    camera.transitions = {
      zoom: {
        friction: 7,
        tension: 6
      }
    }
   // camera.toOrthographic()
//    camera.rotation.order = 'YXZ';
  }
  camera.sizeFactor = factor;
  camera.updateProjectionMatrix();  
  //camera.updateMatrixWorld(true)
  camera.updateMatrix(true)
  camera.updateMatrixWorld(true)
  if (window.light)
  light.shadow.camera.updateProjectionMatrix()

  P.Scene.measureCamera()
  return camera
}

P.Scene.measureCamera = function() {
  var p = P.Scene.getScreenXY(P.Scene.v3.set(0,0,0));
  P.Scene.oneXPixel = (P.Scene.getScreenXY(P.Scene.v3.set(1,0,0))).sub(p)
  P.Scene.oneYPixel = (P.Scene.getScreenXY(P.Scene.v3.set(0,1,0))).sub(p)
  P.Scene.oneZPixel = (P.Scene.getScreenXY(P.Scene.v3.set(0,0,-1))).sub(p)
  camera.getWorldDirection( P.Scene.cameraDirection  );
}

P.Scene.getScreenXY = function(obj, target){
  if (target == null)
    target = obj.clone();
  else
    target.copy(obj)
  var windowWidth = window.innerWidth;
  var widthHalf = (windowWidth/2);
  var heightHalf = (window.innerHeight/2);

  target.project(camera);

  target.x = ( (target.x) * widthHalf ) + widthHalf;
  target.y = - ( (target.y) * heightHalf ) + heightHalf;
  target.z = 0;
  
  return target;

};