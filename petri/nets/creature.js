
Game.Creature = [
  function hunger(hunger, simulation) {
    return Math.min(100, hunger + (simulation.step % 10 === 0));
  },

  // multiple transitions
  function fear_calming_down(fear) {
    return fear - fear / 100
  },

  function fear_from_damage(fear, damage) {
    return fear + Math.min(10, damage);
  },

  function fear_from_loud_noises(fear, noise) {
    return fear + Math.min(10, Math.max(0, (noise - 10)));
  },

  // exclusive sources of change 
  function room_temperature(temperature, zone, area) {
    if (zone)
      return temperature + (zone.temperature - temperature) / 10
    else 
      return temperature + (area.temperature - temperature) / 10
    return temperature
  },

  // decide action via in-place sorting by dynamic priority
  function action_got_hungry(action, hunger) {
    var priority = hunger;
    if (hunger > 1 && action % 1000 < priority) {
      return Game.Action.get_food.index * 1000 + priority
    }
    return action
  },

  function action_got_fearful(action, fear) {
    var priority = fear;
    if (fear > 50 && action % 1000 < priority) {
      return Game.Action.get_safe.index * 1000 + priority
    }
    return action
  }

]


