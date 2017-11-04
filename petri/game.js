

Game = {}

Game.random = function(seed, counter) {
  x = (171 * x) % 30269;
  y = (172 * y) % 30307;
  z = (170 * z) % 30323;
  return (x / 30269.0 + y / 30307.0 + z / 30323.0) % 1.0;
}
Game.random.seed = function(seed) {

}
Game.Action = {
  get_food: function() {
    
  },
  get_safe: function() {
    
  }
};

var index = 0;
for (var name in Game.Action) {
  Game.Action[name].index = index++;
}






/*

  function consume_food(hunger, Food) {
    return hunger + Food.nutrition
  },

  function Food(zone) {
    return zone.food
  },

  function Food(food) {
    return food
  },
*/



Game.Building = {

}
