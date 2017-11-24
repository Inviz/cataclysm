P.Queue = [];
P.Queue._push = P.Queue.push;
P.Queue.push = function() {
  this._push.apply(this, arguments);
  if (this.length)
    this.dispatch();
}


P.Queue.dispatch = function() {
  for (var i = 0; i < this.length; i++) {
    P.Import.message(this[i])
  }
};