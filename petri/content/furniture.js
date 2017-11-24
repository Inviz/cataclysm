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
    width: 20,
    height: 20,
    maxWidth: 10,
    maxHeight: 10,

    children: [
      {
        type: 'long_plate', 
        shift: new THREE.Vector3(-1, 1, 0),

        children: [

        ]
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
        shift: new THREE.Vector3(-1, 0, -1),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(1,0,0))
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
    width: 7,
    height: 7
  },
  armchair: {
    width: 10,
    height: 10
  },

  small_table: {
    width: 20,
    height: 10
  },

  lamp: {
    width: 5,
    height: 5
  },

  stool: {
    width: 5,
    height: 5
  },

  shelf: {
    width: 6,
    height: 4
  },

  sofa: {
    width: 20,
    height: 8
  },

  tv: {
    width: 12,
    height: 2
  },

  bar_stand: {
    width: 15,
    height: 7
  }
}