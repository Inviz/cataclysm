P.Panel.Profile = function(properties) {
  if (!(this instanceof P.Panel.Profile))
    return new P.Panel.Profile(properties);
  P.Panel.apply(this, arguments)

  return this;
}
P.Panel.Profile.prototype = new P.Panel;
P.Panel.Profile.prototype.constructor = P.Panel.Profile;
P.Panel.Profile.prototype.className = 'profile panel content';

P.Panel.Profile.prototype.background = {
  name: 'button',
  padding: 10,
  radius: 2
}

P.Panel.Profile.prototype.alignX = 0
P.Panel.Profile.prototype.alignY = 0.5
P.Panel.Profile.prototype.attachY = 40
P.Panel.Profile.prototype.projected = -0.5;
P.Panel.Profile.prototype.disabled = false;
P.Panel.Profile.prototype.renderIndex = 10,
P.Panel.Profile.prototype.important = true
P.Panel.Profile.prototype.active = true;
P.Panel.Profile.prototype.iconColor = new THREE.Color(233 / 255,85 / 255,164 / 255)
P.Panel.Profile.prototype.isForeground = function() {
  return true
}

P.Panel.Profile.prototype.onProject = function() {
  if (this.projected && this.important) {
    var x = ( (this.position.x) * window.innerWidth / 2 ) + window.innerWidth / 2;
    if (x < 155) {
      x += Math.max(0, Math.min(155, 155 - x - P.Scene.current.scrollLeft))
      this.position.x = (x - window.innerWidth / 2) * 2 / window.innerWidth
    }
  }
}
P.Panel.Profile.prototype.getParentX = function() {
  return this.target.getTotalX()  - (this.target.area ? this.target.area.shift.x : 0)
}
P.Panel.Profile.prototype.getParentZ = function() {
  return this.target.getTotalZ()  - (this.target.area ? this.target.area.shift.z : 0)
}
P.Panel.Profile.prototype.getParentY = function() {
  return this.target.getTotalY() - (this.target.area ? this.target.area.shift.y : 0)
}

P.Panel.Profile.prototype.getZIndex = function() {
  if (P.Panel.current.indexOf(this) > -1) {
    if (P.Panel.expanded === this)
      return 0.2
    else
      return 0.1;
  }
  return 0;
}

P.Panel.Profile.prototype.onClick = function(event) {
  //P.Scene.needsUpdate()

  if (this.workplace && this.workplace.person && this.workplace.person.workplace != this.workplace) {
    if (!event || P.pointer.target.intersection.y / this.height > 0.6) {
      P.Panel.close()
        
      if (this.workplace.person.area !== this.workplace.area || P.Scene.state !== 'floor') {
        P.Scene.setTarget(this.workplace.person, true)
        P.pointer.area = this.workplace.person.area
        P.Scene.navigate('floor')
        //P.Panel.open(this.workplace.person)
      } else {

        P.Scene.setTarget(this.workplace.person, true)
        //P.Panel.open(this.workplace.person)
        P.Scene.current.onInitialize()
      }
      P.animate.start()
      return false
    }
  } else {
    P.Scene.setTarget(this.target)
  }

  if (this.cardURL) {
    var iframe = this.openURL(this.cardURL, this, this.cardURL)
  } else if (this.person)
    var iframe = this.openURL('users/' + this.person.id + '/', this.person)
  else if (this.company)
    var iframe = this.openURL('companies/' + this.company.id + '/', this.company)
  //else if (this.object)
  //  var iframe = this.openURL('companies/' + this.company.id + '/', this.company)
  else if (this.workplace)
    var iframe = this.openURL('users/' + this.workplace.person.id + '/', this.workplace.person)
  else if (this.pin) {
    if (this.pin.type == 'event')
      var iframe = this.openURL('events/' + this.pin.id + '/', this.pin)
    else {
      this.close()
      return false
      //var iframe = this.openURL('pins/' + this.pin.id + '/', this.pin, './app/pin.html')
    }
  } else return;
  this.invalidate()
  P.Icon.instances.changes |= P.Icon.instances.UPDATE_COLOR
  var targetWidth = Math.min(window.innerWidth, 310);
  iframe.parentNode.style.width = (targetWidth - 7) + 'px';
  iframe.parentNode.style.maxWidth = (targetWidth - 7) + 'px';
  iframe.width = targetWidth - 7;;
  iframe.height = Math.min(window.innerHeight - 95, 520);
  this.iframe = iframe;


  P.animate.start()
  return false;
}


