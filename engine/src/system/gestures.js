P.gestures = function(element) {

  P.hammer = new Hammer.Manager(element, {touchAction: 'manipulation'});

  // create a pinch and rotate recognizer
  // these require 2 pointers


  var pinch = new Hammer.Pinch({
    threshold: 0.2
  });
  P.hammer.press = new Hammer.Press({
    time: 'ontouchstart' in document ? 200 : 200
  });
  var longpress = new Hammer.Press({
    time: 600,
    event: 'longpress'
  });
  var panrotate = new Hammer.Pan({
    pointers: 2,
    threshold: 60,
    event: 'panrotate'
  })
  var tap = new Hammer.Tap({
    interval: 400,
    threshold: 20
  })
  // we want to detect both the same time

  P.hammer.add([pinch, panrotate]);
    P.hammer.add(P.hammer.press)
  P.hammer.add(tap)
  P.hammer.add(longpress)



  //P.hammer.on("dragstart", P.Scene.onDragStart);
  //P.hammer.on("dragmove", P.Scene.onDragMove);

  P.hammer.on("dragend", P.Scene.onDragEnd);
  P.hammer.on("dragcancel", P.Scene.onDragCancel);
  
  P.hammer.on("press", function(ev) {
    console.error('press')
    if (!P.Scene.onDragStart(ev) && P.Scene.state != 'location')
      P.Scene.onTap(ev)
  });
  P.hammer.on("longpress", function() {
    if (P.currently.draggingPerson)
      return;
    if (P.Scene.state === 'editor')
      return;
    P.Scene.showPanels = !P.Scene.showPanels
    if (P.Scene.state === 'location') {
      P.Scene.navigate('location')
    } else {
      if (P.Scene.showPanels)
        P.Scene.navigate('chart');
      else
        P.Scene.navigate('floor');
    }
  });






 // P.hammer.add(new Hammer.Press())
  var panOffset = 0;
  var zoomOffset = 0;
  P.hammer.on("pinch", P.Scene.onPinch);

   
  P.hammer.on("rotate", function(ev) {
    ev.preventDefault();
  });
 P.hammer.on("panrotate", function(ev) {
   if (camera.previousZoom != null || camera.currentType == 'flat')
    return
   if (!P.hammer.rotating) {
     P.hammer.rotating = ev.angle;
     controls.handleMouseDownRotate(ev.pointers[0], 0);
   }
     controls.handleMouseMoveRotate(ev.pointers[0]);
   console.log('rotate', ev, (P.hammer.rotating - ev.angle) / 180)
 });
 P.hammer.on("panrotateend", function(ev) {
   if (camera.previousZoom != null || camera.currentType == 'flat')
    return
   if (!P.hammer.rotating) {
     P.hammer.rotating = ev.angle;
     controls.handleMouseDownRotate(ev.pointers[0], 0);
   }
     controls.handleMouseMoveRotate(ev.pointers[0]);
   console.log('rotate', ev, (P.hammer.rotating - ev.angle) / 180)
 });
  P.hammer.on("hammer.input", function(ev) {
    //console.log('hammer input', ev)
    switch (ev.srcEvent.type) {
      case 'touchend':
      case 'touchmove':
      case 'touchstart':
      case 'touchcancel':
        if (ev.pointers.length > 1 || ev.srcEvent.scale != 1)
          ev.preventDefault()
    }
    if ((ev.srcEvent.type == 'touchend' || ev.srcEvent.type == 'touchcancel')) {
      if (camera.previousZoom) {
        setTimeout(function() {
          P.Scene.onZoomFinish(ev);
          camera.previousZoom = null
        }, 50)
      }

      if (P.hammer.rotating) {
       controls.handleMouseUp(ev.srcEvent);
        P.hammer.rotating = null;
      }


    }
  });

 // P.hammer.on('press', function(ev) {
 //   P.Scene.nextCamera()
 // })
  var currentFloor;

  P.hammer.justTapped = false;
  P.hammer.justDropped = false;
  P.hammer.justQuicklyTapped = false;
  if (wrapper.tagName == 'DIV')
    wrapper.onmouseup = function(e) {
      setTimeout(function() {
        if (!P.hammer.justTapped && !P.hammer.justDropped && !P.currently.draggingPerson)
          onClick(e, P.hammer.justQuicklyTapped)
      }, 50);
    }

  P.Scene.onTap = function(e) {
    P.hammer.justTapped = true;
    setTimeout(function() {
      P.hammer.justTapped = false;
    }, 350);

    if (P.hammer.justDragged)
      return;

    if (P.currently.draggingPerson) {
      return P.Scene.onDragEnd(e)
    }
    setTimeout(function() {
      P.hammer.justQuicklyTapped = false;
    }, 200);

    if (P.currently.draggingPerson) {
      P.Scene.onDragEnd()
    } else {
      onClick(e, P.hammer.justQuicklyTapped)
      P.hammer.justQuicklyTapped = true;
    }
  }
  P.hammer.on('tap', P.Scene.onTap)

};













