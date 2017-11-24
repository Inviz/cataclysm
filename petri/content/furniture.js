Game.Distributions.Furniture = {
  table: {
    INSIDE_TOP: {
      electronics: 0.2,
      food: 0.7,
      objects: 0.3,
      information: 0.2
    },
    OUTSIDE_INWARDS: {
      chair: 0.8
    }
  },

  chair: {
    INSIDE_TOP: {
      magazine: 0.2
    }
  }
}

Game.Furniture = {
  table: {
    width: 200,
    height: 200,
    maxWidth: 100,
    maxHeight: 100,

    blueprint: [
      {
        type: 'long_plate', 
        shift: new THREE.Vector3(-1, 1, 0)
      },
      {
        type: 'long_plate', 
        shift: new THREE.Vector3(0, 1, 0)
      },
      {
        type: 'long_plate', 
        shift: new THREE.Vector3(1, 1, 0)
      },
      {
        type: 'short_bar', 
        shift: new THREE.Vector3(-1, 0, -1)
      },
      {
        type: 'short_bar', 
        shift: new THREE.Vector3(1, 0, -1)
      },
      {
        type: 'short_bar', 
        shift: new THREE.Vector3(-1, 0, 1)
      },
      {
        type: 'short_bar', 
        shift: new THREE.Vector3(1, 0, 1)
      }
    ]
  },

  chair: {
    width: 70,
    height: 70
  },
  armchair: {
    width: 100,
    height: 100
  },

  small_table: {
    width: 200,
    height: 100
  },

  lamp: {
    width: 50,
    height: 50
  },

  stool: {
    width: 50,
    height: 50
  },

  shelf: {
    width: 60,
    height: 40
  },

  sofa: {
    width: 200,
    height: 80
  },

  tv: {
    width: 120,
    height: 20
  },

  bar_stand: {
    width: 150,
    height: 70
  }
}