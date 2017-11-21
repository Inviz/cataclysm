
function onMouseWheel(e) {
  var scene = P.Scene.current;
  if ((e.shiftKey || e.metaKey || e.ctrlKey))
    e.preventDefault()
  else if (P.Scene.mouseWheelTimeout) {
    e.preventDefault()
    return
  }
  if (!scene || !scene.isZoomEnabled() || ( new Date() - scene.sceneTime < 250) ) {
    return
  };
  if (e.shiftKey || e.metaKey || e.ctrlKey) {
    e.preventDefault();
    console.log('wheel')

    if (P.Scene.state != 'location') {
      if (camera.previousZoom == null)
        camera.previousZoom = camera.zoom;
      var delta=e.deltaY //check for detail first so Opera uses that instead of wheelDelta
      P.Scene.onZoom(Math.min(3, camera.zoom + delta / 120 / 8))

      clearTimeout(P.Scene.mouseWheelTimeout)
      P.Scene.mouseWheelTimeout = null;

      if (!P.Scene.onZoomFinish())
        var notFinished = true;
      else
        camera.previousZoom = null;
      P.Scene.mouseWheelTimeout = setTimeout(function() {
        P.Scene.mouseWheelTimeout = null;
        if (notFinished)
          P.Scene.onZoomFinish(e, scene)
        camera.previousZoom = null;
      }, 300)
    }
  }
}

P.Scene.onZoomFinish = function(ev, scene) {
  if (!scene)
    scene = P.Scene.current;
  if (!scene || !scene.isZoomEnabled()) return;


  //if (camera.zoom < 0.5 && camera.previousZoom < 0.5 && camera.zoom <= camera.previousZoom/* || (ev && ev.deltaTime < 250 && camera.zoom < camera.previousZoom*/) {
  //  camera.zoom = scene.camera.zoom = camera.previousZoom;
//
  //  camera.previousZoom = null;
  //  P.Scene.navigate('location')
  //  return true;
  //}
  //else 
  if (ev && P.Scene.state !== 'location') {
    camera.previousZoom = null;
    P.Scene.current.camera.zoom = camera.zoom
    P.Scene.current.onInitialize()
  }
}
P.Scene.onZoom = function(value) {
  var scene = P.Scene.current;
  if (!scene || !scene.isZoomEnabled()) return;
  var zoom = camera.zoom
  if (P.Scene.current.camera.originalZoom == null)
    P.Scene.current.camera.originalZoom = P.Scene.current.camera.zoom
  camera.zoom = Math.max(0.02, value);
  var sceneWasZooming = P.animate.cancel(camera, 'zoom');
  P.animate.onPropertyChange(camera, 'zoom')

  if (!P.animate.scheduled)
    P.animate.start()
}

//window.addEventListener('scroll', function() {
//  if (wrapper !== document.documentElement)
//    window.scrollTo(0,0)
//})
var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}
 

document.addEventListener(visibilityChange, function() {
  if (!P.initialized)
    return;
  P.Scene.visible = !document.visibilityState || document.visibilityState == 'visible'
  onWindowResize(true)
  //setTimeout(
  //onWindowResize, 100)
});


P.Scene.onPinch = function(ev) {
  var maxZoom = 3;
  var scene = P.Scene.current;
  ev.preventDefault();

  if (camera.previousZoom == null) {
    zoomOffset = 1 - ev.scale
  }

  if (P.hammer.rotating) return
  if (!scene || !scene.isZoomEnabled() || ev.isFinal) return;
  if (ev.isFirst || camera.previousZoom == null) {

    camera.previousZoom = camera.zoom;
  }
  if (!scene.camera.originalZoom)
    scene.camera.originalZoom = scene.camera.zoom;
  var zoom = camera.previousZoom * (ev.scale + zoomOffset);
  if (zoom > maxZoom) {
    zoomOffset -= (zoom - maxZoom) / camera.previousZoom
    zoom = maxZoom;
  }
  scene.camera.zoom = zoom
  P.Scene.onZoom(zoom)
  console.log('pinch', ev)
}