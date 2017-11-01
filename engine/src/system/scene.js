// base class for scrollbar-based scenes

P.Scene = function(styles) {

  this.merge(P.views.defaults)
  if (styles) 
    this.merge(styles);


}

P.Scene.setCurrentArea = function(area) {
  P.currently.showingArea = area;
  if (P.Import.connection)
    P.Import.setCurrentArea(area)
}
P.Scene.prototype.merge = function(object, target) {
  if (!target)
    target = this;
  for (var property in object) {
    var value = object[property];
    if (typeof value == 'object' && value != null) {
      if (!target[property])
        target[property] = {};
      this.merge(value, target[property])
    } else {
      target[property] = value;
    }
  }
}
P.Scene.prototype.scrollLeft = 0;
P.Scene.prototype.scrollTop = 0;
P.Scene.prototype.onInitialize = function() {
  var target = (wrapper === document.documentElement ? window : wrapper)
  target.onscroll = function(e) {

    //cancelAnimationFrame(wrapper.scrolling)
    //wrapper.scrolling = requestAnimationFrame((function() {
          this.onScroll(e);
    //    }).bind(this))
  }.bind(this)

}

P.Scene.prototype.__onInitialize = P.Scene.prototype.onInitialize;


P.Scene.prototype.onSceneChange = function() {
}

P.Scene.prototype.setScrollSize = function(scrollWidth, scrollHeight) {
  dummy.style.width = scrollWidth + 'px'
  dummy.style.height = scrollHeight + 'px'

  this.availableWidth = Math.max(0, scrollWidth - window.innerWidth);
  this.availableHeight = Math.max(0, scrollHeight - window.innerHeight) ;
}

P.Scene.prototype.scrollAt = function(target) {
  this.scrollTo(
    Math.min(this.availableWidth, Math.max(0, (this.availableWidth / 2 + (this.measurements.target.x - this.measurements.screenCenter.x)))),
    Math.min(this.availableHeight, Math.max(0, (this.availableHeight * this.anchorY - (this.measurements.screenCenter.y - this.measurements.target.y)))) 
  )
}

P.Scene.prototype.getCameraTiltY = function() {
  return 0
}
P.Scene.prototype.getTargetZoom = function() {
  var scene = P.Scene.current
  if (!scene || camera.previousZoom != null) {
    return camera.zoom;
  } else {
    return this.getZoom();
  }
}
P.Scene.prototype.getZoom = function() {
  return this.givenZoom || this.camera && this.camera.zoom || 1
}
P.Scene.prototype.getData = function(onlyAreas) {
  return P.pointer.area || P.currently.showingArea || (!onlyAreas && P.Scene.me && P.Scene.me.area) || (!onlyAreas && P.areas[0])
}
P.Scene.prototype._getData = P.Scene.prototype.getData;

P.Scene.prototype.getBox = function() {
  var area = this.getData();
  var box = new THREE.Box3().copy(area.areaBox);
  box.min.x += area.contentBox.min.x;
  box.min.y += area.contentBox.min.y;
  box.area = area;
  return P.geometry.box(box);
}
P.Scene.prototype._getBox = P.Scene.prototype.getBox

P.Scene.prototype.getCurrentData = function(onlyAreas) {
  return P.currently.showingArea || (!onlyAreas && P.Scene.me && P.Scene.me.area)
}
P.Scene.prototype.getPerspectiveType = function() {
  return P.Scene.cameraPreference || camera.currentType || 'flat'
}
P.Scene.prototype.getTarget = function() {
  if (!P.Scene.target)
    return controls.target.clone();
  return new THREE.Vector3(
    P.Scene.target.getTotalX(false),
    P.Scene.target.getTotalY(false),
    P.Scene.target.getTotalZ(false)
  )
}
P.Scene.prototype._getTarget = P.Scene.prototype.getTarget;

P.Scene.prototype.scrollTo = function(left, top) {
  if (wrapper === document.documentElement) {
    window.scrollTo(left, top)
  } else {

    wrapper.scrollLeft = left;
    wrapper.scrollTop = top;
  }

  this.sceneTime = new Date();
  this.justScrolled = null;
  cancelAnimationFrame(this.scrollFrame)
  this.scrollFrame = requestAnimationFrame(function() {
    console.info('scrolled?', this.justScrolled)
    if (!this.justScrolled) {
      if (wrapper === document.documentElement)
        window.onscroll()
      else
        wrapper.onscroll()
    }
  }.bind(this))
}

P.Scene.prototype.anchorY = 0.5;

