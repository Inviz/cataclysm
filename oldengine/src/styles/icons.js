P.Icon.buttons = {
  search: {
    stickyX: 0,
    stickyY: 1,
//    zoom: 0.8,
    alignY: -0.5,
    alignX: 0.5,
    paddingX: 10,
    paddingY: -10,
    zoom: 0.8,
    color: new THREE.Color(0.7,0.7,0.7),
    ui: true,
    zIndex: 20,
    opacity: 0.5,
    background: {
      name: 'button',
      radius: 1,
      padding: 10
    }
  },
  publish: {
    stickyX: 1,
    stickyY: 1,
    zoom: 0.8,
    paddingX: 10,
    paddingY: 10,
    color: new THREE.Color(0.7,0.7,0.7),
    ui: true,
    zIndex: 42,
    background: 'button'
  },
  delete: {
    stickyX: 1,
    stickyY: 1,
    zoom: 0.8,
    paddingX: 60,
    paddingY: 10,
    color: new THREE.Color(0.7,0.7,0.7),
    ui: true,
    zIndex: 42,
    background: 'button'
  },
  flatCamera: {
    stickyX: 0,
    stickyY: -1,
    alignY: 0.5,
    paddingX: -91,
    paddingY: 13 + (!('ontouchstart' in document) ? 9 : 2),
    zoom: 1,
    zIndex: 1,
    ui: true
  },
  isometricCamera: {
    stickyX: 0,
    stickyY: -1,
    alignY: 0.5,
    paddingX: -91,
    paddingY: 13 + (!('ontouchstart' in document) ? 9 : 2),
    zoom: 1,
    zIndex: 2,
    ui: true
  },
  
  layout_active: {
    stickyX: 0,
    stickyY: -1,
    stickyZ: -0.6,
    alignY: 0.5,
    paddingX: -31,
    paddingY: (!('ontouchstart' in document) ? 9 : 2),
    ui: true,
    width: 64,
    height: 64,
  },
  layout_inactive: {
    stickyX: 0,
    stickyY: -1,
    stickyZ: -0.6,
    alignY: 0.5,
    paddingX: -31,
    paddingY: (!('ontouchstart' in document) ? 9 : 2),
    width: 64,
    height: 64,
    ui: true
  },
  relations_active: {
    stickyX: 0,
    stickyY: -1,
    stickyZ: -0.6,
    alignY: 0.5,
    paddingX: 32,
    paddingY: (!('ontouchstart' in document) ? 9 : 2),
    ui: true,
    width: 64,
    height: 64,
  },
  relations_inactive: {
    stickyX: 0,
    stickyY: -1,
    stickyZ: -0.6,
    alignY: 0.5,
    width: 64,
    height: 64,
    paddingX: 32,
    paddingY: (!('ontouchstart' in document) ? 9 : 2),
    ui: true
  },

  warning: {
    zoom: 1,
    width: 55,
    height: 55,
    color: new THREE.Color(0.7,0.7,0.7)
  },
  printer: {
    zoom: 1,
    width: 55,
    height: 55,
    color: new THREE.Color(0.3,0.9,0.3)
  },
  cocktail: {
    zoom: 1,
    width: 55,
    height: 55
  },
  exit: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  elevator: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  freight_elevator: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  stairs: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  lightning: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  delivery: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  coffee: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  beer: {
    zoom: 1,
    width: 55,
    height: 55,
    zoom: 0.8
  },
  message: {
    zoom: 1,
    width: 55,
    height: 55,
    zIndex: -1
  },
  male_restroom: {
    zoom: 1,
    width: 55,
    height: 55,
    zIndex: -1,
    zoom: 0.8
  },
  meeting_room: {
    zoom: 1,
    width: 55,
    height: 55,
    zIndex: -1,
    zoom: 0.8
  },
  female_restroom: {
    zoom: 1,
    width: 55,
    height: 55,
    zIndex: -1,
    zoom: 0.8
  },
  training: {
    zoom: 1,
    width: 55,
    height: 55,
    zIndex: -1,
    zoom: 0.8
  },
  expand: {
    zoom: 1,
    width: 24,
    height: 24,
    zIndex: -1,
    zoom: 0.85,
    paddingY: 65
  },
  minicompass: {
    zoom: 1,
    isCompass: true,
    width: 40,
    height: 40,
    zIndex: 10,
    preferredColor: new THREE.Color(233 / 255,85 / 255,164 / 255)
  }
};