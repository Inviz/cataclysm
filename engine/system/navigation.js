
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
  
  var callbacks = P.animate.scene(view)
  if (view.onInitialize)
    view.onInitialize(box, target)
  if (callbacks)
    callbacks.forEach(function(callback) {
      callback.call(view, box, target)
    })
  P.Scene.previousState = null;
};