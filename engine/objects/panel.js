P.Panel = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Panel))
    return new P.Panel(properties);

  this.alignment = new THREE.Vector3;
  return P.Object.call(this, properties)
}

P.Panel.prototype = new P.Label;
P.Panel.prototype.constructor = P.Panel;
P.Panel.prototype.alignY = 0.5;
P.Panel.prototype.alignX = 0.5;
P.Panel.prototype.disabled = true;
P.Panel.prototype.pointerPriority = 10;
P.Panel.prototype.stickyZ = -0.3

P.Panel.prototype.iconColor = new THREE.Color(0.3,0.3,0.3)

P.Panel.current = []

P.Panel.prototype.isBillboard = function() {
  return true;
}
P.Panel.prototype.openURL = function(url, object, sample) {
  if (!P.Panel.iframe) {
    P.Panel.iframe = document.createElement('iframe');
    P.Panel.iframe.id = 'floater'
    P.Panel.iframe.setAttribute('scrolling', "yes") 
    P.Panel.iframe.setAttribute('width', "320") 
    P.Panel.iframe.setAttribute('allowTransparency', "true") 


    var wrap = document.createElement('div')
    wrap.id = 'floater-container'
    wrap.appendChild(P.Panel.iframe)
    wrap.style.display = 'none'
    P.Panel.iframe.wrap = wrap
    
  }
  // reinject iframe or ios may not trigger onload events
  if ( P.Panel.iframe.wrap.parentNode)
    document.body.removeChild( P.Panel.iframe.wrap)
  document.body.appendChild( P.Panel.iframe.wrap)
  P.Panel.expanded = this;
  P.Panel.iframe.loading = true;
  P.Panel.iframe.parentNode.classList.add('loading')
  if (P.animate.progress !== 1) {
  debugger

    this.fade(0.01, null, 20, 130)
  }
  P.Panel.last = this;
  var params = '?format=card';
  params    += '&ver=' + P.version.commit;
  params    += '&token=' + POSIT_AUTH_TOKEN;
  //params    += '&origin=' + location.origin;
  var area = P.Scene.target && P.Scene.target.area || P.currently.showingArea;
  if (area && area.location)
    params    += '&location_id=' + area.location.id;
  if (sample)
    P.Panel.iframe.src = sample + params
  else
    P.Panel.iframe.src = P.backend + '/api/' + url + params
  
  console.info('OPEN URL', P.Panel.iframe.src);
  P.Scene.openFloater()
  return P.Panel.iframe
}

P.Panel.prototype.onLoad = function() {
  this.fade(0.001, null, 20, 10)
  P.Panel.iframe.loading = false;
  P.Panel.iframe.parentNode.classList.remove('loading');
}
P.Panel.prototype.onAbort = function() {
    console.info('IFRAME ABORTED', P.Panel.iframe.src);
  P.Panel.iframe.loading = null
  P.Panel.iframe.src = 'about:blank'
  //P.Panel.iframe.parentNode.classList.remove('loading')
}
P.Panel.open = function(target) {
  P.animate.property(target.panel, null, 'paddingTop', 0)
  P.animate.property(target.panel, null, 'paddingLeft', 0)
  P.animate.property(target.panel, null, 'paddingRight', 0)
  console.info("OPEN PANEL", target)
  var expanded = P.Panel.expanded;
  if (P.Panel.current.indexOf(target.panel) == -1) {
    P.Panel.current.push(target.panel);
  }
  clearTimeout(P.Scene.justOpenedPanel)
  P.Scene.justOpenedPanel = setTimeout(function() {
    P.Scene.justOpenedPanel = false;
  }, 300)
  P.Scene.closeFloater()

  P.Scene.panelTargetScrollLeft = (wrapper === document.documentElement ? window.pageXOffset : wrapper.scrollLeft)
  P.Scene.panelTargetScrollTop = (wrapper === document.documentElement ? window.pageYOffset : wrapper.scrollTop)

  P.Panel.current.forEach(function(panel) {
    if (panel != target.panel)
      panel.close()
  })
  P.Panel.expanded = null;
  if (expanded)
    expanded.invalidate()

  P.animate.cancel(target.panel, 'backgroundOpacity')
  target.panel.backgroundOpacity = 1;
  if (target.panel)
    target.panel.fade(1)
  P.Panel.instances.changes |= P.Panel.instances.UPDATE_RESET
}

P.Panel.close = function(target) {
  if (P.Panel.current.length) {
    var expanded = P.Panel.expanded;
    P.Panel.current.forEach(function(panel) {
      panel.close()
    })
    P.Scene.closeFloater()
    P.Scene.setTarget(null)
    if (expanded) {
      expanded.invalidate()
      P.Scene.current.onInitialize()
    }
  }
}

P.Panel.prototype.onClick = function() {
  return false;
}
P.Panel.prototype.close = function() {
  P.animate.property(this, null, 'paddingTop', 0)
  P.animate.property(this, null, 'paddingLeft', 0)
  P.animate.property(this, null, 'paddingRight', 0)
  P.animate.property(this, null, 'backgroundOpacity', 0)
  this.fade(0)

  if (this === P.Panel.expanded)
    P.Panel.expanded = null;

  if (this === P.Panel.last && P.Panel.iframe.loading) {
    this.onAbort(P.Panel.iframe);
  }

  var index = P.Panel.current.indexOf(this);
  if (index > -1)
    P.Panel.current.splice(index, 1)
}

P.Panel.prototype.onAppear = function(update) {
  if (this.opacity === 0)
    return;
  var released = P.Panel.instances.material.map.released;
  var index = released.indexOf(this);
  var atlasIndex = this.atlasIndex;
  if (atlasIndex == null || index == -1 || update || this.unrendered) {
    this.atlasIndex = P.Panel.instances.material.map.allocate(this, undefined, update)
  }
  if (atlasIndex !== this.atlasIndex) {
    P.Panel.instances.changes |= P.Panel.instances.UPDATE_UV
    P.Panel.instances.changes |= P.Panel.instances.UPDATE_OFFSET
  }
  if (index > -1)
    released.splice(index, 1)
  return this.atlasIndex != null;
}
P.Panel.prototype.onDisappear = function() {
  P.Panel.instances.material.map.release(this)
}
P.Panel.prototype.isImportant = function() {
  return this.zone ? this.zone.area === P.currently.showingArea : true;
}

P.Panel.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.panels,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_COLOR | P.UPDATE_UV | P.UPDATE_OPACITY,
    {
      name: 'panels',
      getter: 'getPanels',
      renderForZones: true,
      disappearing: true,
      sort: function(a, b) {
        return a.renderIndex - b.renderIndex
      }
    }
  )
};