P.Scene.prototype.onScroll = function(e) {
  //console.log('scroll', e)
  P.Scene.onCameraMove()
  var date = new Date();

  if (e && date - this.sceneTime < 40 // ignore scroll for the first 150ms after scene change
  ) // throttle scroll subframes
    return;
  this.scrollTime = date;
  this.justScrolled = date;
  var scrollLeft = this.scrollLeft = (wrapper === document.documentElement ? window.pageXOffset : wrapper.scrollLeft)
  var scrollTop = this.scrollTop = (wrapper === document.documentElement ? window.pageYOffset : wrapper.scrollTop)
  if (e && date - this.sceneTime > 1150 && !P.Scene.justOpenedPanel && !P.currently.draggingPerson &&
    (P.Scene.panelTargetScrollLeft != null 
    ? Math.sqrt(Math.pow( P.Scene.panelTargetScrollLeft - scrollLeft , 2) + Math.pow(
                        P.Scene.panelTargetScrollTop - scrollTop, 2)) > 30 
    : true)
  ) {
    if (!P.Panel.expanded)
      P.Panel.close()
    P.Scene.setTarget(null)
  }

  var height = this.availableHeight || 1;
  var width  = this.availableWidth || 1;
  var x = (scrollLeft  / width)
  var y = (scrollTop / height)

  if (P.Panel.expanded  ) {
    var yoffset = (height * this.anchorY - (this.measurements.screenCenter.y - this.measurements.target.y))
  
    var cardHeight = Math.min(window.innerHeight - 80 + P.Panel.expanded.attachY, P.Panel.expanded.targetHeight + 17 + P.Panel.expanded.attachY)
    var oldOffsetY = P.Scene.offsetY || 0
    P.Scene.offsetY = - Math.max(0, cardHeight - window.innerHeight / 2 - (Math.min(0, yoffset))) / height
    y += P.Scene.offsetY 
  } else {
    P.Scene.offsetY = 0;
  }
  var offsetX = (this.measurements.offsetW.x * (0.5 - x) * width) 
              + (this.measurements.offsetH.x * ((this.anchorY - y) * height
              - this.measurements.screenCenterOffset.y))
  var offsetY = (this.measurements.offsetW.y * (0.5 - x) * width) 
              + (this.measurements.offsetH.y * ((this.anchorY - y) * height
              - this.measurements.screenCenterOffset.y))
  var offsetZ = (this.measurements.offsetW.z * (0.5 - x) * width) 
              + (this.measurements.offsetH.z * ((this.anchorY - y) * height
              - this.measurements.screenCenterOffset.y))
  if ((!e && this.animateScene !== false) || this.animateScene) {
    this.animateScene = null;
    P.animate.scene({
      camera: {
        x: this.measurements.cameraX + offsetX,
        y: this.measurements.cameraY + offsetY,
        z: this.measurements.cameraZ + offsetZ
      }
    })
  } else {
    P.animate.hurry(camera.position, 'x', this.measurements.cameraX + offsetX)
    P.animate.hurry(camera.position, 'y', this.measurements.cameraY + offsetY)
    P.animate.hurry(camera.position, 'z', this.measurements.cameraZ + offsetZ)

  }
  controls.target.x = this.measurements.targetX + offsetX;
  controls.target.y = this.measurements.targetY + offsetY;
  controls.target.z = this.measurements.targetZ + offsetZ;
  if (isNaN(controls.target.x + controls.target.y + controls.target.z))
    console.error('NaN on scroll')
  
  P.animate.start()

}


// compute matrix once 
P.Scene.add = function(object, autoupdate) {
  if (!autoupdate) {
    object.updateMatrixWorld()
    object.matrixAutoUpdate = false;
  }
  scene.add(object)
}



P.Scene.getLight = function() {
  var ambient = new THREE.AmbientLight( 0x999999, 1 );
  scene.add(ambient)
  light = new THREE.DirectionalLight( 0xffffff, 0.7 );
  light.castShadow = true;
  light.name = 'sun';
  return light;
}

P.Scene.build = function() {
  if (scene)
    return scene;

  scene = new THREE.Scene();
  var sun = P.Scene.getLight() ;
  scene.add( sun );

  scene.fog = new THREE.FogExp2( 0x111111, 0.1 );
  target = new THREE.Object3D();
  sun.target = target;
  scene.add(target);
  P.pointer = new P.Pointer;

  light.shadow.camera.near = -10000;
  light.shadow.camera.far = 10000;
  light.shadow.camera.left = -1000;
  light.shadow.camera.right = 1000;
  light.shadow.camera.bottom = -1000;
  light.shadow.camera.top = 1000;
  light.shadow.camera.updateProjectionMatrix();
var helper = new THREE.CameraHelper( light.shadow.camera );
scene.add( helper );
  return scene;
};