onClick = function(ev, isSecondTap) {
  for (var t = ev.target; t; t = t.parentNode)
    if (t.tagName && t.tagName.match(/SELECT|INPUT|TEXTAREA|IFRAME/)) {
      return
    }
  ev.preventDefault()

  if (!P.Scene.current || new Date - P.Scene.current.sceneTime < 150)
    return
  // revent touches shortly after scroll
  if (isSecondTap && !P.Scene.target && P.Scene.current.isZoomEnabled() && P.Scene.state != 'editor') {
    if (Math.abs(camera.zoom - 1) < 0.3)
      P.Scene.current.camera.zoom = 0.59
    else
      P.Scene.current.camera.zoom = 1
    
    P.Scene.navigate(P.Scene.state, null, P.pointer.position)
    P.animate.property(camera, null, 'zoom', P.Scene.current.camera.zoom)
    return 
  }
  if (P.Scene.current && new Date - P.Scene.current.justScrolled < 100 && ev.srcEvent.type.indexOf('touch') > -1)
    return ev.preventDefault();

    if (ev.center) {
      onMouseMove({
        clientX: ev.center.x, 
        clientY: ev.center.y,
        shiftKey: ev.srcEvent.shiftKey,
        metaKey: ev.srcEvent.metaKey,
        ctrlKey: ev.srcEvent.ctrlKey,
        type: 'touch'}, true)
      ev = ev.srcEvent
    } else {
      onMouseMove(ev, true)
    }
  if (ev.shiftKey) {
    if (P.Scene.state === 'editor') {
      return  P.Scene.navigate('floor');
    } else {
      if (!P.views.editor.getData(true)) {
        var area = P.Area.createNew();
        if (!area)
          return
        area.computeBox()
        area.computeAreaBox()
        P.views.location.computeLayout()
        P.Scene.needsUpdate()
        P.currently.showingArea = area;
      }
      return  P.Scene.navigate('editor');
    }
  }
  if (ev.metaKey && P.Scene.state !== 'editor') {
    return  P.Scene.navigate('location');
  }
  if (P.pointer.label && P.pointer.label.onClick && P.pointer.label.onClick(ev, P.pointer) === false)
    return false;
  if (P.pointer.company && P.pointer.company.onClick && P.pointer.company.onClick(ev, P.pointer) === false)
    return false;

  
  if (P.pointer.icon)
    switch (P.pointer.icon.type) {

      case P.Icon.buttons.relations_active:
        if (P.Scene.current.camera.originalZoom == null)
          P.Scene.current.camera.originalZoom = P.Scene.current.camera.zoom
        if (Math.abs(camera.zoom - 1) < 0.3)
          P.Scene.current.camera.zoom = 0.59
        else
          P.Scene.current.camera.zoom = 1
        P.Scene.navigate('graph');
        P.animate.start();
        return

      case P.Icon.buttons.relations_inactive:
        if (!P.Scene.target || !(P.Scene.target instanceof P.Person || P.Scene.target instanceof P.Company || P.Scene.target instanceof P.Workplace)) {
          P.Panel.close()
          if (P.currently.showingArea && P.currently.showingArea.people.length && P.Scene.me.area != P.currently.showingArea)
            P.Scene.setTarget(P.currently.showingArea.people[0])
          else
            P.Scene.setTarget(P.Scene.me)
        }
        if (P.Scene.target instanceof P.Workplace) {
          P.Scene.setTarget(P.Scene.target.person);
          P.Panel.open(P.Scene.target)
        }
        P.Scene.navigate('graph')
        P.animate.start();
        return

      case P.Icon.buttons.layout_active:
        if (P.Scene.current.camera.originalZoom == null)
          P.Scene.current.camera.originalZoom = P.Scene.current.camera.zoom
        if (Math.abs(camera.zoom - 1) < 0.3)
          P.Scene.current.camera.zoom = 0.59
        else
          P.Scene.current.camera.zoom = 1
        if (P.Scene.target)
          P.pointer.area = P.Scene.target.area
        P.Scene.navigate('floor');
        P.animate.start();
        return

      case P.Icon.buttons.layout_inactive:
        if (P.Scene.target)
        var company = (P.Scene.target instanceof P.Company 
                        ? P.Scene.target
                        : P.Scene.target instanceof P.Label.Company 
                                       ? P.Scene.target.company : null)
        if (company) {
          P.areas.forEach(function(area) {
            area.zones.forEach(function(zone) {
              if (zone.company_owner_id == company.id) {
                P.pointer.area = area
                point = zone.getCenter(false)
              }
            })
          })
          if (!point && company.people.length)
            P.Scene.setTarget(company.people[0])
        } else if (!P.Scene.target && !P.currently.showingArea) {
          P.Scene.setTarget(P.Scene.me)
        }
        if (P.Scene.target) {
          P.pointer.area = P.Scene.target.area;
        } else if (!point) {
          var point = P.currently.showingArea.getCenter(false)
        }
        P.Scene.navigate('floor', null, point)
        P.animate.start();
        return

      case P.Icon.buttons.publish:
        if (confirm("Are you sure to publish this area?"))
          P.Scene.publishArea()
        return;

      case P.Icon.buttons.search:
        P.Scene.showSearch();
        return

      case P.Icon.buttons.delete:
        if (!P.currently.editingArea)
          return;

        var password = 'DELETE ' + P.currently.editingArea.title.toUpperCase()
        if (prompt('Do you *really* want to delete this area? Type ' + password + ' below' ) == password) {
          P.Scene.deleteArea(P.currently.editingArea)

        }
        return
      case P.Icon.buttons.flatCamera: 
      case P.Icon.buttons.isometricCamera:
        P.pointer.area = null
        P.pointer.zone = null
        if (P.pointer.icon.type === P.Icon.buttons.flatCamera) {
          P.Scene.cameraPreference = 'flat';
          P.Scene.navigate(P.Scene.state);
        } else {
          P.Scene.cameraPreference = 'isometric';
          P.Scene.navigate(P.Scene.state);
        }
        return
    }

  if (P.Scene.isSearchVisible()) {
    document.activeElement.blur()
    var animate = true;
  }

  if (P.pointer.label && P.pointer.label.parent ||
             P.pointer.icon && P.pointer.icon.parent) {
    P.Panel.open((P.pointer.label || P.pointer.icon).parent)

    P.Scene.setTarget(P.pointer.label || P.pointer.icon);
    P.Scene.current.onInitialize()
    P.animate.start();
  } else if (P.pointer.workplace) {
    P.pointer.workplace.onClick(ev)
  } else if (P.pointer.person) {
    P.pointer.person.onClick(ev)
  } else if (P.pointer.zone && P.Scene.state === 'search') {
    P.Scene.navigate('floor', null, P.pointer.zone.getCenter(false), null, 1.11)
  } else if (P.Scene.current.onClick && P.Scene.current.onClick(ev, P.pointer) === false) {
    return false
  } else {

    if (P.pointer.object && P.pointer.object.type && P.pointer.object.type.onClick)
      if (P.pointer.object.type.onClick.call(P.pointer.object, ev, P.pointer) === false)
        return false;

    if (!P.Scene.justOpenedPanel && P.Panel.current.length) {
      var expanded = P.Panel.expanded;
      P.Panel.close()
      P.Scene.setTarget(null)
      if (expanded)
        P.Scene.current.onInitialize()
      P.animate.start();
    } else if (P.pointer.area && P.pointer.area != P.currently.showingArea && P.Scene.state == 'chart') {
      P.Scene.navigate('chart');
    } else if (P.Scene.state == 'graph') {
      return
    } else if (P.pointer.area && P.pointer.area !== P.currently.showingArea && P.Scene.state == 'floor') {
      P.Scene.navigate('floor')
    } else if (P.Scene.state === 'location' && P.pointer.area) {
      P.Scene.navigate('floor')
    } else if (animate)
      P.animate.start()
  }
  return
}
