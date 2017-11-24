P.Wall.types = {
  stoneObject: {
    index: 0,
    color: new THREE.Color(0.7,0.7,0.7),
    isStone: true
  },
  stoneWall: {
    index: 1,
    color: new THREE.Color(0.7,0.7,0.7),
    isStone: true
  },
  stoneShortWall: {
    index: 2,
    color: new THREE.Color(0.7,0.7,0.7),
    isShort: true,
    isStone: true
  },


  metalObject: {
    index: 3,
    color: new THREE.Color(0.5,0.5,0.5)
  },
  metalDoor: {
    index: 4,
    color: new THREE.Color(0.5,0.5,0.5),
    rotateX: Math.PI / 10,
    isDoor: true,
    alternatives: [
      'metalInwardsDoor'
    ]
  },


  glassObject: {
    index: 5,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    isWindow: true,
    isGlass: true
  },
  glassDoor: {
    index: 6,
    rotateX: Math.PI / 10,
    color: P.styles.currentGlassColor,
    opacity: 0.5, 
    isGlass: true,
    isDoor: true,
    alternatives: [
      'glassInwardsDoor'
    ]
  },
  glassWall: {
    index: 7,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    isGlass: true
  },
  glassWindow: {
    index: 8,
    isWindow: true,
    color: new THREE.Color(0,1,1),
    opacity: 0.5,
    isGlass: true
  },

  metalClosedDoor: {
    index: 14,
    color: new THREE.Color(0.5,0.5,0.5),
    isDoor: true,
    alternatives: [
      'metalDoor'
    ]
  },

  glassClosedDoor: {
    index: 16,
    color: P.styles.currentGlassColor,
    opacity: 0.5, 
    isGlass: true,
    isDoor: true,
    alternatives: [
      'glassDoor'
    ]
  },

  metalInwardsDoor: {
    index: 24,
    rotateX: -Math.PI / 10,
    color: new THREE.Color(0.5,0.5,0.5),
    isDoor: true,
    alternatives: [
      'metalClosedDoor'
    ]
  },

  glassInwardsDoor: {
    index: 26,
    rotateX: -Math.PI / 10,
    color: P.styles.currentGlassColor,
    opacity: 0.5, 
    isGlass: true,
    isDoor: true,
    alternatives: [
      'glassClosedDoor'
    ]
  },


  frostedObject: {
    index: 9,
    color: P.styles.currentGlassColor,
    opacity: 0.7
  },


  stoneFurniture: {
    index: 100,
    isStone: true,
    isFurniture: true,
    isRectangle: true,
    color: new THREE.Color(0.7,0.7,0.7),
    imageSRC : 'images/furniture/sofa.png'
  },
  metalFurniture: {
    index: 110,
    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    color: new THREE.Color(0.5,0.5,0.5),
    imageSRC : 'images/furniture/sofa.png'
  },
  glassFurniture: {
    index: 120,
    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    imageSRC : 'images/furniture/sofa.png'
  },


  stoneTable: {
    index: 101,
    zIndex: -1,

    isStone: true,
    isFurniture: true,
    isRectangle: true,
    isWorkplace: true,
    isTable: true,
    imageSRC : 'images/furniture/table.png',
    alternatives: [
      'stonePlainTable'
    ]
  },
  metalTable: {
    index: 111,
    zIndex: -1,

    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    isWorkplace: true,
    isTable: true,
    color: new THREE.Color(0.5,0.5,0.5),
    imageSRC : 'images/furniture/table.png',
    alternatives: [
      'metalPlainTable'
    ]
  },
  glassTable: {
    index: 121,
    zIndex: -1,

    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    isWorkplace: true,
    isTable: true,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    imageSRC : 'images/furniture/table.png',
    alternatives: [
      'glassPlainTable'
    ]
  },

  stonePlainTable: {
    index: 201,
    zIndex: -1,

    isStone: true,
    isFurniture: true,
    isRectangle: true,
    isTable: true,
    imageSRC : 'images/furniture/table2.png',
    alternatives: [
      'stoneRoundTable'
    ]
  },
  metalPlainTable: {
    index: 211,
    zIndex: -1,

    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    isTable: true,
    color: new THREE.Color(0.5,0.5,0.5),
    imageSRC : 'images/furniture/table2.png',
    alternatives: [
      'metalRoundTable'
    ]
  },
  glassPlainTable: {
    index: 221,
    zIndex: -1,

    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    isTable: true,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    imageSRC : 'images/furniture/table2.png',
    alternatives: [
      'glassRoundTable'
    ]
  },




  simpleSofa: {
    index: 102,
    isStone: true,
    isFurniture: true,
    isRectangle: true,
    imageSRC : 'images/furniture/sofa2.png',
    isSofa: true,
    alternatives: ['armchairSofa']
  },
  armchairSofa: {
    index: 112,
    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    imageSRC : 'images/furniture/sofa.png',
    isSofa: true,
    alternatives: ['simpleSofa']
  },
  glassSofa: {
    index: 122,
    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    color: new THREE.Color(0.5,0.5,0.5),
    opacity: 0.5,
    imageSRC : 'images/furniture/sofa2.png',
    isSofa: true
  },



  stoneChair: {
    index: 103,
    isStone: true,
    isFurniture: true,
    isRectangle: true,
    isChair: true,
    imageSRC : 'images/furniture/chairs.png',
    color: new THREE.Color(1,1,1),
    scale: 32 / 35,
    variations: 4,
    isFixedSize: [35, 35]
  },
  metalChair: {
    index: 113,
    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    isChair: true,
    color: new THREE.Color(0.5,0.5,0.5),
    imageSRC : 'images/furniture/chairs.png',
    scale: 32 / 35,
    variations: 4,
    isFixedSize: [35, 35]
  },
  glassChair: {
    index: 123,
    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    isChair: true,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    imageSRC : 'images/furniture/chairs.png',
    scale: 32 / 35,
    variations: 4,
    isFixedSize: [35, 35]
  },



  stoneRoundTable: {
    index: 104,
    zIndex: -1,

    isStone: true,
    isFurniture: true,
    isRectangle: true,
    isTable: true,
    imageSRC : 'images/furniture/round.png',
    isFixedSize: [35, 35],
    alternatives: [
      'stoneBigRoundTable'
    ]
  },
  metalRoundTable: {
    index: 114,
    zIndex: -1,

    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    isTable: true,
    color: new THREE.Color(0.5,0.5,0.5),
    imageSRC : 'images/furniture/round.png',
    isFixedSize: [35, 35],
    alternatives: [
      'metalBigRoundTable'
    ]
  },
  glassRoundTable: {
    index: 124,
    zIndex: -1,

    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    isTable: true,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    imageSRC : 'images/furniture/round.png',
    isFixedSize: [35, 35],
    alternatives: [
      'glassBigRoundTable'
    ]
  },

  stoneBigRoundTable: {
    index: 105,
    zIndex: -1,

    isStone: true,
    isFurniture: true,
    isRectangle: true,
    isTable: true,
    imageSRC : 'images/furniture/round2.png',
    isFixedSize: [55, 55],
    alternatives: [
      'stoneTable'
    ]
  },
  metalBigRoundTable: {
    index: 115,
    zIndex: -1,

    isMetal: true,
    isFurniture: true,
    isRectangle: true,
    isTable: true,
    color: new THREE.Color(0.5,0.5,0.5),
    imageSRC : 'images/furniture/round2.png',
    isFixedSize: [70, 70],
    alternatives: [
      'metalTable'
    ]
  },
  glassBigRoundTable: {
    index: 125,
    zIndex: -1,

    isGlass: true,
    isRectangle: true,
    isFurniture: true,
    isTable: true,
    color: P.styles.currentGlassColor,
    opacity: 0.5,
    imageSRC : 'images/furniture/round2.png',
    isFixedSize: [70, 70],
    alternatives: [
      'glassTable'
    ]
  },

  activePrinter: {
    index: 1000,
    isStone: true,
    isFurniture: true,
    isRectangle: true,
    //color: new THREE.Color(0.0,0.7,0.0),
    imageSRC : 'images/furniture/printer.png',
    isFixedSize: [65, 65],
    onClick: function() {
      if (!this.panel)
        this.panel = new P.Panel.Profile({
          object: this,
          target: this,
          parent: this,
          icon: null
        })

      P.Scene.setTarget(this)
      P.Panel.open(this)
      P.Panel.instances.changes |= P.Furniture.instances.UPDATE_RESET
      P.animate.start()
    },
    alternatives: ['smallPlant']
  },
  inactivePrinter: {
    index: 1001,
    isStone: true,
    isFurniture: true,
    isRectangle: true,
    //color: new THREE.Color(0.7,0,0.0),
    imageSRC : 'images/furniture/printer.png',
    isFixedSize: [65, 65],
    onClick: function() {
      if (!this.panel)
        this.panel = new P.Panel.Profile({
          object: this,
          target: this,
          parent: this,
          icon: null
        })

      P.Scene.setTarget(this)
      P.Panel.open(this)
      P.Panel.instances.changes |= P.Furniture.instances.UPDATE_RESET
      P.animate.start()
    },
    alternatives: ['smallPlant']
  },
  smallPlant: {
    index: 1100,
    isStone: true,
    isFurniture: true,
    isRectangle: true,
    //color: new THREE.Color(0.7,0,0.0),
    imageSRC : 'images/furniture/plant.png',
    isFixedSize: [35, 35],
    alternatives: ['activePrinter']
  }
}


for (var property in P.Wall.types)
  P.Wall.types[P.Wall.types[property].index] = P.Wall.types[property];