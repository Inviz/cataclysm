P.views.editor = new P.Scene.Canvas({
  camera: {
    zoom: 2
  },


  people: {
    material: {
      opacity: 0
    }
  },
  sprites: {
    material: {
      opacity: 0
    }
  },
  lines: {
    material: {
      opacity: 0
    }
  },
  furniture: {
    material: {
      opacity: 1
    }
  },
  underlays: {
    material: {
      opacity: 0.3
    }
  },


  makeOverlaysTestDepth: function() {
    P.Overlay.instances.material.depthTest = 0;
    P.Overlay.instances.material.depthWrite = 0;
  },
  restrictRotation: function() {
    controls.minPolarAngle = 0; // radians
    controls.maxPolarAngle = Math.PI; // radians
    controls.minAzimuthAngle = - Infinity; // radians
    controls.maxAzimuthAngle = Infinity; // radians
  },

  isFurnitureVisible: function() {
    return true;
  },
  isWorkplaceVisible: function() {
    return false;
  },
  isPinVisible: function() {
    return false;
  },
  isPersonVisible: function() {
    return false
  },
  closeFloater: function() {
    P.Panel.close()
  },

  onUnload: function() {
    P.Icon.hide('publish')
    P.Icon.hide('delete')
    this.onAbort()
    if ( P.currently.editingArea) {
      P.currently.editingArea.computeBox()
      //P.currently.editingArea.computeAreaBox();
    }
    P.currently.editingArea = null;
    P.currently.editingZone = null;
    P.Scene.cursor.visible = false;
    editormenu.style.top = '-100px';
    editorstatus.style.top = '-100px'
    P.animate.property(P.Wall.instances, null, 'scaleZ', 1)
    if (P.currently.hoverZone)
      P.Area.highlightZone(P.currently.hoverZone, null)
   
    if (P.Scene.backgroundImage) {
      P.Scene.backgroundImage.visible = false;

      P.animate.scene({
        floors: {
          material: {
            opacity: 1
          }
        }
      })
      P.Floor.instances.material.color = new THREE.Color(1,1,1)
    }
  },

  // execute chosen action  
  onBeforeAction: function() {
    if (editormenu) {
      var option = editormenu.options
      var action = editormenu.firstElementChild.value;
      P.views.editor.onAbort()
      P.views.editor[action]()
      this.onAction(null, true)
      render()
    }
  },

  onActionStart: function(hideMenu, hard, zone) {
    //if (P.currently.editingArea != P.pointer.area) {
      P.currently.editingZone = zone || P.pointer.zone;

      P.currently.width = P.areas[0].areaBox.width;
      P.currently.height = P.areas[0].areaBox.height;
    //}
    if (hideMenu) {
      P.currently.hidingMenu = true;
      editormenu.style.top = '-50px';
      editormenu.style.left = '-50px';
    } else {
      P.currently.hidingMenu = null;
    }
  },

  onAction: function(point, soft) {
    var area = P.currently.editingArea || P.pointer.area
    var zone = P.currently.editingZone || P.pointer.zone

    var areaBox = P.areas[0].areaBox
    var width = areaBox.width;
    var height = areaBox.height;
    if (area)
      area.generateFloorHull()

    if (zone)
      zone.updatePolygon()
    if (!soft) {
      var area = P.currently.editingArea || P.pointer.area;
      if (area)
        for (var i = 0; i < area.zones.length; i++)
          area.zones[i].updatePolygon(false, true)
      P.Snapshot.push()
    }
    if (point) {
      var screen = P.Scene.getScreenXY(point);
      editormenu.firstElementChild.focus()
      editormenu.style.top = screen.y + 'px';
      editormenu.style.left = screen.x + 'px';
    }

    //if (area)
    //  area.generateFloorHull()

    var width = P.areas[0].width;
    var height = P.areas[0].height;
    //P.currently.editingArea.computeAreaBox();
    P.Scene.needsUpdate()

    //if (width != P.areas[0].width || height != P.areas[0].height) {
    //P.views.editor.scenes()
    //P.views.editor.scrollHeight()
    //wrapper.onscroll(true)
    //}
  },

  onActionFinish: function() {
    if (P.currently.editingArea) {
      for (var i = 0; i < P.currently.editingArea.zones.length; i++) {
        P.currently.editingArea.zones[i].updatePolygon(false, true)
      }


//      if (P.currently.highlightedZone)
  //      P.Area.highlightZone(P.currently.highlightedZone, P.currently.highlightedZone.temporaryColor, true);

      P.currently.editingArea.clean()
      //P.currently.editingZone = null;;
      P.currently.hidingMenu = null;
    }
    P.Scene.needsUpdate()
  },

  onAbort: function() {
    if (P.currently.resizingPolygon) {
      P.views.editor.onZoneResizeCancel()
    } else if (P.currently.movingPath) {
      P.views.editor.onPathMoveCancel()
    } else if (P.currently.movingPoint) {
      P.views.editor.onPointMoveCancel()
    } else if (P.currently.drawingPath) {
      P.views.editor.onPathFinish()
    }
    P.views.editor.onStatusUpdate()
    P.currently.hidingMenu = null;
  },

  onVariationChange: function() {
    if (P.currently.drawingPath) {
      var object = P.currently.drawingPath;
    } else if (P.currently.movingPath) {
      var object = P.currently.movingPath[1];
    } else if (P.currently.movingPoint) {
      var object = P.currently.movingPoint[1];
    } else if (P.currently.hoverLines) {
      var object = P.currently.hoverLines[1];
    }
    var current = object && object.type;
    if (current) {
      if (current.variations) {
        object.variation = ((object.variation || 0) + 1) % current.variations
        this.onActionStart(true)
        this.onAction()
        this.onStatusUpdate()
        render()
      } else if (current.alternatives) {
        object.setType(P.Wall.types[current.alternatives[0]])
        this.onActionStart(true)
        this.onAction()
        this.onStatusUpdate()
        render()
      }
    }
  },

  onMaterialChange: function(index) {
    if (P.currently.drawingPath) {
      var current = P.currently.drawingPath.type;
    } else if (P.currently.movingPath) {
      var current = P.currently.movingPath[1].type;
    } else if (P.currently.hoverLines) {
      var current = P.currently.hoverLines[1].type;
    } else {
      var current = P.currently.chosenMaterial;
    }
    if (!current)
      current = P.Wall.types.stoneObject
    console.info(current, index)
    switch (index) {
      case 1: case 49:
        if (current === P.Wall.types.inactivePrinter) {
          var type = P.Wall.types.activePrinter
        } else if (current.isTable) {
          var type = P.Wall.types.stoneTable;
        //} else if (current.isSofa) {
        //  var type = P.Wall.types.stoneSofa;
        } else if (current.isChair) {
          var type = P.Wall.types.stoneChair;
        } else if (current.isFurniture) {
          var type = P.Wall.types.stoneFurniture;
        } else {
          var type = P.Wall.types.stoneObject;
        }
        break;
      case 2: case 50:
        if (current === P.Wall.types.activePrinter) {
          var type = P.Wall.types.inactivePrinter
        } else if (current.isTable) {
          var type = P.Wall.types.glassTable;
        } else if (current.isSofa) {
          var type = P.Wall.types.glassSofa;
        } else if (current.isChair) {
          var type = P.Wall.types.glassChair;
        } else if (current.isFurniture) {
          var type = P.Wall.types.glassFurniture;
        } else if (current.isDoor) {
          var type = P.Wall.types.glassDoor;
        } else {
          var type = P.Wall.types.glassObject;
        }
        break;
      case 3: case 51:
        if (current.isTable) {
          var type = P.Wall.types.metalTable;
        } else if (current.isSofa) {
          var type = P.Wall.types.metalSofa;
        } else if (current.isChair) {
          var type = P.Wall.types.metalChair;
        } else if (current.isFurniture) {
          var type = P.Wall.types.metalFurniture;
        } else if (current.isDoor) {
          var type = P.Wall.types.metalDoor;
        } else {
          var type = P.Wall.types.metalObject;
        }
        break;
      case 4: case 52:
        if (current.isFurniture) {
          var type = P.Wall.types.stoneFurniture;
        } else {
          var type = P.Wall.types.stoneShortWall;
        }
        break;
      case 5: case 53:
        if (current.isFurniture) {
          var type = current;
        } else {
          var type = P.Wall.types.frostedObject
        }
        break;
      case 68: //d
        if (current.isDoor) {
          if (current.isGlass) {
            var type = P.Wall.types.glassObject;
          } else {
            var type = P.Wall.types.stoneObject;
          }
        } else {
          if (current.isGlass) {
            var type = P.Wall.types.glassDoor;
          } else {
            var type = P.Wall.types.metalDoor;
          }
        }
        break;
      case 67: //c
        if (current.isGlass) {
          var type = P.Wall.types.glassChair;
        } else if (current.isMetal) {
          var type = P.Wall.types.metalChair;
        } else {
          var type = P.Wall.types.stoneChair;
        }
        var cycle = true;
        break;
      case 83: //s
        var type = P.Wall.types.simpleSofa;
        var cycle = true;
        break;
      case 84: //t
        if (current.isGlass) {
          var type = P.Wall.types.glassTable;
        } else if (current.isMetal) {
          var type = P.Wall.types.metalTable;
        } else {
          var type = P.Wall.types.stoneTable;
        }
        var cycle = true;
        break;

      case 79: //[o]bjects
        var type = P.Wall.types.activePrinter;
        var cycle = true;
        break;

      case 87: //w
        if (current.isGlass) {
          var type = P.Wall.types.glassWall;
        } else if (current.isMetal) {
          var type = P.Wall.types.metalWall;
        } else {
          var type = P.Wall.types.stoneWall;
        }
        break;
    }
    if (!type)
      return;
    if (P.currently.drawingPath) {
      P.currently.drawingPath.setType(type);
      if (current === type && cycle)
        this.onObjectCycle(type, P.currently.drawingPath);
    } else if (P.currently.movingPath) {
      P.currently.movingPath[1].setType(type)
      if (current === type && cycle)
        this.onObjectCycle(type, P.currently.movingPath[1]);
    } else if (!type.isFurniture && P.currently.hoverLines) {
      if (type.isFurniture === current.isFurniture) {
        P.currently.hoverLines[1].setType(type)
        //if (current === type && cycle)
        //  this.onObjectCycle(type, P.currently.hoverLines[1]);
      }
    
    } else if (type.isFurniture && !P.currently.hoverLines) {
      this.onObjectCycle(type, null, false);
      //P.currently.chosenMaterial = type;
     }
    this.onActionStart(true)
    this.onAction()
    this.onStatusUpdate()
    render()
  },

  getMostPopular: function(area, type, exclusions) {
    var found = [];
    area.furniture.forEach(function(object, index) {
      var t = object.type;
      if (t.isTable === type.isTable
      && t.isSofa  === type.isSofa
      && t.isChair  === type.isChair) {
        var m = t.isGlass ? 'g' : t.isMetal ? 'm' : 's';
        var size = P.Furniture.getSize(object)
        var key = m + Math.round(size[0]) + 'x' + Math.round(size[1]);

        for (var i = 0; i < found.length; i++)
          if (found[i].key === key)
            break;

        if (exclusions == null || exclusions.indexOf(object) == -1) {

          if (i === found.length) {
            found.push({count: 1, example: object, key: key})
          } else {
            found[i].count++;
          }
        }
      }
    }, this)

    return found
  },

  onObjectCycle: function(type, path, increment) {
    var area = P.currently.showingArea || P.currently.editingArea;


    
    if (P.currently.movingPath) {
      var furniture = P.currently.movingPath[1]
    } else if (P.currently.drawingPath) {
      var furniture = P.currently.drawingPath
    } else {
      var end = this.getCoordinates();
      end.x += 35;
      end.y += 35;
      var furniture = new P.Wall({
        v1: this.getCoordinates(),
        v2: this.getCoordinates(),
        area: area,
        sample: true
      })
      furniture.setEnd(end.x, end.y)
      P.currently.hoverLines = P.Wall.getPoints(this.getPoint(), 14.5, area, null, [furniture])
      this.onPathMoveStart(true);
      this.onPathMove()
    }

    var found = this.getMostPopular(area, type, [furniture])

    var sorted = found.sort(function(a, b) {
      return b.count - a.count
    }).slice(0, 5)
    var sortedExamples = sorted.map(function(variation) {
      return variation.example
    })

    var key = type.isTable ? 'table' : type.isSofa ? 'sofa' : type.isChair ? 'chair' : 'object';
    if (!this.currentVariation)
      this.currentVariation = {};
    if (furniture.tabIndex == null && this.currentVariation[key]) 
      furniture.tabIndex = sortedExamples.indexOf(this.currentVariation[key].example);
    else
      furniture.tabIndex = (furniture.tabIndex || 0) + 1;
    furniture.tabIndex  %= (sorted.length || 1)



    var variation = sorted[furniture.tabIndex];

    this.currentVariation[key] = variation

    if (variation) {
      furniture.setType(variation.example.type)
      furniture.number = variation.count
      var size = P.Furniture.getSize(variation.example)

      if (P.currently.drawingPath) {
        furniture.frozenSize = size
      } else {
        furniture.frozenSize = size
        furniture.setEnd(furniture.v1.x + size[0], furniture.v1.y + size[1])
        P.currently.movingPath[4].x = P.currently.movingPath[3].x + size[0]
        P.currently.movingPath[4].y = P.currently.movingPath[3].y + size[1]

      }
    }
    else
      furniture.setType(type)
  }, 

  onZoneResizeStart: function(zone) {
    if (P.currently.drawingPath) {
      this.onPathFinish(true)
    }
    if (zone == null)
      zone = P.pointer.zone;
    if (zone) {
      
      P.currently.highlightedZone = P.Area.highlightZone(zone, P.styles.highlightColor, true);
        

      this.onActionStart(true, null, zone);
      P.currently.originalPolygon = P.currently.editingZone.hull.slice();
      P.currently.resizingPolygon = P.currently.editingZone.hull;

      P.currently.editingArea.zones.forEach(function(other) {
        if (other != zone) {
          other.temporaryColor = new THREE.Color(0.7,0.7,0.7);
           P.Area.highlightZone(other, other.temporaryColor, true);
        }
      })
      P.animate.property(P.currently.editingArea, null, 'wallHeight', 2);
      P.animate.start()
    }
  },

  onZoneResize: function(invert) {
    if (P.currently.resizingPolygon) {

      var point = P.currently.hoverPoints && P.currently.hoverPoints[2] ||
                  P.currently.hoverLines && P.currently.hoverLines[2] ||
                  this.getPoint()
      var coordinates = {
        x: P.Wall.atGrid(- point.z + P.currently.editingArea.offset.z),
        y: P.Wall.atGrid(point.x - P.currently.editingArea.offset.x)
      }
      if (invert) {
        P.geometry.removePointFromPolygon(P.currently.resizingPolygon, coordinates);
      } else {
        P.geometry.addPointToPolygon(P.currently.resizingPolygon, coordinates);
      }
      P.currently.editingZone.setPolygon(P.currently.resizingPolygon, true)
      
      P.currently.highlightedZone = P.Area.highlightZone(P.currently.editingZone, P.styles.highlightColor, true);
        

      this.onAction(null, true) // temp
      render()
    }
  },

  onZoneRename: function() {
    var zone = P.pointer.zone;
    if (zone) {
      var title = prompt("Edit zone name", zone.title);
      if (title == null || title.trim() == '') {
        return
      }

      zone.display_label = title;
      zone.title = title;
      zone.onRename()
      zone.label.invalidate();
    } 
  },

  onZoneRemove: function() {
    var zone = P.pointer.zone;
    if (zone && confirm('Are you sure to delete zone named "' + zone.title + '"?')) {
      zone.area.zones.splice(
        zone.area.zones.indexOf(zone),
        1
      )
      zone.label.onDisappear()
      render()
    } 
  },

  onZoneToggle: function() {
    var zone = P.pointer.zone;
    if (zone) {
      zone.observed = (zone.observed == null || zone.observed === true ? false : true)
      zone.label.invalidate()
    } 
  },

  onZoneCreate: function() {
    var title = prompt("Enter name for the new zone")
    if (!title) return;
    var area = P.currently.editingArea || P.pointer.area || P.areas[0];
    var zone = new P.Zone({
      title: title,
      area: area,
      coordinates: this.getCoordinates()
    });

    zone.hull = []
    P.currently.editingZone = zone;
    zone.setPolygon(zone.hull)

    area.zones.push(zone);
    P.animate.property(zone.label, null, 'opacity', 1)
    this.onZoneResizeStart(zone)
    render()

  },

  onZoneResizeFinish: function(invert) {
    if (P.currently.resizingPolygon) {
      P.currently.editingArea.zones.forEach(function(other) {
        other.temporaryColor = null
        P.Area.highlightZone(other, other.temporaryColor, true);
      })
      P.currently.editingZone.setPolygon(P.currently.resizingPolygon, true)
      P.currently.originalPolygon = undefined
      P.currently.resizingPolygon = undefined
      P.animate.property(P.currently.editingArea, null, 'wallHeight', 28);
      this.onAction()
      this.onActionFinish()
      P.animate.start()
    }
  },

  onZoneResizeCancel: function(invert) {
    if (P.currently.resizingPolygon) {
      P.currently.editingArea.zones.forEach(function(other) {
        other.temporaryColor = null
        P.Area.highlightZone(other, other.temporaryColor, true);
      })
      P.currently.editingZone.setPolygon(P.currently.originalPolygon, true)
      P.currently.originalPolygon = undefined
      P.currently.resizingPolygon = undefined
      P.animate.property(P.currently.editingArea, null, 'wallHeight', 28);
      this.onActionFinish()
      P.animate.start()
    }
  },

  // stop drawing path
  onPathFinish: function(soft) {
    // remove last segment
    if (P.currently.drawingPath) {
      P.currently.drawingPath.finish()
      P.currently.drawingPath = undefined
      this.onAction(null, true)
      if (!soft)
        this.onActionFinish()
    }
  },

  // move path to starting point
  onPathClose: function() {
    // remove last segment
    var line = P.currently.drawingPath;
    if (line) {
      for (var first = line; first.previous;)
        first = first.previous;
      line.setEnd(first.v1.x, first.v1.y)
      line.clean()
      P.currently.drawingPath = undefined
      this.onAction()
      this.onActionFinish()
    }
  },

  // start drawing path
  onPathStart: function() {
    
    var point = P.currently.hoverPoints && P.currently.hoverPoints[2] ||
                P.currently.hoverLines && P.currently.hoverLines[2]
    if (point) {
      this.onActionStart(true)
      return P.currently.drawingPath = P.Wall.start(point, P.currently.editingArea, P.currently.editingArea, P.currently.drawingPath)
    }
  },

  // start drawing path and split wall
  onPathSplit: function() {
    var path = this.onPathStart();
    if (path) {
      P.Wall.splitPaths(path.v1, P.currently.editingArea, P.currently.editingArea, path)
    }
    return path;
  },

  // pick an end point for the line
  onPathSet: function() {
    this.onActionStart(true)
    var point = P.currently.hoverPoints && P.currently.hoverPoints[2] ||
                P.currently.hoverLines && P.currently.hoverLines[2] ||
                this.getPoint()

    var drawing = P.currently.drawingPath;

    if (P.currently.hoverLines && (!drawing || !drawing.type.isFurniture)) {
      var split = P.Wall.splitPaths(P.currently.hoverLines[0], P.currently.editingArea, P.currently.editingArea) 
    }
    
    this.onAction(point, !drawing);
    if (!drawing || !drawing.type.isFurniture)
      P.currently.drawingPath = P.Wall.start(point, P.currently.editingArea, P.currently.editingArea, P.currently.drawingPath, split)
    else
      P.currently.drawingPath = null;

    if (P.currently.drawingPath)
      P.currently.drawingPath.point = point;
        
    
    for (var i = 0; i < P.currently.editingArea.zones.length; i++)
      P.currently.editingArea.zones[i].updatePolygon(false, true)

    //P.currently.editingArea.sortWalls()
    if (!drawing)
      this.onAction(null, true)
  },

  setEditingMode: function(editingMode, path) {
    if (editingMode === 'rotate') {
      if (!path.frozenRatio) {
        var frozenSize = path.frozenSize || path.type.isFixedSize;
        if (!frozenSize) 
          frozenSize = path.frozenSize = P.Furniture.getSize(path);


        path.frozenRatio = frozenSize[0] / frozenSize[1]
      }
    } else if (editingMode === 'flip') {
      path.frozenSize = P.Furniture.getSize(path)
    } else {
      //path.frozenRatio = null;
    }
  },

  // move end point of the line
  onPathChange: function(target, points, editingMode) {
    var point = P.currently.hoverPoints && P.currently.hoverPoints[2] ||
                P.currently.hoverLines && P.currently.hoverLines[2] ||
                this.getPoint()
    if (P.currently.drawingPath) {
      this.setEditingMode(editingMode, P.currently.drawingPath)
      if (P.currently.hoverLines && !P.currently.drawingPath.type.isFurniture) {
        var split = P.Wall.splitPaths(P.currently.hoverLines[0], P.currently.editingArea, P.currently.editingArea, P.currently.drawingPath, true) 
      }
        
      if (split)
        var line = P.currently.drawingPath.setEnd(split.v1.x, split.v1.y)
      else
        var line = P.currently.drawingPath.moveEnd(point, P.currently.editingArea, P.currently.editingArea, true)
    }
    if (!line.type.isFurniture && Math.atan2((line.v2.y - line.v1.y), (line.v2.x - line.v1.x) ) % (Math.PI / 4) == 0) {
      line.temporaryColor = new THREE.Color(
        line.type && line.type.color ? line.type.color.r / 2 : 0,
        0.7,
        line.type && line.type.color ? line.type.color.b / 2 : 0);
    }
    else
      line.temporaryColor = undefined

    //P.currently.editingArea.sortWalls()
    P.Wall.instances.changes |= P.Wall.instances.UPDATE_RESET;
    P.Furniture.instances.changes |= P.Wall.instances.UPDATE_RESET;
    return target
  },

  // wall drag & drop
  onPathMoveStart: function(soft) {
    if (P.currently.hoverLines) {
      P.currently.movingPath = P.currently.hoverLines.slice()
      P.currently.movingPath[1].backup = {
        frozenSize: P.currently.movingPath[1].frozenSize && P.currently.movingPath[1].frozenSize.slice(),
        frozenRatio: P.currently.movingPath[1].frozenRatio,
        lastAngle: P.currently.movingPath[1].lastAngle,
        lastFlip: P.currently.movingPath[1].lastFlip
      }
      if (!soft) this.onActionStart(true)
    } 
    return target
  },

  onPathMove: function(target, points, editingMode) {
    var line = P.currently.movingPath && P.currently.movingPath[1];
    if (line) {
      var start = P.currently.movingPath[2]
      var end = this.getPoint()

      this.setEditingMode(editingMode, line)
      if (editingMode === 'rotate') {
        line.moveStart(end, P.currently.editingArea, P.currently.editingArea, true)  
      } else if (editingMode === 'flip') {
        //line.
      } else {
        line.setStart(P.currently.movingPath[3].x + (start.z - end.z), 
          P.currently.movingPath[3].y - (start.x - end.x),
          true)
        line.setEnd(P.currently.movingPath[4].x + (start.z - end.z),
          P.currently.movingPath[4].y - (start.x - end.x),
           true)  
      }
      this.onAction(null, true)
    } 
    return target
  },

  onPathMoveEnd: function(target, points) {
    if (P.currently.movingPath) {
      P.currently.movingPath = null
      this.onAction()
      this.onActionFinish()
    }

    return target
  },

  onPathMoveCancel: function(target, points) {
    if (P.currently.movingPath) {
      if (P.currently.movingPath[1].sample) {
        P.currently.movingPath[1].destroy()
      } else {
        P.currently.movingPath[1].setStart(P.currently.movingPath[3].x, P.currently.movingPath[3].y)
        P.currently.movingPath[1].setEnd(P.currently.movingPath[4].x, P.currently.movingPath[4].y)
        var backup = P.currently.movingPath[1].backup;
        if (backup) {
          for (var property in backup)
            P.currently.movingPath[1][property] = backup[property]
        }
      }
      P.currently.movingPath = null
      this.onActionFinish()
    }
    return target
  },

  onPathRemove: function(target, points) {
    if (P.currently.hoverLines) {
      P.currently.hoverLines[1].remove()
      this.onAction()
    }
  },

  onPathUndo: function() {
    // remove last segment
    if (P.currently.drawingPath) {
      P.currently.drawingPath = P.currently.drawingPath.undoSegment()
      this.onAction(P.currently.drawingPath.point)
    }
  },

  onPathContinue: function() {
    return;
  },

  // start moving point
  onPointMoveStart: function() {
    if (P.currently.hoverPoints) {
      P.currently.movingPoint = P.currently.hoverPoints.slice()
      this.onActionStart(true)
    }
  },

  // move point 
  onPointMove: function(target, points, editingMode) {

    for (var i = 0; i < P.currently.movingPoint.length; i += 5) {
      var position = P.currently.movingPoint[i]
      var wall = P.currently.movingPoint[i + 1];
      var point = P.currently.movingPoint[i + 2];


      this.setEditingMode(editingMode, wall);

      if (wall.v1 === position) {
        var line = wall.moveStart(target, P.currently.editingArea, P.currently.editingArea, true)
      } else {
        var line = wall.moveEnd(target, P.currently.editingArea, P.currently.editingArea, true)
      }
      if (!line.type.isFurniture && Math.atan2((line.v2.y - line.v1.y), (line.v2.x - line.v1.x) ) % (Math.PI / 4) == 0)
        line.temporaryColor = new THREE.Color(
               line.type && line.type.color ? line.type.color.r / 2 : 0,
               0.7,
               line.type && line.type.color ? line.type.color.b / 2: 0);
      else
        line.temporaryColor = undefined
    }
    this.onAction(null, true)
  },

  onPointMoveEnd: function() {
    P.currently.movingPoint = P.Wall.stopMoving(P.currently.movingPoint);
    this.onAction()
    this.onActionFinish()
  },

  onPointMoveCancel: function() {
    if (P.currently.movingPoint) {

      for (var i = 0; i < P.currently.movingPoint.length; i += 5) {
        var wall = P.currently.movingPoint[i + 1];
        wall.v1.x = P.currently.movingPoint[i + 3].x;
        wall.v1.y = P.currently.movingPoint[i + 3].y;
        wall.v2.x = P.currently.movingPoint[i + 4].x;
        wall.v2.y = P.currently.movingPoint[i + 4].y;
      }
      P.currently.movingPoint = undefined
    }
    this.onActionFinish()
  },
  onPointRemove: function() {
    // remove last segment
    if (P.currently.hoverPoints) {

      for (var i = 0; i < P.currently.hoverPoints.length; i += 5) {
        P.currently.hoverPoints[i + 1].remove()
      }
      P.currently.hoverPoints = undefined
      this.onAction()
    }
  },

  onMenuUpdate: function() {
    if (!editormenu.menuItems) {
      editormenu.menuItems = {
        point: editormenu.getElementsByClassName('point')[0],
        wall: editormenu.getElementsByClassName('wall')[0],
        zone: editormenu.getElementsByClassName('zone')[0],
        path: editormenu.getElementsByClassName('path')[0]
      }
    };

    var current = [];
    if (P.currently.hoverPoints)
      current.push('point');
    if (P.currently.hoverLines)
      current.push('wall');
    if (!(P.currently.hoverLines || P.currently.hoverPoints))
      current.push('zone');
    if (P.currently.drawingPath)
      current.push('path');

    var select = editormenu.firstElementChild;
      
    if (!P.Scene.currentMenu || P.Scene.currentMenu.join(',') !== current.join(',')) {
      while (select.lastChild)
        select.removeChild(select.lastChild)
      current.forEach(function(name) {
        select.appendChild(editormenu.menuItems[name])
      })
    } 

    select.selectedIndex = -1;
    select.oninput = null;
    clearTimeout(select.resetting)
    select.resetting = setTimeout(function() {
      select.oninput = function() {
        P.views.editor.onBeforeAction();
      }
    }, 300)
    P.Scene.currentMenu = current;

  },

  getValue: function(value, justRound) {
    value = parseFloat(value.toFixed(2))
    if (justRound)
      return value;
    return parseFloat((value * 2 / 10 / 10).toFixed(2))
  },

  onStatusUpdate: function(event) {
    editorstatus.style.display = 'block';
    var path = P.currently.drawingPath;

    var furniture = path && path.type.isFurniture ? path
                  : P.currently.movingPoint && P.currently.movingPoint[1].type.isFurniture ? P.currently.movingPoint[1]
                  : P.currently.hoverLines && P.currently.hoverLines[1].type.isFurniture ? P.currently.hoverLines[1]
                  : P.currently.hoverPoints && P.currently.hoverPoints[1].type.isFurniture ? P.currently.hoverPoints[1] 
                  : null

    if (furniture) {
      var size = P.Furniture.getSize(furniture);
      editorstatusfrom.textContent = this.getValue(furniture.v1.x) + '×' + this.getValue(furniture.v1.y)
      editorstatusto.textContent = ' – ' + this.getValue(furniture.v2.x) + '×' + this.getValue(furniture.v2.y)
      
      var screen = P.Scene.getScreenXY(new THREE.Vector3(
        furniture.getTotalX(),
        furniture.getTotalY(),
        furniture.getTotalZ()
      ));
      if (furniture.frozenRatio && furniture.frozenSize) {

        var d1 = Math.sqrt(size[0] * size[0] + size[1] * size[1]);
        var d2 = Math.sqrt(Math.pow(furniture.v2.x - furniture.v1.x, 2) + Math.pow(furniture.v2.y - furniture.v1.y, 2) )

        editorstatuslength.textContent = Math.floor(d2 / d1 * 100) + '%'
      } else {

        editorstatuslength.textContent = this.getValue(size[0]) + '×' + this.getValue(size[1]) + (furniture.tabIndex != null ? ', №' + (furniture.tabIndex + 1) : '' )
      }
      editorstatus.style.top = screen.y + 'px';
      editorstatus.style.left = screen.x + 'px';

      var angle = Math.atan2((furniture.v2.y - furniture.v1.y), (furniture.v2.x - furniture.v1.x) ) * (180 / Math.PI);
      

      editorstatusdegree.textContent = this.getValue(angle, true) + '°'
      return
    } else if (path && event) {
      editorstatuslength.textContent = this.getValue(path.distance)

      var angle = Math.atan2((path.v2.y - path.v1.y), (path.v2.x - path.v1.x) ) * (180 / Math.PI);
      editorstatusdegree.textContent = this.getValue(angle, true) + '°'
      editorstatusfrom.textContent = this.getValue(path.v1.x) + '×' + this.getValue(path.v1.y)
      editorstatusto.textContent = ' – ' + this.getValue(path.v2.x) + '×' + this.getValue(path.v2.y)
      editorstatus.style.top = event.clientY + 'px';
      editorstatus.style.left = event.clientX + 'px';
      
    } else if (P.currently.movingPoint) {
      var path = P.currently.movingPoint[1];
      editorstatusfrom.textContent = this.getValue(path.v1.x) + '×' + this.getValue(path.v1.y)
      editorstatusto.textContent = ' – ' + this.getValue(path.v2.x) + '×' + this.getValue(path.v2.y)
      
      var screen = P.Scene.getScreenXY(P.currently.movingPoint[2]);

      var coords = P.currently.movingPoint[0]
      var current = coords == path.v1 ? P.currently.movingPoint[3] : P.currently.movingPoint[4]
      var shiftX = this.getValue(coords.x - current.x)
      var shiftY = this.getValue(coords.y - current.y)
      if (shiftX > 0)
        shiftX = '+' + shiftX
      if (shiftY > 0)
        shiftY = '+' + shiftY
      editorstatuslength.textContent = shiftX + ' ' + shiftY

      var angle = Math.atan2((path.v2.y - path.v1.y), (path.v2.x - path.v1.x) ) * (180 / Math.PI);
      editorstatusdegree.textContent = this.getValue(angle, true) + '°'
      editorstatus.style.top = screen.y + 'px';
      editorstatus.style.left = screen.x + 'px';
    } else if (P.currently.hoverLines) {
      var path = P.currently.hoverLines[1];
      var screen = P.Scene.getScreenXY(P.currently.hoverLines[2]);
      var coords = P.currently.hoverLines[0]
      var distance = Math.sqrt(Math.pow(coords.x - path.v1.x, 2) + Math.pow(coords.y - path.v1.y, 2) )

      var a = this.getValue((distance))
      var b = this.getValue((path.distance - distance))
      editorstatuslength.textContent = a + ' + ' + b + ' = ' + this.getValue(path.distance) + ' '

      var angle = Math.atan2((path.v2.y - path.v1.y), (path.v2.x - path.v1.x) ) * (180 / Math.PI);
      editorstatusdegree.textContent = this.getValue(angle, true) + '°'
      editorstatusfrom.textContent = this.getValue(path.v1.x) + '×' + this.getValue(path.v1.y)
      editorstatusto.textContent = ' – ' + this.getValue(path.v2.x) + '×' + this.getValue(path.v2.y)
      editorstatus.style.top = screen.y + 'px';
      editorstatus.style.left = screen.x + 'px';

    } else if (P.currently.hoverPoints) {
      var path = P.currently.hoverPoints[1];
      var screen = P.Scene.getScreenXY(P.currently.hoverPoints[2]);
      editorstatusdegree.textContent = ''

      var angle = Math.atan2((path.v2.y - path.v1.y), (path.v2.x - path.v1.x) ) * (180 / Math.PI);
      editorstatuslength.textContent = P.currently.hoverPoints.length / 5 + ' lines'
      editorstatusfrom.textContent = this.getValue(path.v1.x) + '×' + this.getValue(path.v1.y)
      editorstatusto.textContent = ''
      editorstatus.style.top = screen.y + 'px';
      editorstatus.style.left = screen.x + 'px';
    } else {
      this.hidingStatus = setTimeout(function() {
        editorstatus.style.top = -100 + 'px'
        editorstatus.style.display = 'none';
      }, 50)
    }
  },


  onMouseMove: function(event) {
    if (P.currently.hoverZone && P.currently.editingZone !== P.currently.hoverZone)
      P.Area.highlightZone(P.currently.hoverZone, null, true)
    P.Overlay.instances.changes |= P.Overlay.instances.UPDATE_RESET
    P.Underlay.instances.changes |= P.Overlay.instances.UPDATE_RESET
    P.currently.hoverZone = P.pointer.zone;
    if (P.currently.editingZone !== P.currently.hoverZone && P.currently.hoverZone)
      P.Area.highlightZone(P.currently.hoverZone, P.styles.glassColor2, true)
    if (!P.pointer.area) return;
    if (P.currently.hoverLines) {
      for (var i = 0; i < P.currently.hoverLines.length; i += 5)
        P.currently.hoverLines[i + 1].temporaryColor = null;
    }
    if (P.currently.hoverPoints) {
      for (var i = 0; i < P.currently.hoverPoints.length; i += 5)
        P.currently.hoverPoints[i + 1].temporaryColor = null;
    }

    P.currently.hoverPoints = P.currently.hoverLines = null;
    // Find snap points
    var point = this.getPoint();
    if (!point) return
    // dont snap to line itself
    var exclusions = [P.currently.drawingPath].concat(P.currently.movingPoint);
    var points = P.Wall.getPoints(point, 2.7, P.pointer.area, exclusions);

    if (points.length)  {
      var cursorScale = 1.5;
      P.materials.cursor.color = new THREE.Color(0,1,0)
      P.currently.hoverPoints = points.slice()
      for (var i = 0; i < points.length; i += 5)
        if (!points[i + 1].type.isFurniture)
          points[i + 1].temporaryColor = new THREE.Color(0.5,0.5,1);
      P.Wall.instances.changes |= P.Wall.instances.UPDATE_COLOR;
      P.currently.hasHighlightedWalls = true;
    } else {
      var lines = P.Wall.getLines(point, 4.5, P.pointer.area, exclusions);
      if (lines.length) {
        var cursorScale = 1.5;
        P.currently.hoverLines = lines.slice()
        P.materials.cursor.color = new THREE.Color(0,0,1)
        for (var i = 0; i < lines.length; i += 5)
          if (!lines[i + 1].type.isFurniture)
            lines[i + 1].temporaryColor = new THREE.Color(0.5,0.5,1);
        P.Wall.instances.changes |= P.Wall.instances.UPDATE_COLOR;
        P.currently.hasHighlightedWalls = true;
      } else {
        if (P.currently.hasHighlightedWalls)
          P.Wall.instances.changes |= P.Wall.instances.UPDATE_COLOR;
        P.materials.cursor.color = new THREE.Color(1,0,0)
      }
    }

    var target = points && points[2] || lines && lines[2] || point
    var changed
    if (!P.Scene.cursor.currentTarget || P.Scene.cursor.currentTarget.x != target.x || P.Scene.cursor.currentTarget.z != target.z) {
      P.Scene.cursor.position.copy(target)
      var movedCursor = true;
    }
    // Moving point
    if (P.currently.movingPath) {
      this.onPathMove(target, points, this.getEditingMode(event))

      changed = true
    } else if (P.currently.movingPoint) {
      this.onPointMove(target, points, this.getEditingMode(event))

      changed = true

    // Drawing wall
    } else if (P.currently.drawingPath) {
      this.onPathChange(target, points, this.getEditingMode(event))

      changed = true

    } else {
      var snapped = points && points.length ? points : lines && lines.length ? lines : null
      if (snapped) {
        var absolute = snapped[2];
        var screen = P.Scene.getScreenXY(absolute);
        if (!P.currently.hidingMenu) {
          editormenu.style.top = screen.y + 'px';
          editormenu.style.left = screen.x + 'px';
        }
      } else if (!event || !(event.shiftX || event.metaKey || event.ctrlKey)) {
        editormenu.style.top = -100 + 'px'
      }
    }
    P.Scene.cursor.position.y += 1.1
    P.Scene.cursor.scale.y = cursorScale || 1
    P.Scene.cursor.scale.x = cursorScale || 1
    P.Scene.cursor.scale.z = cursorScale || 1
    if (movedCursor || changed) {
      P.Scene.cursor.updateMatrix(true)

      render()

    // update context menu
    this.onMenuUpdate(event)
    this.onStatusUpdate(event)


    }
  },

  getEditingMode: function(event) {
    if (event && event.metaKey) {
      return 'rotate'
    } else if (event && event.ctrlKey) {
      return 'rotate'//return 'flip'
    } else {
      return 'move'
    }
  },

  getPoint: function(point) {
    return P.pointer.getPoint(point)
  },

  getCoordinates: function(point) {
    if (!point)
      point = P.pointer.coordinates;
    if (!point) return
    var grid = 5;
    return {
      x: Math.floor(point.x / grid) * grid,
      y: Math.floor(point.y / grid) * grid
    }
  },

  onClick: function(event) {
    if (P.pointer.label && P.pointer.label.zone && (event.altKey || event.ctrlKey)) {
      this.onZoneRename();
      render()
      return false; 
    }

    if (P.currently.resizingPolygon) {
      this.onZoneResize(event.metaKey)
      render()
      return false

    } else if (P.currently.movingPath) {
      this.onPathMoveEnd()
      render()
      return false
    }
    if (P.currently.movingPoint) {
      this.onPointMoveEnd()
      render()
      return false;
    }
    // Creating wall
    if (P.pointer.area) {
      this.onPathSet(event.ctrlKey || event.shiftKey || event.metaKey);
      this.onMenuUpdate();

      render()

      //this.scrollHeight(true);
      return false;
    }
    return false;
  },

  backgroundImage: function() {
    if (P.Scene.backgroundImage) {
      var area = P.currently.showingArea;
      P.Floor.instances.material.color = new THREE.Color(0.7,0.7,1)

      P.Scene.backgroundImage.visible = true;
      P.animate.cancel(P.Floor.instances.material, 'opacity')
      P.Floor.instances.material.opacity = 0.1

      P.Scene.backgroundImage.position.y = area.getTotalY() - 0.2
      P.Scene.backgroundImage.position.x = area.getTotalX() + area.minHeight / 2
      P.Scene.backgroundImage.position.z = area.getTotalZ() - area.minWidth / 2
 //     P.animate.property(P.Wall.instances, null, 'scaleZ', 0.2)
    }
  },

  editor: function(area) {
    P.Icon.show('publish')
    P.Icon.show('delete')
    P.Icon.hide('search')

    var area = this.getData();
    P.currently.editingArea = area;
    if (!P.Scene.cursor) {
      P.Scene.cursor = new THREE.Mesh(new THREE.PlaneBufferGeometry(5,5,1,1), P.materials.cursor)
    } else {
      P.Scene.cursor.visible = true;
    }
    P.Scene.cursor.rotation.x = - Math.PI / 2;
    P.Scene.cursor.rotation.y = 0;
    P.Scene.cursor.position.y = area.offset.y + 2;
    P.Scene.cursor.updateMatrix(true)
    editormenu.style.display = 'none';
    document.body.onkeyup = function(e) {
      clearTimeout(editormenu.hiding)
      editormenu.hiding = setTimeout(function() {
        editormenu.style.display = 'none';
      }, 50)
    }
    document.body.onkeydown = function(e) {
      if (e.target.tagName === 'INPUT')
        return;
      if ((e.metaKey || e.ctrlKey) && !P.currently.resizingPolygon && !P.currently.hidingMenu) {
        clearTimeout(editormenu.hiding)
        editormenu.style.display = 'block';
        editormenu.style.top = P.pointer.y + 'px';
        editormenu.style.left = P.pointer.x + 'px';
      }

      if (e.keyCode == 13) { //enter
        if (P.currently.resizingPolygon) {
          P.views.editor.onZoneResizeFinish()
        } else {
          P.views.editor.onAbort()
        }
        render()
        e.preventDefault();
      } else if (e.keyCode == 27) { //esc
        P.views.editor.onAbort()
        render()
        e.preventDefault();
      } else if (e.keyCode == 90 && e.metaKey || e.keyCode == 8) { //cmd+z
        if (P.currently.movingPoint) {
          P.views.editor.onPointMoveCancel()
          render()
        }
        if (e.keyCode == 8) { // backspace
          if (P.currently.drawingPath) {
            P.views.editor.onPathUndo()
            P.views.editor.onMouseMove()
            render()
          } else if (P.currently.hoverLines) {
            P.views.editor.onPathRemove()
            render()
          } else if (P.currently.hoverPoints) {
            P.views.editor.onPointRemove()
            render()

          }
        }
        //e.preventDefault();
      } else if (e.keyCode >= 49 && e.keyCode < 60 || e.keyCode == 68
       || e.keyCode == 87 || e.keyCode == 84 || e.keyCode == 83 || e.keyCode == 67 || e.keyCode == 79) {
        P.views.editor.onMaterialChange(e.keyCode)
        e.preventDefault()
    
      } else if (e.keyCode == 9) {// tab
        P.views.editor.onVariationChange(e.keycode)
        e.preventDefault()
      } else if (e.keyCode == 80 || e.keyCode == 32) {//m
        if (P.currently.movingPoint) {
          P.views.editor.onPointMoveEnd()
        } else if (P.currently.movingPath) {
          P.views.editor.onPathMoveEnd()
        } else if (P.currently.hoverPoints) { 
          P.views.editor.onPointMoveStart();
        } else {
          P.views.editor.onPathMoveStart();
        }
        e.preventDefault()
      } 
    }
    scene.add(P.Scene.cursor)
    P.Scene.setCamera()
  },

  // adjust document dimensions to enable scrolling
  getTarget: function() {
    if (P.Scene.previousState && P.Scene.previousState !== 'editor')
      return this.getPoint()
    return controls.target.clone()
  },


  getBox: function() {

    var area = this.getData()
    var box = new THREE.Box3().copy(area.areaBox);
    box.area = area;
    if (area.contentBox.min.y < 0) {
      box.min.y += area.contentBox.min.y
    }
    if (area.contentBox.min.x < 0) {
      box.min.x += area.contentBox.min.x
    }

    if (area.minWidth/* && P.Scene.backgroundImage*/) {
      box.max.x = Math.max(box.max.x, box.min.x + area.minWidth)
      box.max.y = Math.max(box.max.y, box.min.y + area.minHeight)
    }
    return P.geometry.box(box);
  },

  autoLoad: function() {
    var area = P.currently.editingArea;
    if (P.Snapshot.lastArea != area) {
      P.Snapshot.list = [];
    } else {
      return;
    }
    P.Snapshot.lastArea = area;
    var saved = localStorage['autosave:' + area.title];
    if (saved && P.Scene.previousState != 'editor') {
        if (confirm('Do you want to load autosaved level?')) {
        var loaded = JSON.parse(localStorage['autosave:' + area.title])
        P.Snapshot.apply(loaded)
        P.Snapshot.push(loaded)
        return
      }
    }

    P.Snapshot.push()
  },

});