P.Panel.Profile.prototype.measureElement = function(element) {
  if (element.getElementsByClassName('compass')[0]) {
    this.compassX = element.getElementsByClassName('compass')[0].offsetLeft / 2 - element.offsetWidth / 4;
    this.compassY = element.getElementsByClassName('compass')[0].offsetTop / 2;
  }
}
P.Panel.Profile.prototype.targetHeight = 400;

P.Panel.Profile.prototype.onLoad = function() {
  var targetWidth = Math.min(window.innerWidth, 310);

  var targetHeight = Math.min(window.innerHeight - 95, 520, this.contentHeight || Infinity);
  this.targetHeight = targetHeight
  this.iframe.height = targetHeight;
  this.iframe.parentNode.style.height = (targetHeight) + 'px'

  var paddingH = targetWidth - this.width;
  P.animate.property(this, null, 'paddingTop', targetHeight - this.height + 8)
  P.animate.property(this, null, 'paddingLeft', paddingH / 2)
  P.animate.property(this, null, 'paddingRight', paddingH / 2)
  P.Scene.current.onInitialize(true)

  P.Panel.prototype.onLoad.apply(this, arguments);
}


P.Panel.Profile.prototype.update = function(element) {
  if (this.person) {
    element.getElementsByClassName('name')[0].innerHTML = this.person.name
    element.getElementsByClassName('title')[0].innerHTML = this.person.title
    element.getElementsByClassName('tagline')[0].innerHTML = this.person.status
    element.getElementsByClassName('compass')[0].style.display = 'none';
    element.className = 'person profile panel content'
  } else if (this.pin) {
    if (this.pin.company_owner_id) {
      var company = P.companies.filter(function(company) {
        return company.id == this.pin.company_owner_id// || this.pin.zone.company_owner_id
      }.bind(this))[0]
    }
    element.getElementsByClassName('name')[0].innerHTML = this.pin.title
    element.getElementsByClassName('title')[0].innerHTML = this.pin.subtitle || this.pin.start_datetime_for_humans || this.pin.start_datetime || ''
    element.getElementsByClassName('tagline')[0].innerHTML = company ? 'By ' + company.title : ''
    element.getElementsByClassName('compass')[0].style.display = 'none';
    element.className = 'pin profile panel content'
  } else if (this.workplace) {
    element.getElementsByClassName('name')[0].innerHTML = this.workplace.person && this.workplace.person.name
    element.getElementsByClassName('title')[0].innerHTML = this.workplace.person && this.workplace.person.title
    element.getElementsByClassName('tagline')[0].innerHTML = this.workplace.person && this.workplace.person.status || 'away'
    element.getElementsByClassName('compass')[0].style.display = 'inline-block';
    element.className = 'workplace profile panel content'
  } else if (this.company) {
    element.getElementsByClassName('name')[0].innerHTML = this.company.title
    element.getElementsByClassName('title')[0].innerHTML = this.company.industry || ''
    var employees = this.company.employee_count || this.company.people && this.company.people.length > 1
    element.getElementsByClassName('tagline')[0].innerHTML = employees > 1 ? employees + ' people' : employees ? 'Individual' : '';
    element.getElementsByClassName('compass')[0].style.display = 'none';
    element.className = 'company profile panel content'
  } else if (this.object) {
    if (this.object.type === P.Wall.types.activePrinter 
      || this.object.type === P.Wall.types.inactivePrinter) {

      element.getElementsByClassName('name')[0].innerHTML = 'Printer'
    }
    element.getElementsByClassName('title')[0].innerHTML = 'ID 1406920 PIN 4512'
    //if (this.object.type === P.Wall.types.activePrinter)
    //  element.getElementsByClassName('tagline')[0].innerHTML = 'Available';
    //else
      element.getElementsByClassName('tagline')[0].innerHTML = 'Available';

    element.getElementsByClassName('compass')[0].style.display = 'none';
    var active = false;
  }
  if (this.icon) {
    if (active === false || (P.Panel.expanded == this) || this.workplace && this.workplace.person && this.workplace.person.workplace != this.workplace) {
      this.iconColor = new THREE.Color(0.3,0.3,0.3)
      element.classList.remove('active')
    } else {
      this.iconColor = new THREE.Color(233 / 255,85 / 255,164 / 255)
      element.classList.add('active')
    }
  }

}

P.Panel.Profile.prototype.build = function(element) {
  element.innerHTML = '\
    <span class="expand"><span class="icon"></span></span>\
    <h2 class="name"></h2>\
    <p class="title"></p>\
    <span class="tagline"></span>\
    <span class="compass"></span>\
  '
};