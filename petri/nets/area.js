
Game.Area = [
  function temperature(temperature, simulation) {
    return temperature + ((simulation.step % 10) && (simulation.random() >= 0.5 ? 1 : -1));
  }
]
