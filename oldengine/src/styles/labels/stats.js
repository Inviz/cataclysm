P.Panel.Stats = function(properties) {
  if (!(this instanceof P.Panel.Stats))
    return new P.Panel.Stats(properties);
  P.Panel.apply(this, arguments)


  return this;
}
P.Panel.Stats.prototype = new P.Panel;
P.Panel.Stats.prototype.constructor = P.Panel.Stats;
P.Panel.Stats.prototype.className = 'stats panel content';

P.Panel.Stats.prototype.x = 0;
P.Panel.Stats.prototype.y = 0;
P.Panel.Stats.prototype.z = 0;
P.Panel.Stats.prototype.alignX = 0.5;
P.Panel.Stats.prototype.alignY = 0.5;
P.Panel.Stats.prototype.disabled = false;

P.Panel.Stats.prototype.background = {
  name: 'button',
  padding: 10,
  radius: 1
}
P.Panel.Stats.prototype.onClick = function() {
  if (!this.statElements) return;
  var last;
  this.statElements.forEach(function(stat) {
    if (stat[0] <= P.pointer.target.intersection.x)
      last = stat[1]
  })
  P.currently.selectedMetric = last ? last.getAttribute('itemprop') : null
  if (P.currently.selectedMetric === 'active-members') {
    P.Scene.setTarget(this.area.people[0] || P.Scene.me)
    P.Scene.navigate('graph')
  } else if (P.currently.selectedMetric === 'desks-available') {
    P.Scene.navigate('floor', null, this.area.getCenter(false))
  } else {
    if (this.area === P.currently.showingArea) {
      if (P.currently.selectedMetric === 'overall-satisfaction')
        P.currently.selectedMetric = 'overall-utilization'
      else
        P.currently.selectedMetric = 'overall-satisfaction'
         
    }
    this.invalidate();


    P.Scene.current.toggleAnalytics()

    if (P.Scene.state == 'chart')
      P.Scene.current.extrusion()

    P.Wall.instances.changes |= P.Wall.instances.UPDATE_COLOR
    P.Overlay.instances.changes |= P.Wall.instances.UPDATE_COLOR
    P.Underlay.instances.changes |= P.Wall.instances.UPDATE_COLOR
    if (P.Scene.state === 'graph' || P.Scene.state === 'search')
      P.Scene.navigate('location');
    P.animate.start()
  }
  return false
}

P.Panel.Stats.prototype.measureElement = function(element) {
  var panels = element.querySelectorAll('ul.root > li:not([hidden])');
  this.statElements = Array.prototype.map.call(panels, function(panel) {
    return [panel.offsetLeft / 2, panel]
  })
}

P.Panel.Stats.prototype.isSticky = function() {
  return this.area === P.currently.showingArea;
}

P.Panel.Stats.prototype.computeAlignment = function(quaternion) {
  if (this.isSticky()) {
    return this.alignment.set(
      (this.width * this.zoom / 2 + 67 + P.currently.showingArea.label.width / 2),
      - (this.height * this.zoom / 2 + 15),
      0
    );
  } else {
    var alignment = this._computeAlignment(camera.quaternion)
    if (this.area !== P.currently.showingArea) {
      alignment.y = (this.height + 50) / camera.zoom;
      alignment.z -= this.area.contentBox.min.x
      alignment.x += this.area.contentBox.min.y

      this.alignment.z -= 4 / camera.zoom;
    }
  }
  return alignment;
}

P.Panel.Stats.prototype.shouldBeRendered = function() {
  if (P.Scene.showPanels) {
    if (P.Scene.state === 'location')
      return this.area.location.areas[0] === this.area
    if (this.area == P.currently.showingArea && P.Scene.state !== 'graph')
      return true
  }
  return false
}

P.Panel.Stats.prototype.update = function(stats) {
  var data = this.area.location.stats;

  this.simplified = this.area === P.currently.showingArea
  var limit = this.simplified ? 1 : 4;
  var rendered = 0;
  if (this.simplified)
    stats.classList.add('simplified')
  else
    stats.classList.remove('simplified')
  if (P.Scene.state !== 'location')
    var criteria = P.currently.selectedMetric;
  Array.prototype.forEach.call(stats.querySelectorAll('ul.root > li'), function(item, index) {
    var name = item.getAttribute('itemprop');
    
    if (data[name] && rendered < limit && (!criteria || criteria === name)) {
      rendered++;
      item.style.display = 'inline-block';
      item.removeAttribute('hidden')
      Array.prototype.forEach.call(item.querySelectorAll('h2 > strong'), function(el, i) {
        el.textContent = Math.floor(data[name].value.v)
        if (name.indexOf('overall') > -1) {
          el.textContent += '%'

        } else if (name.indexOf('temp') > -1) {
          el.textContent += '°'

        } 
      }, this)
        console.error(data[name].value.d, name)

      Array.prototype.forEach.call(item.querySelectorAll('.number'), function(el, i) {
        if (data[name].value.d > 1) {
          el.textContent = '▲' + (Math.abs(data[name].value.d) > 1 ? Math.floor(Math.abs(data[name].value.d)) : '')
          el.classList.add('rising');
          el.classList.remove('falling');
        } else if (data[name].value.d > -1) {
          el.textContent = ''
          el.classList.remove('falling');
          el.classList.remove('rising');
        } else {
          el.style.display = 'inline-block';
          el.textContent = '▼' + (Math.abs(data[name].value.d) > 1 ? Math.floor(Math.abs(data[name].value.d)) : '')
          el.classList.add('falling');
          el.classList.remove('rising');
        }
      }, this)
    } else {
      item.style.display = 'none';
      item.setAttribute('hidden', 'hidden');
    }
    if (P.currently.selectedMetric == name)
      item.classList.add('selected')
    else
      item.classList.remove('selected')
    if (this.simplified)
      item.classList.add('simplified')
    else
      item.classList.remove('simplified')

  }, this);
  this.area.stats = stats;
}

P.Panel.Stats.prototype.build = function(element) {
  element.innerHTML = '\
    <ul class="root">\
      <li itemprop="overall-satisfaction">\
        <h2><strong>55</strong> Overall satisfaction</h2>\
        <span class="rising number">3</span>\
        <ul class="stackchart">\
          <li style="width: 70%; background-color: #6FC373;"></li>\
          <li style="width: 20%; background-color: #FAEA78;"></li>\
          <li style="width: 10%; background-color: #FA7878;"></li>\
        </ul>\
      </li>\
      <li itemprop="overall-utilization">\
        <h2><strong>32</strong> Overall utilization</h2>\
        <span class="rising number">3</span>\
      </li>\
      <li itemprop="active-members">\
        <h2><strong>121</strong> Active members</h2>\
        <span class="rising number">15</span>\
      </li>\
      <li itemprop="desks-available">\
        <h2><strong>12/162</strong> Available Desks</h2>\
        <span class="falling number">13</span>\
      </li>\
      <li itemprop="area-temperature">\
        <h2><strong>12</strong>Area Temperature</h2>\
        <span class="falling number">13</span>\
      </li>\
    </ul>\
  '
};