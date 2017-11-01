
P.Scene.navigate = function(state, box, target, perspective, zoom) {
  if (state === 'floor' && P.Scene.showPanels)
    state = 'chart'
  console.info("NAVIGATE", state)
  if (P.Scene.state !== state)
    P.Scene.previousState = P.Scene.state;
  P.Scene.panelTargetScrollLeft = null;
  P.Scene.panelTargetScrollTop = null
  if (P.currently.draggingPerson)
    P.Scene.onDragEnd()
  camera.previousZoom = null;
  clearTimeout(P.Scene.rerotating)
  controls.enableRotate = false;
  P.Scene.rerotating = setTimeout(function() {
    if (camera.currentType != 'flat')
      if (!P.Scene.current.controls || P.Scene.current.controls.enableRotate !== false)
        controls.enableRotate = true;
  }, 500)

  P.Scene.state = state;
  P.Scene.needsUpdate()
  document.body.classList.remove('state-' + P.Scene.previousState);
  document.body.classList.add('state-' + state);
  document.body.focus()
  if (P.Scene.current && P.Scene.current.onUnload && P.Scene.current != P.views[state])
    P.Scene.current.onUnload()
  else if (P.Scene.current && P.Scene.current.onReload && P.Scene.current == P.views[state])
    P.Scene.current.onReload()
  var view = P.views[state];
  P.Scene.current = view;
  
  if (view.isZoomEnabled()) {
    if (zoom) {
      view.camera.zoom = zoom;
    } else if (P.Scene.target && P.Scene.previousState) {
      if (P.Scene.target instanceof P.Person && view.camera.zoom < 0.8)
        view.camera.zoom = 0.8;
      if (P.Scene.target instanceof P.Workplace && view.camera.zoom < 0.9) {
        view.camera.zoom = 1;
      }
      if (P.Scene.target instanceof P.Company && view.camera.zoom > 0.6) {
        view.camera.zoom = 0.59;
      }
    }
  }

  var callbacks = P.animate.scene(view)
  if (view.onInitialize)
    view.onInitialize(box, target)
  if (callbacks)
    callbacks.forEach(function(callback) {
      callback.call(view, box, target)
    })
  P.Scene.previousState = null;
};