P.Scene.updateSearch = function() {
  if (P.Icon.loaded.search)
  if (window.innerWidth < 600) {
    P.Icon.loaded.search.stickyX = 1;
  } else {
    P.Icon.loaded.search.stickyX = 0;
  }
  if (P.Scene.isSearchVisible())
    P.Scene.showSearch(true)
  else
    P.Scene.hideSearch(true)
  searchInput.onblur = function() {
    if (P.Scene.state != 'search')
      P.Scene.hideSearch()
  }
}
P.Scene.toggleSearch = function() {
  if (searchForm.parentNode.style.display == 'none')
    P.Scene.showSearch()
  else
    P.Scene.hideSearch();
}
P.Scene.isSearchVisible = function() {
   return searchForm.parentNode.style.display != 'none'
}

P.Scene.hideSearch = function(quick) {
  if (!P.Icon.loaded.search)

    return setTimeout(function() {
      P.Scene.hideSearch(quick)
    }, 50)

  if (window.innerWidth < 600) {
    P.animate.property(P.Icon.loaded.search, null, 'paddingX', 10)
    P.animate.property(P.Icon.loaded.search, null, 'paddingRight', 0)
  } else {
    P.animate.property(P.Icon.loaded.search, null, 'paddingRight', 100)
    P.animate.property(P.Icon.loaded.search, null, 'paddingX', -65)
  }
  if (quick) return;
  if ( P.Scene.isSearchVisible()) {
        
    P.Scene.hidingSearch = setTimeout(function() {
      searchForm.parentNode.style.display = 'none';
      
    }, 400)
  }
  if (document.activeElement == searchInput)
    document.activeElement.blur()
  if (!P.animate.scheduled)
    P.animate.start()
}

P.Scene.showSearch = function(quick) {
  if (window.innerWidth < 600) {
    P.animate.property(P.Icon.loaded.search, null, 'paddingX', -220)
    P.animate.property(P.Icon.loaded.search, null, 'paddingRight', 100)
  } else {
    P.animate.property(P.Icon.loaded.search, null, 'paddingRight', 200)
    P.animate.property(P.Icon.loaded.search, null, 'paddingX', -110)
  }

  if (quick) return;
  searchForm.parentNode.style.display = 'block'
  P.Scene.justShownSearch = true;

  if (!quick) {
    if (!P.animate.scheduled)
      P.animate.start()
    clearTimeout(P.Scene.hidingSearch);

    setTimeout(function() {
      P.Scene.justShownSearch = false;
    }, 400)
    setTimeout(function() {
      searchInput.focus()

    }, 100)
      searchInput.focus()
  }
}


P.Scene.openFloater = function() {
  clearTimeout(P.Scene.closingFloater)
  P.Panel.iframe.parentNode.style.display = 'block'
  P.Scene.floaterOpen = true;
}
P.Scene.closeFloater = function() {
  if (P.Scene.floaterOpen) {
    P.Scene.floaterOpen = false;
    clearTimeout(P.Scene.closingFloater)
    document.body.focus()
    P.Scene.closingFloater = setTimeout(function() {
      P.Panel.iframe.parentNode.style.display = 'none'
    }, 400)
    P.Panel.iframe.parentNode.classList.add('loading');
  }
}
P.Scene.isFloaterOpen = function() {
  return P.Scene.floaterOpen
}

P.Scene.stopStickyPerson = function() {
  if (!P.Scene.meVisible) {
    P.Scene.doNotStickPerson = true;
    clearTimeout(P.Scene.attachmentCooldown)
    P.Scene.attachmentCooldown = setTimeout(function() {
      P.Scene.doNotStickPerson = null;
    }, 300)
  } else {
    P.Scene.doNotStickPerson = null;
    clearTimeout(P.Scene.attachmentCooldown)
  }
}

P.Scene.updateFloater = function() {

  if (P.Panel.iframe.parentNode.style.display != 'none' && P.Panel.last) {
    var screen = P.Scene.getScreenXY(
    _v3.set(
      P.Panel.last.getParentX(), 
      P.Panel.last.getParentY(), 
      P.Panel.last.getParentZ()))

      var scrollLeft = (wrapper === document.documentElement ? window.pageXOffset : wrapper.scrollLeft)
      var scrollTop = (wrapper === document.documentElement ? window.pageYOffset : wrapper.scrollTop)

      if (screen.x < 155)
        screen.x += Math.max(0, Math.min(155, 155 - screen.x - scrollLeft))

      var x = screen.x
      var y = (screen.y - P.Panel.last.attachY - 4)
      if (!('ontouchstart' in document)) {
        P.Panel.iframe.parentNode.style.position = 'fixed'
        //x += scrollLeft
        //y += scrollTop
      }
      x -= P.Panel.last.contentWidth / 2
      y -= Math.min(window.innerHeight - 95, 520, P.Panel.last.contentHeight || Infinity)
      //if (devicePixelRatio > 1) {
      //  P.Panel.iframe.parentNode.style.webkitTransform =
      //  P.Panel.iframe.parentNode.style.transform = 'translateX( ' + x + 'px) translateY(' + y + 'px)'
      //} else {
        P.Panel.iframe.parentNode.style.left = x + 'px'
        P.Panel.iframe.parentNode.style.top = y + 'px'
      //}
  }
}

P.Scene.setCompass = function() {
  

  // set up orientation change listener
  P.Scene.compass = new THREE.Object3D;
  P.Scene.orientation = new THREE.DeviceOrientationControls( P.Scene.compass, function(event) {
    if (P.Scene.oldCompassHeading == null)
      P.Scene.oldCompassHeading = P.Scene.compassHeading || 0;
    P.Scene.compassHeading = event.webkitCompassHeading || event.compassHeading || 0

    var diff = P.Scene.compassHeading - P.Scene.oldCompassHeading;
    if (diff > 10 || diff < -10) {
      P.Scene.oldCompassHeading = P.Scene.compassHeading;
      P.Sprite.instances.changes |= P.Sprite.instances.UPDATE_ROTATION
      render()
    }
  });
}