
Game.Zone = [
  function cloudiness(cloudiness, simulation, index) {
    return (Noise(
      simulation.seed + simulation.step / 100,
      simulation.seed + index
    ) / 2 + 0.5) * 100
  },

  function light(light, simulation, index) {
    return (Noise(
      simulation.seed + 1000 + simulation.step / 100,
      simulation.seed + 1000 + index
    ) / 2 + 0.5) * 100
  },

  function temperature(temperature, area, holes) {
    if (holes > 1)
      return 0

    return temperature + (area.temperature - temperature)
  }
]