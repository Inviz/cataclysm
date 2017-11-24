
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


  if (camera.zoom < 0.5 && camera.previousZoom < 0.5 && camera.zoom <= camera.previousZoom/* || (ev && ev.deltaTime < 250 && camera.zoom < camera.previousZoom*/) {
    camera.zoom = scene.camera.zoom = camera.previousZoom;

    camera.previousZoom = null;
    P.Scene.navigate('location')
    return true;
  }
  else if (ev && P.Scene.state !== 'location') {
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
  camera.zoom = Math.max(0.45, value);
  var sceneWasZooming = P.animate.cancel(camera, 'zoom');
  P.animate.onPropertyChange(camera, 'zoom')
  if ((camera.zoom < 0.6) ^ (zoom < 0.6) || sceneWasZooming) {
    scene.toggleCompanies()
    scene.toggleLabels()
  }
  if ((camera.zoom < 0.7) ^ (zoom < 0.7) || sceneWasZooming)
    scene.togglePins()
  if ((camera.zoom < 0.8) ^ (zoom < 0.8) || sceneWasZooming)
    scene.togglePeople()
  if (((camera.zoom < 0.9) ^ (zoom < 0.9)) || (camera.zoom < 0.8) ^ (zoom < 0.8) || sceneWasZooming)
    scene.toggleWorkplaces()
  if ((camera.zoom < 1) ^ (zoom < 1) || sceneWasZooming)
    scene.toggleFurniture()
  if ((camera.zoom > 1.1) ^ (zoom > 1.1) || sceneWasZooming)
    scene.toggleLabels()

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

window.addEventListener('message', function(message) {
  P.Import.message(message.data)
})

document.addEventListener('keydown', function(e) {
  var target = e.target;
  if (e.keyCode == 27) { // esc
    if (P.currently.draggingPerson)
      P.Scene.onDragCancel()
  } else if (e.keyCode == 8) { // backspace
    if (P.Scene.target && P.Scene.target instanceof P.Workplace)
      P.Scene.deleteWorkplace(P.Scene.target)
  }
  if (target.tagName !== 'INPUT' && (e.keyCode == 192 || e.keyCode === 0)) {// ` or 0
    e.preventDefault();
    P.Scene.nextCamera();
    P.pointer.area = null;
    P.pointer.zone = null;
//    P.Scene.navigate(P.Scene.state);
  }
  if (target.tagName !== 'INPUT' && e.keyCode == 190) {
    P.Scene.hideZoneLabels = !P.Scene.hideZoneLabels;
    P.areas.forEach(function(area) {

      area.zones.forEach(function(zone) {
        return zone.label.fade(P.Scene.hideZoneLabels ? false : zone.label.willBeVisible())
      })
      area.people.forEach(function(zone) {
        return zone.fade(P.Scene.hideZoneLabels ? false : zone.willBeVisible())
      })
      area.pins.forEach(function(zone) {
        return zone.label.fade(P.Scene.hideZoneLabels ? false : zone.willBeVisible())
      })
      area.workplaces.forEach(function(zone) {
        return zone.fade(P.Scene.hideZoneLabels ? false : zone.willBeVisible())
      })
    })
    P.Scene.needsUpdate()
    P.animate.start();
  }
  var area = P.currently.editingArea || P.currently.showingArea;
  if (e.keyCode == 83 && (e.metaKey || e.shiftKey || e.ctrlKey)) {
    saveAs('PMQ.json', area.export())
    e.preventDefault();
  } else if (e.keyCode == 90 && (e.metaKey || e.ctrlKey)) { //cmd+z
    if (e.shiftKey) {
      P.animate.lock()
      P.Snapshot.redo()
      //P.Scene.navigate(P.Scene.state)
      P.views.editor.onAbort();
      P.Scene.navigate(P.Scene.state);
      //render()
      P.animate.unlock()
    } else {
      P.animate.lock()
      P.Snapshot.undo()
      P.views.editor.onAbort();
      //P.Scene.navigate(P.Scene.state)
      P.Scene.navigate(P.Scene.state);
      //  render()
      P.animate.unlock()
    }
  } else if (e.keyCode == 90 && e.metaKey) { //cmd+z

  }
})


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