
P.Scene.onBeforeCull = function() {
  //for (var i = 0, j = P.areas.length; i < j; i++) {
  //  var area = P.areas[i];
  //  if (area.changes & 15/*this.UPDATE_OFFSET*/) {
  //    area.updateCurrentPosition();
  //    for (var k = 0, l = area.zones.length; k < l; k++) {
  //      var zone = area.zones[k]
  //      zone.changes = 0;
  //    }
  //  } else {
  //    for (var k = 0, l = area.zones.length; k < l; k++) {
  //      var zone = area.zones[k]
  //      if (zone.changes & 15/*this.UPDATE_POSITION*/) {
  //        zone.updateCurrentPosition();
  //      }
  //      zone.changes = 0;
  //    }
  //  }
  //  area.changes = 0;
  //}
}

P.cull = function() {
  var Area = P.Area;
  var Zone = P.Zone;

  P.cull.changes = [];

  for (var i = 0, j = P.areas.length; i < j; i++) {
    var area = P.areas[i];

    if (P.cull.chosenArea === area || P.cull.check(area)) {
      if ((area.cullChanged = P.cull.show(area))) {
        var changed = Area;
        P.cull.changes.push(area)
      }

      for (var k = 0, l = area.zones.length; k < l; k++) {
        area.zones[k].cullChanged = false;
        var visibility = area.visible && P.cull.check(area, area.zones[k], area.zones[k].box)
        if (visibility && P.cull.show(area.zones[k])) {
          if (changed !== Area) {
            changed = Zone;
            P.cull.changes.push(area.zones[k])
          }
          area.zones[k].cullChanged = true;
        }
        if (!visibility && P.cull.hide(area.zones[k])) {
          if (changed !== Area) {
            changed = Zone;
            P.cull.changes.push(area.zones[k])
          }
          area.zones[k].cullChanged = true;
        }
      } 
    } else {
      if ((area.cullChanged = P.cull.hide(area))) {
        var changed = Area;
        P.cull.changes.push(area)
      }
    }
  }

  P.cull.changed = changed;

  return true


  //console.log(visible.length, 'visible')
}

P.cull.check = function(area, zone, box) {
  var min = P.cull.min;
  var max = P.cull.max;
  var box3 = P.cull.box;

  if (!box)
    box = area.box;

  min.x = (zone || area).getTotalX() + box.min.y - 50;
  min.y = (zone || area).getTotalY() - 120 / camera.zoom;
  min.z = (zone || area).getTotalZ() - box.max.x - (P.Scene.state == 'location' ? 1000 : 0)

  max.x = (zone || area).getTotalX() + box.max.y + 50;
  max.y = (zone || area).getTotalY() + (area ? (P.Scene.showPanels ? 400 : 250) / camera.zoom : 0)
  max.z = (zone || area).getTotalZ() - box.min.x;

  /*
  if (!box.mesh && box != area.box) {
    box.mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(
      max.x - min.x,
      max.y - min.y  + 1,
      max.z - min.z
    ))
    scene.add(box.mesh)
  }
  if (box.mesh) {
    box.mesh.position.z = zone && zone.visible ? min.z + (max.z - min.z) / 2 : -20000000
    box.mesh.position.x = min.x + (max.x - min.x) / 2
    box.mesh.position.y = min.y + (max.y - min.y) / 2
  }*/
  return renderer._frustum.intersectsBox(box3);
}

P.cull.min = new THREE.Vector3(0,0,0);
P.cull.max = new THREE.Vector3(0,0,0);
P.cull.box = new THREE.Box3(P.cull.min, P.cull.max)


P.cull.show = function(area) {
  var result = !area.visible;
  area.visible = true;
  return result;
};

P.cull.hide = function(area) {
  var result = area.visible;
  area.visible = false;
  return result
};

P.cull.setLevel = function(level) {
  if (level != this.level) {
    P.cull.level = level
    //P.cull.changed = true
  }
}



P.cull.areas = function(areas) {
  P.cull.order = [
    P.Pin,
    P.Wall.instances,
    P.Floor.instances,
    P.Line.instances,
    P.Person.instances,
    P.Company.instances,
    P.Furniture.instances,
    P.Overlay.instances,
    P.Underlay.instances,
    P.Label.instances,
    P.Label.instances.front,
    P.Panel.instances,
    P.Icon.instances,
    P.Icon.instances.front,
    P.Sprite.instances,
    P.Sprite.instances.front,
    P.Background.instances,
    P.Background.instances.front
  ]

  // reinitialize render lists
  var cullingChanged = (P.cull.level == P.Area ? P.cull.changed === P.Area : P.cull.changed)
  var batches = P.cull.order.filter(function(batch) {
    if (!batch.material || batch.material.opacity !== 0) {
      if (cullingChanged)
        batch.changes |= P.UPDATE_CULLING
      if (batch.changes & P.UPDATE_CULLING) {
        batch.filter(areas, batch.changes)
      }
      if (batch.lastVisible && batch.lastVisible.length)
        return true;
    }
    if (batch.geometry)
      batch.geometry.maxInstancedCount = 0;
  })

  // recompute dirty values
  batches.forEach(function(batch) {
    batch.batchChanges = batch.compute(batch.lastVisible, batch.changes)
    batch.changes = null;
  });

  // upload changed batches
  batches.forEach(function(batch) {
    if (batch.lastVisibleChanged)
      batch.batchChanges |= P.UPDATE_RESET
    if (batch.upload) {
      batch.upload(batch.lastVisible, batch.lastVisibleChanged ? P.UPDATE_RESET : batch.batchChanges)
    }
    batch.batchChanges = null;
  });

  // render items within current area first
  //if (P.currently.showingArea) {
  //  var index = areas.indexOf(P.currently.showingArea);
  //  if (index > -1 && areas !== 0) {
  //    areas = areas.slice()
  //    areas.splice(index, 1);
  //    areas.unshift(P.currently.showingArea)
  //  }
  //}

};
