P.views.graph = new P.Scene.Canvas({

  camera: {
    r: 0.35,
    g: 0.35,
    b: 0.35
  },
 
  walls: {
    material: {
      opacity: 0
    }
  },
  
  floors: {
    material: {
      opacity: 0
    }
  },
  
  overlays: {
    material: {
      opacity: 0
    }
  },
  
  underlays: {
    material: {
      opacity: 0
    }
  },
  
  lines: {
    material: {
      opacity: 0.5
    }
  },

  controls: {
    dontPickArea: true
  },

  defaultCullLevel: function() {
    P.cull.level = null;
  },
  
  settings: function() {
    P.Scene.showCompanies = true;
    
    // move lines area
    var offsetY = this.offsetY;
    var offsetX = this.offsetX;
    var area = this.getData()
    P.Line.instances.position.x = area.getX(false) + offsetY
    P.Line.instances.position.y = area.getY(false)
    P.Line.instances.position.z = area.getZ(false) - offsetX
    P.Line.instances.updateMatrix()

    P.people.forEach(function(person, index) {
      var pX = person.placement.x + offsetX + person.offset.z
      var pY = person.placement.y + offsetY - person.offset.x
      P.animate.property(person, 'shift', 'x', area.offset.x - person.area.offset.x + pY)
      P.animate.property(person, 'shift', 'y', area.offset.y - person.area.offset.y)
      P.animate.property(person, 'shift', 'z', (area.offset.z - person.area.offset.z) - pX)
      if (person.beforeTargetOpacity == null)
        person.beforeTargetOpacity = person.targetOpacity;
      person.targetOpacity = 1;
    })
    P.companies.forEach(function(company) {
      var target = company.imageSRC ? company : company.label
      var pX = company.placement.x - (-company.offset.z) + offsetX
      var pY = company.placement.y - ( company.offset.x) + offsetY
      P.animate.property(target, 'shift', 'x', area.offset.x - (company.area ? company.area.offset.x : 0) + pY)
      P.animate.property(target, 'shift', 'y', area.offset.y - (company.area ? company.area.offset.y : 0))
      P.animate.property(target, 'shift', 'z', area.offset.z - (company.area ? company.area.offset.z : 0) - pX)
      P.animate.property(target, null, 'opacity', 1)
    })


    P.Line.instances.changes |= P.Line.instances.UPDATE_RESET;

  },
  //controls: {
  //  enableRotate: false
  //},
//
  shouldLayoutPeople: function() {
    return false
  },

  isLabelVisible: function(label) {
    return false
  },
  isWorkplaceVisible: function(workplace) {
    return false
  },
  isPersonVisible: function(workplace) {
    return true
  },

  isCompanyVisible: function() {
    return true
  },


  focuzOnFloor: function() {
    var area = this.getData()
    P.cull.chosenArea = area
    P.currently.showingArea = area;

    P.Person.instances.material.depthTest = 0;
    P.Workplace.instances.material.depthTest = 0;
    P.Sprite.instances.material.depthTest = 0;
    P.Background.instances.material.depthTest = 0;
    clearTimeout(P.depthClearance)
    P.depthClearance = setTimeout(function() {
      P.Person.instances.material.depthTest = 1;
      P.Sprite.instances.material.depthTest = 1;
      P.Workplace.instances.material.depthTest = 1;
      P.Background.instances.material.depthTest = 1;

    }, 500)
    
  },

  //clippingPlanes: function() {
  //  for (var i = 0; i < 4; i++)
  //    P.animate.property(P.materials.clippingPlanes[i], null, 'constant', P.materials.clippingPlanesOriginal[i].constant + 300)
  //},

  getData: function() {
    return P.currently.showingArea || this._getData()
  },

  onInitialize: function() {
    var retarget = !P.Scene.previousState
    var area = this.getData()

    // center graph
    if (!P.graph.layout.computed) {
      P.graph.layout.computed = true;
      for (var i = 0; i < 80; i++) {
        P.graph.layout.tick()
      }
      P.graph.layout.stop()
    }

    var minX =  Infinity
    var maxX = -Infinity
    var minY =  Infinity
    var maxY = -Infinity

    P.people.forEach(function(person) {
      var pX = person.placement.x
      var pY = person.placement.y
      if (pX > maxX) maxX = pX;
      if (pX < minX) minX = pX;
      if (pY > maxY) maxY = pY;
      if (pY < minY) minY = pY;
    })
    

    var width = maxX - minX;
    var height = maxY - minY;

    var offsetX = -minX;
    var offsetY = -minY;

    var shiftX = this.graphPositionX == null || !retarget ? 0 : this.graphPositionX;
    var shiftY = this.graphPositionY == null || !retarget ? 0 : this.graphPositionY;

    // offset graph to keep person in place
    if (P.Scene.target && !retarget) {
      var person = P.Scene.target;
      var pX = person.placement.x - (-person.offset.z) + offsetX
      var pY = person.placement.y - ( person.offset.x) + offsetY
      shiftX -= pX
      shiftY -= pY
      this.graphPositionX = shiftX;
      this.graphPositionY = shiftY;
    }
    offsetX += shiftX
    offsetY += shiftY

    if (P.currently.highlightedLinks) {
      for (var i = 0; i < P.currently.highlightedLinks.length; i++) {
        P.currently.highlightedLinks[i].zoom = 1;
      }
      P.currently.highlightedLinks = [];
    }
    if (P.Scene.target) {
      var links = P.Scene.target.links
      P.currently.highlightedLinks = []
      for (var id in links) {
        links[id].zoom = 2;
        P.currently.highlightedLinks.push(links[id])
      }
    } 


    this.offsetX = offsetX
    this.offsetY = offsetY;

    var box = new THREE.Box3;
    box.area = area
    box.min.copy(area.areaBox.min)
    box.min.z = 0;
    box.min.x += shiftX
    box.min.y += shiftY
    box.max.x = box.min.x + width
    box.max.y = box.min.y + height
    box.max.z = 0;
    box.width = width
    box.height = height
    box.depth = 0//area.areaBox.depth;
    box.center = box.getCenter()

    var result = this._onInitialize(box, function() {
      var person = P.Scene.target
      if (person) {
          var placement = person.placement || person.parent.placement
        return new THREE.Vector3( 
          area.offset.x + offsetY + placement.y,
          area.offset.y,
          area.offset.z - offsetX - placement.x
        )
      }
    })
        
    P.Icon.hide('isometricCamera')
    P.Icon.hide('flatCamera')
    clearTimeout(P.Scene.hidingCompanies)
    return result;
  },


  onUnload: function() {
    P.Scene.hidingCompanies = setTimeout(function() {
      P.Scene.showCompanies = false;
    }, 500)
    var area = this.getCurrentData(false)
    P.people.forEach(function(person) {
      P.animate.property(person, 'shift', 'z', 0)
      P.animate.property(person, 'shift', 'x', 0)
      P.animate.property(person, 'shift', 'y', 0)
      person.targetOpacity = person.beforeTargetOpacity
      person.beforeTargetOpacity = null
    })
    P.companies.forEach(function(company) {
      var target = company.imageSRC ? company : company.label
      P.animate.property(target, 'shift', 'z', 0)
      P.animate.property(target, 'shift', 'x', 0)
      P.animate.property(target, 'shift', 'y', 0)
    })
    if (P.currently.highlightedLinks) {
      for (var i = 0; i < P.currently.highlightedLinks.length; i++) {
        P.currently.highlightedLinks[i].zoom = 1;
      }
      P.currently.highlightedLinks = [];
    }
  }
});