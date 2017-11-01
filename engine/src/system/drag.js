;(function() {


P.Scene.onDragStart = function(ev) {
  if (P.Scene.state !== 'floor')
    return
  //ev.preventDefault()
  controls.enableRotateOld = controls.enableRotate;
  controls.enableRotate = false;
  P.hammer.justDragged = true;
  setTimeout(function() {
    P.hammer.justDragged = false;
  }, 200)
  onMouseMove({
    clientX: ev.center.x, 
    clientY: ev.center.y,
    shiftKey: ev.srcEvent.shiftKey,
    metaKey: ev.srcEvent.metaKey,
    ctrlKey: ev.srcEvent.ctrlKey,
    type: 'touch'})
  P.currently.draggingPerson = P.pointer.person || P.pointer.workplace && P.pointer.workplace.person;
  if (P.currently.draggingPerson) {
    P.Scene.setTarget(P.currently.draggingPerson.workplace || P.currently.draggingPerson, true);
    console.log('start', P.currently.draggingPerson, P.pointer)
    //P.Scene.needsUpdate()
    P.animate.cancel(P.currently.draggingPerson.shift, 'x');
    P.animate.cancel(P.currently.draggingPerson.shift, 'y');
    P.animate.cancel(P.currently.draggingPerson.shift, 'z');
    P.Pointer.furniture = !('ontouchstart' in document);
    P.animate.start()
  }

  return P.currently.draggingPerson
}

  
P.Scene.onDragEnd = function(ev, cancel) {
  if (!P.currently.draggingPerson) {
    P.Pointer.furniture = false;
    return;
  }
  P.hammer.justDropped = true;
  setTimeout(function() {
    P.hammer.justDropped = false;
  }, 350);

  controls.enableRotate = controls.enableRotateOld;
  if (!P.pointer.coordinates || cancel === true) {
    P.currently.draggingPerson.fade(true)
    P.currently.draggingPerson.area.dirtyPeopleLayout = true;  
    P.Area.dirtyPeopleLayout = true;  
    P.animate.start()
    P.currently.draggingPerson = null;
    P.Pointer.furniture = false;

    return;
  }

  P.animate.lock()
  P.animate.property(P.currently.draggingPerson, 'shift', 'x', 0);
  P.animate.property(P.currently.draggingPerson, 'shift', 'y', 0);
  P.animate.property(P.currently.draggingPerson, 'shift', 'z', 0);
  P.currently.draggingPerson.moveToCoordinates(
    P.pointer.coordinates.x,
    P.pointer.coordinates.y
  )
  P.animate.unlock()


  P.Pointer.furniture = true;
  if (ev.center) {
    onMouseMove({
      clientX: ev.center.x, 
      clientY: ev.center.y,
      shiftKey: ev.srcEvent.shiftKey,
      metaKey: ev.srcEvent.metaKey,
      ctrlKey: ev.srcEvent.ctrlKey,
      type: 'touch'})
  }
  P.Pointer.furniture = false;

  var person = P.currently.draggingPerson;
  
  if (P.pointer.object) {
    var x = P.pointer.object.furnitureBox.attach.x
    var y = P.pointer.object.furnitureBox.attach.y
    var workplace = P.Scene.updateWorkplace(person, {
      "point":{"type":"Point","coordinates": [
        x,
        y
      ]},
      "area_id":P.pointer.object.area.id,
      "zone_id": P.pointer.object.zone ? P.pointer.object.zone.id : null,
      "user_id":person.id,
      "user_owner_id":person.id,
      coordinates: {
        x: x,
        y: y
      },
      loaded: true,
      opacity: 0.5
    })
    workplace.area = P.pointer.object.area;
    workplace.zone = P.pointer.object.zone;
    if (person.zone)
      person.zone.dirtyPeopleLayout = true;
    if (workplace.zone)
      workplace.zone.dirtyPeopleLayout = true;
    person.zone = workplace.zone
    person.workplace_id = workplace.id
    P.pointer.object.onHoverOut()
    P.Scene.setTarget(workplace, true);
    P.Scene.setTarget(null)
  } else {
    P.Scene.setTarget(person, true)
    P.Scene.setTarget(null)

  }
  P.currently.draggingPerson = null
  var target = workplace || P.pointer
  P.Import.message(
    P.Scene.positionPerson(person, 
      [target.coordinates.x, target.coordinates.y], 
      workplace && workplace.zone || P.pointer.hoverZone,
      workplace && workplace.id)
  );

  console.log('draggin over')
}


P.Scene.onDragMove = function(ev) {
  if (!P.currently.draggingPerson)
    return;
  if (ev.preventDefault)
    ev.preventDefault()
  P.animate.cancel(P.currently.draggingPerson.offset, 'x');
  P.animate.cancel(P.currently.draggingPerson.offset, 'z');
  P.animate.cancel(P.currently.draggingPerson, 'opacity');
  P.currently.draggingPerson.opacity = 0.8
  P.Person.instances.changes |= P.Person.instances.UPDATE_OPACITY
  if (P.pointer.coordinates) {
    P.animate.lock()
    P.currently.draggingPerson.shiftToCoordinates(
      P.pointer.coordinates.x,
      P.pointer.coordinates.y
    )
    P.animate.unlock()
    P.animate.start();
  }
}

P.Scene.onDragCancel = function(ev) {
  return P.Scene.onDragEnd(ev, true)
}


})();