/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() { return this })() || Function("return this")()
);














































(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var Mathmin = Math.min;
var Mathmax = Math.max;
var Mathabs = Math.abs;

var ROUGHLY_EPSILON = 1e-4;

function clamp(min, number, max) {
  return Mathmin(Mathmax(number, min), max);
}

function between(min, number, max) {
  return min <= number && number <= max;
}





function roughlyEqual$1(number, other, epsilon) {
  return Mathabs(number - other) <= (epsilon || ROUGHLY_EPSILON);
}

function roughlyEqualVec2(a, b, epsilon) {
  return Math.abs(a[0] - b[0]) <= (epsilon || ROUGHLY_EPSILON) && Math.abs(a[1] - b[1]) <= (epsilon || ROUGHLY_EPSILON);
}





function roughlyBetween(min, number, max, epsilon) {
  return (min < number || isRoughly(min, number, epsilon)) && (number < max || isRoughly(max, number, epsilon));
}





function assert(condition, message) {
  if (!condition) {
    throw message || "Assertion failed";
  }
}

function isRoughly(a, b, epsilon) {
  return Math.abs(a - b) <= (epsilon || ROUGHLY_EPSILON);
}

//import { create } from './Vector';

var Vector2 = function Vector2(x, y) {
       return Vector2.fromValues(x, y);
};
//create(2, Vector2);

var properties = {
       "crossz": { value: crossz },
       "cross": { value: cross },
       "perpendicular": { value: perpendicular },
       "scalePerpendicularAndAdd": { value: scalePerpendicularAndAdd },
       "angleBetween": { value: angleBetween },
       "angleBetweenWithDirections": { value: angleBetweenWithDirections },
       "rotate": { value: rotate }
};

Object.defineProperties(Vector2, properties);
function crossz(a, b) {
       return a[0] * b[1] - b[0] * a[1];
}

function cross(output, a, b) {
       output[0] = 0;
       output[1] = 1;
       output[2] = crossz(a, b);
       return output;
}

function perpendicular(output, a) {
       output[0] = a[1];
       output[1] = -a[0];
       return output;
}

function scalePerpendicularAndAdd(output, a, b, scale) {
       output[0] = a[0] + b[1] * scale;
       output[1] = a[1] - b[0] * scale;
       return output;
}

function angleBetween(a, b) {
       var theta = Vector2.dot(a, b) / (Vector2.len(a) * Vector2.len(b));
       return Math.acos(clamp(theta, -1, 1));
}

function angleBetweenWithDirections(a, aDirection, b) {
       var simpleAngle = angleBetween(a, b);
       var linearDirection = Vector2.sub(Vector2.fromValues(0, 0), b, a);

       if (Vector2.dot(aDirection, linearDirection) >= 0) {
              return simpleAngle;
       } else {
              return 2 * Math.PI - simpleAngle;
       }
}

function rotate(out, v, angle) {
       // slow version:
       // return Matrix2x2.map(out, Matrix2x2.rotation(angle), v);

       var x = v[0],
           y = v[1],
           c = Math.cos(angle),
           s = Math.sin(angle);

       out[0] = c * x - s * y;
       out[1] = s * x + c * y;
       return out;
}
Vector2.prototype.create = function create() {
       return [0, 0];
};
Vector2.prototype.clone = function clone(out) {
       return out.slice();
};
Vector2.prototype.fromSource = function fromSource(x, y) {
       return [x, y];
};
Vector2.prototype.copy = function copy(out, a) {
       out[0] = a[0];
       out[1] = a[1];
       return out;
};
Vector2.prototype.set = function set(out, x, y) {
       out[0] = x;
       out[1] = y;
       return out;
};
Vector2.prototype.add = function add(out, a, b) {
       out[0] = a[0] + b[0];
       out[1] = a[1] + b[1];
       return out;
};
Vector2.prototype.sub = function sub(out, a, b) {
       out[0] = a[0] - b[0];
       out[1] = a[1] - b[1];
       return out;
};
Vector2.prototype.mul = function mul(out, a, b) {
       out[0] = a[0] * b[0];
       out[1] = a[1] * b[1];
       return out;
};
Vector2.prototype.div = function div(out, a, b) {
       out[0] = a[0] / b[0];
       out[1] = a[1] / b[1];
       return out;
};
Vector2.prototype.min = function min(out, a, b) {
       out[0] = Math.min(a[0], b[0]);
       out[1] = Math.min(a[1], b[1]);
       return out;
};
Vector2.prototype.max = function max(out, a, b) {
       out[0] = Math.max(a[0], b[0]);
       out[1] = Math.max(a[1], b[1]);
       return out;
};
Vector2.prototype.scale = function scale(out, a, b) {
       out[0] = a[0] * b;
       out[1] = a[1] * b;
       return out;
};
Vector2.prototype.scaleAndAdd = function scaleAndAdd(out, a, b, c) {
       out[0] = a[0] + b[0] * c;
       out[1] = a[1] + b[1] * c;
       return out;
};
Vector2.prototype.lerp = function lerp(out, a, b, t) {
       var ax = a[0],
           ay = a[1];
       out[0] = ax + t * (b[0] - ax);
       out[1] = ay + t * (b[1] - ay);
       return out;
};
Vector2.prototype.negate = function negate(out, a) {
       out[0] = -a[0];
       out[1] = -a[1];
       return out;
};
Vector2.prototype.inverse = function inverse(out, a) {
       out[0] = 1.0 / a[0];
       out[1] = 1.0 / a[1];
       return out;
};
Vector2.prototype.normalize = function normalize(out, a) {
       var ax = a[0],
           ay = a[1],
           x = ax * ax + ay * ay,
           length = x > 0 ? 1.0 / Math.sqrt(x) : 0;
       out[0] = ax * length;
       out[1] = ay * length;
       return out;
};
Vector2.prototype.dot = function dot(a, b) {
       return a[0] * b[0] + a[1] * b[1];
};
Vector2.prototype.wellFormed = function wellFormed(a) {
       var ax = a[0],
           ay = a[1];
       return Number.isFinite(ax) && !Number.isNaN(ax) && Number.isFinite(ay) && !Number.isNaN(ay);
};
Vector2.prototype.squaredLength = function squaredLength(a) {
       var ax = a[0],
           ay = a[1];
       return ax * ax + ay * ay;
};
Vector2.prototype.len = function len(a) {
       var ax = a[0],
           ay = a[1];
       return Math.sqrt(ax * ax + ay * ay);
};
Vector2.prototype.squaredDistance = function squaredDistance(a, b) {
       var x = b[0] - a[0],
           y = b[1] - a[1];
       return x * x + y * y;
};
Vector2.prototype.dist = function dist(a, b) {
       var x = b[0] - a[0],
           y = b[1] - a[1];
       return Math.sqrt(x * x + y * y);
};
Vector2.prototype.sum = function sum(a) {
       return a[0] + a[1];
};
Vector2.fromValues = Vector2.prototype.fromSource;
for (var property in Vector2.prototype) {
       Vector2[property] = Vector2.prototype[property];
}

//import { create } from './Vector';
var Vector3 = function Vector3(x, y, z) {
            return Vector3.fromValues(x, y, z);
};

//create(3, Vector3);
Object.defineProperties(Vector3, {
            "cross": { value: cross$1 }
});
function cross$1(output, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                bx = b[0],
                by = b[1],
                bz = a[2];

            output[0] = ay * bz - az * by;
            output[1] = az * bx - ax * bz;
            output[2] = ax * by - ay * bx;
            return output;
}

Vector3.prototype.create = function create() {
            return [0, 0, 0];
};
Vector3.prototype.clone = function clone(out) {
            return out.slice();
};
Vector3.prototype.fromSource = function fromSource(x, y, z) {
            return [x, y, z];
};
Vector3.prototype.copy = function copy(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            return out;
};
Vector3.prototype.set = function set(out, x, y, z) {
            out[0] = x;
            out[1] = y;
            out[2] = z;
            return out;
};
Vector3.prototype.add = function add(out, a, b) {
            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            out[2] = a[2] + b[2];
            return out;
};
Vector3.prototype.sub = function sub(out, a, b) {
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            out[2] = a[2] - b[2];
            return out;
};
Vector3.prototype.mul = function mul(out, a, b) {
            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            out[2] = a[2] * b[2];
            return out;
};
Vector3.prototype.div = function div(out, a, b) {
            out[0] = a[0] / b[0];
            out[1] = a[1] / b[1];
            out[2] = a[2] / b[2];
            return out;
};
Vector3.prototype.min = function min(out, a, b) {
            out[0] = Math.min(a[0], b[0]);
            out[1] = Math.min(a[1], b[1]);
            out[2] = Math.min(a[2], b[2]);
            return out;
};
Vector3.prototype.max = function max(out, a, b) {
            out[0] = Math.max(a[0], b[0]);
            out[1] = Math.max(a[1], b[1]);
            out[2] = Math.max(a[2], b[2]);
            return out;
};
Vector3.prototype.scale = function scale(out, a, b) {
            out[0] = a[0] * b;
            out[1] = a[1] * b;
            out[2] = a[2] * b;
            return out;
};
Vector3.prototype.scaleAndAdd = function scaleAndAdd(out, a, b, c) {
            out[0] = a[0] + b[0] * c;
            out[1] = a[1] + b[1] * c;
            out[2] = a[2] + b[2] * c;
            return out;
};
Vector3.prototype.lerp = function lerp(out, a, b, t) {
            var ax = a[0],
                ay = a[1],
                az = a[2];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            out[2] = az + t * (b[2] - az);
            return out;
};
Vector3.prototype.negate = function negate(out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            out[2] = -a[2];
            return out;
};
Vector3.prototype.inverse = function inverse(out, a) {
            out[0] = 1.0 / a[0];
            out[1] = 1.0 / a[1];
            out[2] = 1.0 / a[2];
            return out;
};
Vector3.prototype.normalize = function normalize(out, a) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                x = ax * ax + ay * ay + az * az,
                length = x > 0 ? 1.0 / sqrt(x) : 0;
            out[0] = ax * length;
            out[1] = ay * length;
            out[2] = az * length;
            return out;
};
Vector3.prototype.dot = function dot(a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};
Vector3.prototype.wellFormed = function wellFormed(a) {
            var ax = a[0],
                ay = a[1],
                az = a[2];
            return Number.isFinite(ax) && !Number.isNaN(ax) && Number.isFinite(ay) && !Number.isNaN(ay) && Number.isFinite(az) && !Number.isNaN(az);
};
Vector3.prototype.squaredLength = function squaredLength(a) {
            var ax = a[0],
                ay = a[1],
                az = a[2];
            return ax * ax + ay * ay + az * az;
};
Vector3.prototype.len = function len(a) {
            var ax = a[0],
                ay = a[1],
                az = a[2];
            return sqrt(ax * ax + ay * ay + az * az);
};
Vector3.prototype.squaredDistance = function squaredDistance(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1],
                z = b[2] - a[2];
            return x * x + y * y + z * z;
};
Vector3.prototype.dist = function dist(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1],
                z = b[2] - a[2];
            return sqrt(x * x + y * y + z * z);
};
Vector3.prototype.sum = function sum(a) {
            return a[0] + a[1] + a[2];
};
Vector3.fromValues = Vector3.prototype.fromSource;
Vector3.clone = Vector3.prototype.clone;

function theta(v) {
  var angle = Math.atan2(v[1], v[0]);
  return (angle < 0 ? angle + 2 * Math.PI : angle) / (2 * Math.PI);
}

function Intersection(x, y, u, v) {
  this.p = Vector2.fromValues(x, y);
  this.u = u;
  this.v = v;
}

Object.defineProperties(Intersection.prototype, {
  "isDegenerate": { get: function get() {
      return this.uIsDegenerate || this.vIsDegenerate;
    } },
  "uIsDegenerate": { get: function get() {
      return roughlyEqual$1(this.u, 0) || roughlyEqual$1(this.u, 1);
    } },
  "vIsDegenerate": { get: function get() {
      return roughlyEqual$1(this.v, 0) || roughlyEqual$1(this.v, 1);
    } },

  "boundingBox": { get: boundingBox$1 },
  "draw": { value: draw$1 }
});

function boundingBox$1() {
  return Rectangle.corner(this.p, this.p);
}

function draw$1(context) {
  context.dot(this.p);
}

var THICKNESS$1 = 0.03;
function pointToLineDistance(point, start, direction) {
  var perpendicularDirection = Vector2.perpendicular(Vector2(0, 0), direction);
  return Math.abs(Vector2.dot(Vector2.sub(Vector2(0, 0), point, start), perpendicularDirection));
}

// http://stackoverflow.com/questions/2931573/determining-if-two-rays-intersect
function rayRayIntersections(a, b) {
  var det = b.direction[0] * a.direction[1] - b.direction[1] * a.direction[0];

  // Parallel, overlap or no intersection
  if (roughlyEqual$1(det, 0)) {
    // edge case: same start position
    if (roughlyEqualVec2(a.start, b.start, THICKNESS$1)) return [new Intersection(a.start[0], a.start[1], 0, 0)];

    // not facing the same direction
    if (!roughlyEqualVec2(a.direction, b.direction)) return [];

    // too far apart
    if (pointToLineDistance(a.start, b.start, b.direction) > THICKNESS$1) return [];

    // a contains b or b contains a depending on the
    // direction from a.start to b.start
    var bToA = Vector2(0, 0);
    Vector2.sub(bToA, b.start, a.start);
    Vector2.normalize(bToA, bToA);
    if (roughlyEqualVec2(a.direction, bToA)) return [new Intersection(b.start[0], b.start[1], 0, 0)];else return [new Intersection(a.start[0], a.start[1], 0, 0)];
  }

  var dx = b.start[0] - a.start[0];
  var dy = b.start[1] - a.start[1];
  var u = (dy * b.direction[0] - dx * b.direction[1]) / det;
  var v = (dy * a.direction[0] - dx * a.direction[1]) / det;

  // No intersection
  if (u < -THICKNESS$1 || v < -THICKNESS$1) return [];

  if (u < 0 && u > -THICKNESS$1) u = 0;
  if (v < 0 && v > -THICKNESS$1) v = 0;

  return [new Intersection(a.start[0] + u * a.direction[0], a.start[1] + u * a.direction[1], u, v)];
}

function lineLineIntersections(a, b) {
  var det = b.direction[0] * a.direction[1] - b.direction[1] * a.direction[0];

  // Parallel, overlap or no intersection
  if (roughlyEqual$1(det, 0)) {
    // edge case: same start position
    if (roughlyEqualVec2(a.middle, b.middle, THICKNESS$1)) return [new Intersection(a.middle[0], a.middle[1], 0, 0)];

    // too far apart
    if (pointToLineDistance(a.middle, b.middle, b.direction) > THICKNESS$1) return [];

    // a contains b or b contains a depending on the
    // direction from a.middle to b.middle
    var c = Vector2(0, 0);
    Vector2.sub(c, b.middle, a.middle);
    Vector2.normalize(c, c);
    if (roughlyEqualVec2(a.direction, c)) return [new Intersection(b.middle[0], b.middle[1], 0, 0)];else return [new Intersection(a.middle[0], a.middle[1], 0, 0)];
  }

  var dx = b.middle[0] - a.middle[0];
  var dy = b.middle[1] - a.middle[1];
  var u = (dy * b.direction[0] - dx * b.direction[1]) / det;
  var v = (dy * a.direction[0] - dx * a.direction[1]) / det;

  return [new Intersection(a.middle[0] + u * a.direction[0], a.middle[1] + u * a.direction[1], u, v)];
}

function lineRayIntersections(a, b) {
  return swapuv(rayLineIntersections(b, a));
}
function rayLineIntersections(a, b) {
  var det = b.direction[0] * a.direction[1] - b.direction[1] * a.direction[0];

  // Parallel, overlap or no intersection
  if (roughlyEqual$1(det, 0)) {
    // edge case: same start position
    if (roughlyEqualVec2(a.start, b.middle, THICKNESS$1)) return [new Intersection(a.start[0], a.start[1], 0, 0)];

    // too far apart
    if (pointToLineDistance(a.start, b.middle, b.direction) > THICKNESS$1) return [];

    // a contains b or b contains a depending on the
    // direction from a.start to b.middle
    var c = Vector2(0, 0);
    Vector2.sub(c, b.middle, a.start);
    Vector2.normalize(c, c);
    if (roughlyEqualVec2(a.direction, c)) return [new Intersection(b.middle[0], b.middle[1], 0, 0)];else return [new Intersection(a.start[0], a.start[1], 0, 0)];
  }

  var dx = b.middle[0] - a.start[0];
  var dy = b.middle[1] - a.start[1];
  var u = (dy * b.direction[0] - dx * b.direction[1]) / det;
  var v = (dy * a.direction[0] - dx * a.direction[1]) / det;

  // No intersection
  if (u < -THICKNESS$1) return [];

  if (u < 0 && u > -THICKNESS$1) u = 0;

  return [new Intersection(a.start[0] + u * a.direction[0], a.start[1] + u * a.direction[1], u, v)];
}

function lineSegmentRayIntersections(line, ray) {
  return swapuv(rayLineSegmentIntersections(ray, line));
}
function rayLineSegmentIntersections(ray, line) {
  var potentials = rayRayIntersections(ray, line),
      lineLength = line.length,
      intersects = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = potentials[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var potential = _step.value;

      if (potential.v <= lineLength + THICKNESS$1) {
        potential.v /= lineLength;
        potential.v = Math.min(potential.v, 1);
        intersects.push(potential);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return intersects;
}

function lineSegmentLineSegmentIntersections(a, b) {
  var da = Vector2.sub(Vector2(0, 0), a.end, a.start);
  var db = Vector2.sub(Vector2(0, 0), b.end, b.start);
  var na = Vector2.normalize(Vector2(0, 0), da);
  var nb = Vector2.normalize(Vector2(0, 0), db);
  var orientation = Vector2.crossz(na, nb);

  // Parallel - overlapping or no intersection
  if (roughlyEqual$1(orientation, 0)) {
    // too far apart
    if (pointToLineDistance(a.start, b.start, b.direction) > THICKNESS$1) return [];

    // edge case: both lines have zero length
    if (roughlyEqual$1(a.length, 0) && roughlyEqual$1(b.length, 0)) return [];

    // sort the positions by either the x-coordinate, or y-coordinate if they
    // share the same x-coordinate. If they share the same x and y coordinates
    // then the shared point test later will pick it up.
    // this will leave the sorted array as:
    //     [outside, inside, inside, outside]
    //     [n/a, shared, shared, n/a]
    //     [n/a, shared, inside, outside]
    //     [outside, inside, shared, n/a]
    // or for the case where there is no intersection
    //     [outside, outside, outside, outside]
    var sorted = [{ id: 0, position: a.start }, { id: 1, position: a.end }, { id: 2, position: b.start }, { id: 3, position: b.end }];
    if (roughlyEqual$1(a.start[0], a.end[0], THICKNESS$1) && roughlyEqual$1(b.start[0], b.end[0], THICKNESS$1)) {
      sorted.sort(function (q, r) {
        return q.position[1] > r.position[1];
      });
    } else {
      sorted.sort(function (q, r) {
        return q.position[0] > r.position[0];
      });
    }

    // Shared point in the center
    if (roughlyEqualVec2(sorted[1].position, sorted[2].position, THICKNESS$1)) {
      var position = sorted[1].position;
      return [new Intersection(position[0], position[1], a.getAlphaValueAtPosition(position), b.getAlphaValueAtPosition(position))];
    }

    // Check if the first two points in the sorted set are (a.start, a.end), or (b.start, b.end)
    // indicating that the two lines do not overlap
    var order = sorted[0].id + sorted[1].id;
    if (order == 1 || order == 5) return [];

    var position1 = sorted[1].position,
        position2 = sorted[2].position,
        u1 = a.getAlphaValueAtPosition(position1),
        v1 = b.getAlphaValueAtPosition(position1),
        u2 = a.getAlphaValueAtPosition(position2),
        v2 = b.getAlphaValueAtPosition(position2);

    return [new Intersection(position1[0], position1[1], u1, v1), new Intersection(position2[0], position2[1], u2, v2)];
  }

  var determinant = Vector2.crossz(db, da);
  var u = (db[0] * (b.start[1] - a.start[1]) - db[1] * (b.start[0] - a.start[0])) / determinant;
  var v = (da[0] * (b.start[1] - a.start[1]) - da[1] * (b.start[0] - a.start[0])) / determinant;
  //u = tidydown(tidyup(u));
  //v = tidydown(tidyup(v));

  // No intersection
  // TODO: for flat angles this approximation is stupid
  // u might be much further away from 0 than -Thickness,
  // even when lines are just thickness apart
  var uTolerance = THICKNESS$1 / Vector2.len(da);
  var vTolerance = THICKNESS$1 / Vector2.len(db);
  if (!between(-uTolerance, u, 1 + uTolerance)) return [];
  if (!between(-vTolerance, v, 1 + vTolerance)) return [];

  u = clamp(0, u, 1);
  v = clamp(0, v, 1);

  var p = Vector2(0, 0);
  Vector2.lerp(p, a.start, a.end, u);
  return [new Intersection(p[0], p[1], u, v)];
}

function circleLineSegmentIntersections(circle, line) {
  return swapuv(lineSegmentCircleIntersections(line, circle));
}
function lineSegmentCircleIntersections(line, circle) {
  var dp = Vector2(0, 0);
  Vector2.sub(dp, line.end, line.start);
  var a = Vector2.squaredLength(dp);
  var b = 2 * (dp[0] * (line.start[0] - circle.center[0]) + dp[1] * (line.start[1] - circle.center[1]));
  var c = Vector2.squaredLength(circle.center);
  c += Vector2.squaredLength(line.start);
  c -= 2 * (circle.center[0] * line.start[0] + circle.center[1] * line.start[1]);
  var cCenter = c - circle.radius * circle.radius;
  var cInner = c - (circle.radius * circle.radius - THICKNESS$1 * THICKNESS$1);
  var cOuter = c - (circle.radius * circle.radius + THICKNESS$1 * THICKNESS$1);
  var bb4acCenter = b * b - 4 * a * cCenter;
  var bb4acInner = b * b - 4 * a * cInner;
  var bb4acOuter = b * b - 4 * a * cOuter;

  // No intersection
  if (Math.abs(a) <= ROUGHLY_EPSILON || bb4acCenter < 0 && bb4acInner < 0 && bb4acOuter < 0) return [];

  var s1Center = (-b + Math.sqrt(bb4acCenter)) / (2 * a);
  var s2Center = (-b - Math.sqrt(bb4acCenter)) / (2 * a);
  var s1Inner = (-b + Math.sqrt(bb4acInner)) / (2 * a);
  var s2Inner = (-b - Math.sqrt(bb4acInner)) / (2 * a);
  var s1Outer = (-b + Math.sqrt(bb4acOuter)) / (2 * a);
  var s2Outer = (-b - Math.sqrt(bb4acOuter)) / (2 * a);

  var s1 = between(0, s1Center, 1) ? s1Center : between(0, s1Outer, 1) ? s1Outer : s1Inner;
  var s2 = between(0, s2Center, 1) ? s2Center : between(0, s2Outer, 1) ? s2Outer : s2Inner;

  var solution1exists = between(0, s1, 1);
  var solution2exists = !roughlyEqual$1(s1, s2) && between(0, s2, 1);
  var solution1, solution2;
  var p = Vector2(0, 0);

  // Solution 1
  if (solution1exists) {
    solution1 = new Intersection(line.start[0] + s1 * dp[0], line.start[1] + s1 * dp[1], s1, null);
    Vector2.sub(p, solution1.p, circle.center);
    solution1.v = theta(p);
    if (!solution2exists) return [solution1];
  } else {
    if (!solution2exists) return [];
  }

  // Solution 2
  if (solution2exists) {
    solution2 = new Intersection(line.start[0] + s2 * dp[0], line.start[1] + s2 * dp[1], s2, null);
    Vector2.sub(p, solution2.p, circle.center);
    solution2.v = theta(p);
    if (!solution1exists) return [solution2];
  }

  return [solution1, solution2];
}

function curveLineSegmentIntersections(curve, line) {
  return swapuv(lineSegmentCurveIntersections(line, curve));
}
function lineSegmentCurveIntersections(line, curve) {
  //throw "No!!"
  var potentials = lineSegmentCircleIntersections(line, curve);
  var intersections = [];
  for (var i = 0; i < potentials.length; i++) {
    var intersection = potentials[i];
    if (curve.wedgeContainsPoint(intersection.p, THICKNESS$1)) {
      intersection.v = curve.getAlphaValueAtPosition(intersection.p);
      intersection.u = clamp(0, intersection.u, 1);
      intersection.v = clamp(0, intersection.v, 1);
      intersections.push(intersection);
    }
  }
  return intersections;
}

function circleCircleIntersections(a, b) {
  var c0 = a.center;
  var c1 = b.center;
  var r0 = a.radius;
  var r1 = b.radius;
  var d = Vector2.dist(c0, c1);

  // No solution, circles are the same
  if (d == 0 && r0 == r1) return [];

  // No solution, circles do not intersect
  if (d > r0 + r1) return [];

  // No solution, one circle inside the other
  if (d < Math.abs(r0 - r1)) return [];

  // Determine the distance from center c0 to centroid
  var c = (r0 * r0 - r1 * r1 + d * d) / (2 * d);

  // Determine the distance from centroid to either intersection point
  var h = Math.sqrt(r0 * r0 - c * c);

  // Determine position of centroid
  var dx = c1[0] - c0[0];
  var dy = c1[1] - c0[1];
  var cx = c0[0] + dx * c / d;
  var cy = c0[1] + dy * c / d;

  // Determine the offset vector from the centroid to the intersection points
  var rx = -dy * h / d;
  var ry = dx * h / d;

  "Solution 1";
  var p = Vector2(0, 0);
  var solution1 = new Intersection(cx + rx, cy + ry, 0, 0);
  Vector2.sub(p, solution1.p, c0);
  solution1.u = theta(p);
  Vector2.sub(p, solution1.p, c1);
  solution1.v = theta(p);

  if (roughlyEqual$1(h, 0)) return [solution1];

  "Solution 2";
  var solution2 = new Intersection(cx - rx, cy - ry, 0, 0);
  Vector2.sub(p, solution2.p, c0);
  solution2.u = theta(p);
  Vector2.sub(p, solution2.p, c1);
  solution2.v = theta(p);
  return [solution1, solution2];
}

function curveCurveIntersections(a, b) {
  var intersections = [];

  if (roughlyEqualVec2(a.center, b.center, THICKNESS$1) && roughlyEqual$1(a.radius, b.radius, THICKNESS$1)) {
    if (a.wedgeContainsPoint(b.start, THICKNESS$1)) intersections.push(new Intersection(b.start[0], b.start[1], a.getAlphaValueAtPosition(b.start), 0));

    if (a.wedgeContainsPoint(b.end, THICKNESS$1)) intersections.push(new Intersection(b.end[0], b.end[1], a.getAlphaValueAtPosition(b.end), 1));

    if (intersections.length == 2) return intersections;

    if (b.wedgeContainsPoint(a.start, THICKNESS$1)) intersections.push(new Intersection(a.start[0], a.start[1], 0, b.getAlphaValueAtPosition(a.start)));

    if (intersections.length == 2) return intersections;

    if (b.wedgeContainsPoint(a.end, THICKNESS$1)) intersections.push(new Intersection(a.end[0], a.end[1], 1, b.getAlphaValueAtPosition(a.end)));

    return intersections;
  }

  var potentials = circleCircleIntersections(a, b);
  for (var i = 0; i < potentials.length; i++) {
    var intersection = potentials[i];
    //console.log("curve-curve potential", intersection);
    if (a.wedgeContainsPoint(intersection.p, THICKNESS$1) && b.wedgeContainsPoint(intersection.p, THICKNESS$1)) {
      intersection.u = a.getAlphaValueAtPosition(intersection.p);
      intersection.v = b.getAlphaValueAtPosition(intersection.p);
      intersections.push(intersection);
    }
  }
  return intersections;
}

function swapuv(intersections) {
  for (var i = 0; i < intersections.length; i++) {
    var intersection = intersections[i],
        u = intersection.u,
        v = intersection.v;
    intersection.u = v;
    intersection.v = u;
  }
  return intersections;
}

// RAY = 1 and 2
// LINE_SEGMENT = 4 and 8
// CIRCLE = 16 and 32
// CURVE = 64 and 128
//
// RAY(1) + RAY(2) = 3
// RAY(1) + LINE_SEGMENT(4) = 5
// LINE_SEGMENT(4) + RAY(2) = 6
// LINE_SEGMENT(4) + LINE_SEGMENT(8) = 12
// LINE_SEGMENT(4) + CIRCLE(16) = 20
// CIRCLE(16) + LINE_SEGMENT(8) = 24
// CIRCLE(16) + CIRCLE(32) = 48
// etc
var intersections = [];
function intersectionTypeLookup(a, b) {
  return a + 2 * b;
}
function intersectionTypeInstall(a, b, f) {
  var type = intersectionTypeLookup(a, b);
  assert(intersections[type] == null);
  intersections[type] = f;
}

var RAY = 1;
var LINE = 4;
var LINE_SEGMENT = 16;
var CIRCLE = 64;
var CURVE = 256;
intersectionTypeInstall(RAY, RAY, rayRayIntersections);
intersectionTypeInstall(RAY, LINE, rayLineIntersections);
intersectionTypeInstall(RAY, LINE_SEGMENT, rayLineSegmentIntersections);
intersectionTypeInstall(LINE, LINE, lineLineIntersections);
intersectionTypeInstall(LINE, RAY, lineRayIntersections);
intersectionTypeInstall(LINE_SEGMENT, RAY, lineSegmentRayIntersections);
intersectionTypeInstall(LINE_SEGMENT, LINE_SEGMENT, lineSegmentLineSegmentIntersections);
intersectionTypeInstall(LINE_SEGMENT, CIRCLE, lineSegmentCircleIntersections);
intersectionTypeInstall(LINE_SEGMENT, CURVE, lineSegmentCurveIntersections);
intersectionTypeInstall(CIRCLE, LINE_SEGMENT, circleLineSegmentIntersections);
intersectionTypeInstall(CIRCLE, CIRCLE, circleCircleIntersections);
intersectionTypeInstall(CURVE, LINE_SEGMENT, curveLineSegmentIntersections);
intersectionTypeInstall(CURVE, CURVE, curveCurveIntersections);

function intersect$1(a, b) {
  // I know what you're thinking. I've thought the same thing
  // quite a few times myself. You're here because of an exception
  // or perhaps you're just reading the code. If you're just
  // reading the code then you're thinking this is an odd kind of
  // comment to stumble upon. If you're here because of an
  // exception you're thinking gee I wish there was a catch here
  // to make sure 'a' and 'b' are actually geometric objects that
  // we can measure the intersection between. You must resist the
  // temptation to add such a test because intersect() is called
  // all over the place, constantly and in many tight loops. Your
  // real issue is somewhere else up in the stack. Go look there,
  // not here. Here you will find no answers, only pain and
  // suffering and darkness and all that other stuff the Jedi
  // want you to believe about the dark side that clearly isn't
  // true. The dark side just wants us to be ourselves, to feel
  // our emotions and learn to be responsible with it. It's that
  // Lucas fellow and his strange 'light side' and 'dark side'
  // biases that have fooled so much of the world in to believing
  // that the dark side only leads to gibbering power hungry
  // idiots with no self control and that somehow living a life
  // without love, with attachments, is the ultimate way to be
  // in touch with the force. I've digressed. The point is, you
  // don't want to look here, your issue is elsewhere.
  var type = intersectionTypeLookup(a.type(), b.type());
  return intersections[type](a, b);
}

intersect$1.RayTypeFunction = function () {
  return RAY;
};
intersect$1.RayTypeFunction.typeName = "ray";
intersect$1.LineTypeFunction = function () {
  return LINE;
};
intersect$1.RayTypeFunction.typeName = "line";
intersect$1.LineSegmentTypeFunction = function () {
  return LINE_SEGMENT;
};
intersect$1.LineSegmentTypeFunction.typeName = "lineSegment";
intersect$1.CircleTypeFunction = function () {
  return CIRCLE;
};
intersect$1.CircleTypeFunction.typeName = "circle";
intersect$1.CurveTypeFunction = function () {
  return CURVE;
};
intersect$1.CurveTypeFunction.typeName = "curve";

function Rectangle$2(top, right, bottom, left) {
  this.top = top;
  this.bottom = bottom;
  this.left = left;
  this.right = right;
}

function newRectangleCorner(origin, corner) {
  return new Rectangle$2(origin[1], corner[0], corner[1], origin[0]);
}

Object.defineProperties(Rectangle$2.prototype, {
  "name": { value: "Rectangle" },
  "width": { enumerable: true, get: getWidth, set: setWidth },
  "height": { enumerable: true, get: getHeight, set: setHeight },
  "center": { get: center },
  "origin": { get: getOrigin, set: setOrigin },
  "extent": { get: getExtent, set: setExtent },
  "corner": { get: getCorner, set: setCorner },
  "boundingBox": { get: boundingBox$2 },

  "containsPoint": { value: containsPoint$1 },
  "scale": { value: scale$1 },
  "translate": { value: translate$1 },
  "expand": { value: expand },

  "draw": { value: draw$2 }
});

function getWidth() {
  return this.right - this.left;
}

function setWidth(value) {
  this.right = this.left + value;
}

function getHeight() {
  return this.bottom - this.top;
}

function setHeight(value) {
  this.bottom = this.top + value;
}

function center() {
  var center = Vector2(0, 0);
  Vector2.lerp(center, this.origin, this.corner, 0.5);
  return center;
}

function getOrigin() {
  return Vector2.fromValues(this.left, this.top);
}

function setOrigin(v) {
  this.left = v[0];
  this.top = v[1];
}

function getExtent() {
  return Vector2.fromValues(this.width, this.height);
}

function setExtent(v) {
  this.width = v[0];
  this.height = v[1];
}

function getCorner() {
  return Vector2.fromValues(this.right, this.bottom);
}

function setCorner(v) {
  this.right = v[0];
  this.bottom = v[1];
}

function boundingBox$2() {
  return this;
}

function containsPoint$1(p) {
  return this.left <= p[0] && p[0] < this.right && this.top <= p[1] && p[1] < this.bottom;
}

function scale$1(scalar) {
  return new Rectangle$2(this.top * scalar, this.right * scalar, this.bottom * scalar, this.left * scalar);
}

function translate$1(offset) {
  return new Rectangle$2(this.top + offset[1], this.right + offset[0], this.bottom + offset[1], this.left + offset[0]);
}

function expand(rectangle) {
  return new Rectangle$2(Math.min(this.top, rectangle.top), Math.max(this.right, rectangle.right), Math.max(this.bottom, rectangle.bottom), Math.min(this.left, rectangle.left));
}

function draw$2(context) {
  context.stroke(this);
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var Triangle = function () {
  function Triangle(a, b, c) {
    classCallCheck(this, Triangle);

    this.a = a;
    this.b = b;
    this.c = c;
  }

  createClass(Triangle, [{
    key: 'isColinear',
    get: function get$$1() {
      return colinear(this.a, this.b, this.c);
    }
  }, {
    key: 'center',
    get: function get$$1() {
      return center$1(this.a, this.b, this.c);
    }
  }]);
  return Triangle;
}();

function colinear(a, b, c) {
  var m = (c[0] - a[0]) * (b[1] - a[1]);
  var n = (b[0] - a[0]) * (c[1] - a[1]);
  return roughlyEqual$1(n, m);
}

function center$1(a, b, c) {
  return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
}

function LineSegment$2(start, end) {
  this.start = start;
  this.end = end;
  this.direction = Vector2.sub(Vector2(0, 0), this.end, this.start);
  this.length = Vector2.len(this.direction);
  Vector2.normalize(this.direction, this.direction);
}

function createProjection(start, direction, length) {
  var end = Vector2.scale(Vector2(0, 0), direction, length || 1);
  Vector2.add(end, start, end);
  return new LineSegment$2(start, end);
}

LineSegment$2.project = createProjection;

Object.defineProperties(LineSegment$2.prototype, {
  "name": { value: "LineSegment" },
  "type": { value: intersect$1.LineSegmentTypeFunction },
  "isRay": { value: false },
  "isLineSegment": { value: true },
  "isCurve": { value: false },
  "isCircle": { value: false },

  "midpoint": { get: midpoint },
  "boundingBox": { get: boundingBox },
  "endDirection": { get: endDirection },

  "subdivide": { value: subdivide },
  "reverse": { value: reverse },
  "scale": { value: scale },
  "translate": { value: translate },
  "offsetPerpendicular": { value: offsetPerpendicular },

  "offsetPerpendicularLength": { value: offsetPerpendicularLength },
  "mapPerpendicular": { value: mapPerpendicular },

  "containsPoint": { value: containsPoint },
  "roughlyContainsPoint": { value: roughlyContainsPoint },
  "getAlphaValueAtPosition": { value: getAlphaValueAtPosition },
  "offsetOf": { value: offsetOf },
  "closestPointTo": { value: closestPointTo },
  "positionOf": { value: positionOf },
  "directionOf": { value: directionOf },

  "vertices": { value: vertices },
  "uvs": { value: uvs },
  "draw": { value: draw }
});

function midpoint() {
  var midpoint = Vector2(0, 0);
  Vector2.lerp(midpoint, this.start, this.end, 0.5);
  return midpoint;
}

var min = Math.min;
var max = Math.max;
function boundingBox() {
  var origin = Vector2.clone(this.start);
  var corner$$1 = Vector2.clone(this.start);
  origin[0] = min(origin[0], this.end[0]);
  origin[1] = min(origin[1], this.end[1]);
  corner$$1[0] = max(corner$$1[0], this.end[0]);
  corner$$1[1] = max(corner$$1[1], this.end[1]);
  return newRectangleCorner(origin, corner$$1);
}

function endDirection() {
  return this.direction;
}

function subdivide(p) {
  return [new LineSegment$2(this.start, p), new LineSegment$2(p, this.end)];
}

function reverse() {
  return new LineSegment$2(this.end, this.start);
}

function scale(scalar) {
  var start = Vector2.clone(this.start),
      end = Vector2.clone(this.end);
  Vector2.scale(start, start, scalar);
  Vector2.scale(end, end, scalar);
  return new LineSegment$2(start, end);
}

function translate(offset) {
  var start = Vector2.clone(this.start),
      end = Vector2.clone(this.end);
  Vector2.add(start, start, offset);
  Vector2.add(end, end, offset);
  return new LineSegment$2(start, end);
}

function containsPoint(point$$1) {
  var perpendicularDirection = Vector2.perpendicular(Vector2(0, 0), direction);
  var startToPoint = Vector2.sub(Vector2(0, 0), start, p);
  var distance = Math.abs(Vector2.dot(startToPoint, perpendicularDirection));
  var u = Vector2.dot(startToPoint, this.direction);
  return distance < Intersections.THICKNESS && u > -THICKNESS && u < this.length + THICKNESS;
}

function roughlyContainsPoint(p) {
  // http://stackoverflow.com/questions/328107/how-can-you-determine-a-point-is-between-two-other-points-on-a-line-segment
  var start = this.start,
      end = this.end;
  return colinear(start, p, end) && (roughlyEqual$1(start[0], p[0]) || roughlyEqual$1(end[0], p[0]) ? roughlyBetween(start[1], p[1], end[1]) || roughlyBetween(end[1], p[1], start[1]) : roughlyBetween(start[0], p[0], end[0]) || roughlyBetween(end[0], p[0], start[0]));
}

function getAlphaValueAtPosition(p) {
  return Vector2.dist(this.start, p) / this.length;
}

function directionOf(p) {
  return this.direction;
}

function offsetOf(p) {
  return Vector2.dot(this.direction, Vector2.sub(Vector2(0, 0), p, this.start));
}

function closestPointTo(p) {
  var offset = this.offsetOf(p);

  if (offset < 0) return this.start;
  if (offset > this.length) return this.end;

  return Vector2.scaleAndAdd(Vector2(0, 0), this.start, this.direction, offset);
}

function positionOf(offset) {
  return Vector2.scaleAndAdd(Vector2(0, 0), this.start, this.direction, offset);
}

function offsetPerpendicular(offsetToRight) {
  return new LineSegment$2(Vector2.scalePerpendicularAndAdd(Vector2(0, 0), this.start, this.direction, offsetToRight), Vector2.scalePerpendicularAndAdd(Vector2(0, 0), this.end, this.direction, offsetToRight));
}

function offsetPerpendicularLength(offsetToRight) {
  return this.length;
}

function mapPerpendicular(offsetA, offsetToRightA, offsetToRightB) {
  return offsetA;
}

function vertices(offsetToRight) {
  offsetToRight = offsetToRight || 0;
  var start = offsetToRight ? Vector2.scalePerpendicularAndAdd(Vector2(0, 0), this.start, this.direction, offsetToRight) : this.start;
  var end = offsetToRight ? Vector2.scalePerpendicularAndAdd(Vector2(0, 0), this.end, this.direction, offsetToRight) : this.end;
  return [start, end];
}

function uvs(offsetToRight, multiplierAlongPath) {
  var startUV = Vector2.fromValues(0, offsetToRight);
  var endUV = Vector2.fromValues(this.length * multiplierAlongPath, offsetToRight);
  return [startUV, endUV];
}

function draw(context) {
  context.stroke(this);
}

function Ray$2(start, direction) {
  this.start = start;
  this.direction = direction;
}

Object.defineProperties(Ray$2.prototype, {
  "name": { value: "Ray" },
  "type": { value: intersect$1.RayTypeFunction },
  "isRay": { value: true },
  "isLineSegment": { value: false },
  "isCurve": { value: false },
  "isCircle": { value: false },

  "length": { value: Number.infinity },
  "end": { value: Vector2.fromValues(Number.infinity, Number.infinity) },
  "midpoint": { value: Number.infinity },

  "subdivide": { value: subdivide$1 },
  "reverse": { value: reverse$1 },
  "scale": { value: scale$2 },
  "translate": { value: translate$2 },

  "draw": { value: draw$3 },
  "boundingBox": { get: boundingBox$3 }
});

function subdivide$1(p) {
  return [new LineSegment(this.start, p), new Ray$2(p, this.direction)];
}

function reverse$1() {
  return new Ray$2(this.start, Vector2.negate(Vector2(0, 0), this.direction));
}

function scale$2(scalar) {
  var start = Vector2.clone(this.start);
  Vector2.scale(start, start, scalar);
  return new Ray$2(start, this.direction);
}

function translate$2(offset) {
  var start = Vector2.clone(this.start);
  Vector2.add(start, start, offset);
  return new Ray$2(start, this.direction);
}

function boundingBox$3() {
  return Rectangle.point(this.start);
}

function draw$3(context) {
  context.arrow(this.start, this.direction);
}

function Line$1(rayOrMiddle, direction) {
  if (rayOrMiddle.type === intersect$1.RayTypeFunction) {
    this.middle = rayOrMiddle.start;
    this.direction = rayOrMiddle.direction;
    return this;
  }
  this.middle = rayOrMiddle; // LOL!
  this.direction = direction;
}

Object.defineProperties(Line$1.prototype, {
  "name": { value: "Line" },
  "type": { value: intersect$1.LineTypeFunction },
  "isRay": { value: true },
  "isLineSegment": { value: false },
  "isCurve": { value: false },
  "isCircle": { value: false },

  "length": { value: Number.infinity },
  "start": { value: Vector2.fromValues(Number.infinity, Number.infinity) },
  "end": { value: Vector2.fromValues(Number.infinity, Number.infinity) },
  "midpoint": { value: midpoint$1 }, // ALSO LOL!
  "boundingBox": { get: boundingBox$4 }, // TROLLOLOLOL

  "subdivide": { value: subdivide$2 },
  "reverse": { value: reverse$2 },
  "scale": { value: scale$3 },
  "translate": { value: translate$3 },

  "draw": { value: draw$4 }
});

function midpoint$1() {
  return this.middle;
}

function subdivide$2(p) {
  throw "Cannot subdivide a bidirection ray";
}

function reverse$2() {
  return this;
}

function scale$3(scalar) {
  throw "Cannot scale a bidirectional ray";
}

function translate$3(offset) {
  var middle = Vector2.clone(this.middle);
  Vector2.add(middle, middle, offset);
  return new Line$1(middle, this.direction);
}

function boundingBox$4() {
  return Rectangle.point(this.middle);
}

function draw$4(context) {
  context.arrow(this.middle, this.direction, 0.5);
  context.arrow(this.middle, Vector2.scale(Vector2(0, 0), this.direction, -1), 0.5);
}

var TIME_EPSILON = 1e-8;
var max$1 = Math.max;
var infinity$3 = Infinity;
var id$3 = 0;

var SkeletonWavefront = function () {
  function SkeletonWavefront(processor, root, time) {
    classCallCheck(this, SkeletonWavefront);

    this.id = id$3++;
    this.processor = processor;
    this.root = root;
    this.time = time;

    // take ownership of edges and compute length
    var length = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = root[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var edge = _step.value;

        length++;
        edge.wavefront = this;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    this.length = length;
  }

  createClass(SkeletonWavefront, [{
    key: "initialise",
    value: function initialise() {
      // compute initial edge direction
      var edge = this.root;
      while (true) {
        edge.computeDirection();
        edge = edge.next;
        if (edge === this.root) break;
      }

      // compute initial vertex direction and speed
      while (true) {
        edge.start.computeDirectionAndSpeed();
        edge = edge.next;
        if (edge === this.root) break;
      }

      // compute initial collapse events
      while (true) {
        edge.computeCollapseEvent();
        edge = edge.next;
        if (edge === this.root) break;
      }

      // compute initial cut/split events
      while (true) {
        edge.computeSplitEvents();
        edge = edge.next;
        if (edge === this.root) break;
      }

      return this;
    }
  }, {
    key: "process",
    value: function process(maximum) {
      var events = [];
      while (true) {
        // compute events
        var nextEvents = this.nextEvents();

        // shortcut if we're done processing
        if (nextEvents.events.length === 0 || nextEvents.time > maximum) {
          this.move(maximum);
          return false;
        }

        // filter events
        for (var i = 0; i < nextEvents.events.length; i++) {
          var event = nextEvents.events[i];
          if (!event.isValid()) event.remove();else events.push(event);
        }
        if (events.length > 0) break;

        events = [];
      }

      // process events
      this.move(nextEvents.time);
      for (var _i = 0; _i < nextEvents.events.length; _i++) {
        var _event = nextEvents.events[_i];
        _event.isValid() && _event.process();
        _event.remove();
      }

      return true;
    }
  }, {
    key: "debugprocess",
    value: function debugprocess(maximum) {
      console.group("step");
      Drawing2D.log("before", this);

      var events = void 0;
      var depth = 0;
      while (true) {
        depth++;
        if (depth == 100) debugger;

        // compute events
        var nextEvents = this.nextEvents();

        // shortcut if we're done processing
        if (nextEvents.events.length === 0 || nextEvents.time > maximum) {
          this.move(maximum);
          Drawing2D.log("after move", this);
          console.groupEnd("step");
          return false;
        }

        // filter events
        events = [];
        for (var i = 0; i < nextEvents.events.length; i++) {
          var event = nextEvents.events[i];
          if (!event.isValid()) {
            console.log("removing", event.description());
            event.remove();
          } else events.push(event);
        }
        if (events.length > 0) break;
      }

      // process events
      this.move(nextEvents.time);
      Drawing2D.log("after move", this);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = events[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _event2 = _step2.value;

          if (_event2.isValid()) {
            console.log(_event2.description());
            _event2.process();
            this.processor.wavefronts.length > 0 && Drawing2D.log("after event", this.processor.wavefronts.concat([{ colour: "#F0F", visuals: this.processor.spokes }]));
          } else {
            console.log("late removal of", _event2.description());
          }
          _event2.remove();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      console.groupEnd("step");
      return true;
    }
  }, {
    key: "remove",
    value: function remove() {
      this.length = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.root[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var edge = _step3.value;

          edge.wavefront = null;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      this.root = null;
      this.processor.removeWavefront(this);
    }
  }, {
    key: "nextEvents",
    value: function nextEvents() {
      var events = [],
          time = infinity$3,
          maxtime = -infinity$3;

      var wavefront = this;
      function testEvent(event) {
        var eventTime = event.time;
        if (eventTime < wavefront.time) throw "Time machine?";
        if (eventTime < time) {
          //console.log("testing", event.description(), "<", time);
          var old = events;
          events = [event];
          maxtime = time = eventTime;
          for (var i = 0; i < old.length; i++) {
            testEvent(old[i]);
          }
        } else if (eventTime < infinity$3 && roughlyEqual$1(eventTime, time, TIME_EPSILON)) {
          //console.log("testing", event.description(), "<", "~" + time);
          events.push(event);
          maxtime = max$1(maxtime, eventTime);
        } else {
          //console.log("testing", event.description(), "skipped");
          return false;
        }
        return true;
      }

      var edge = this.root;
      while (true) {
        testEvent(edge.collapseEvent);
        var vertexEvents = edge.start.events;
        for (var i = 0; i < vertexEvents.length; i++) {
          testEvent(vertexEvents[i]);
        }edge = edge.next;
        if (edge === this.root) break;
      }

      if (time === infinity$3) maxtime = infinity$3;

      events.sort(function (a, b) {
        return b - a;
      });
      return { "time": maxtime, "events": events };
    }
  }, {
    key: "move",
    value: function move(time) {
      var delta = time - this.time;
      var edge = this.root;
      while (true) {
        edge.start.move(delta);
        edge = edge.next;
        if (edge === this.root) break;
      }
      this.time = time;
    }
  }, {
    key: "toPath",
    value: function toPath() {
      var pather = new Pather();
      pather.moveTo(vec2.clone(this.root.start.position));
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.root[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var edge = _step4.value;

          pather.lineTo(vec2.clone(edge.end.position));
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      return pather.path;
    }
  }, {
    key: "draw",
    value: function draw(context) {
      if (!this.root) return;
      var dimmer = context.clone();
      dimmer.alpha = 0.2;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.root[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var edge = _step5.value;

          edge.draw(context);
          //LineSegment.project(edge.start.position, edge.start.direction, edge.start.speed / 10).draw(dimmer);
          new Ray(edge.segment.midpoint, edge.direction).draw(dimmer);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }]);
  return SkeletonWavefront;
}();

var id$2 = 0;
var infinity$2 = Infinity;
var SkeletonSplitEvent = function () {
  function SkeletonSplitEvent(edge, vertex) {
    classCallCheck(this, SkeletonSplitEvent);

    this.id = id$2++;
    this.edge = edge;
    this.vertex = vertex;

    //    if (this.edge.isSelfIntersectionCap)
    //      return this.time = infinity;

    var intersections = intersect$1(vertex.projection, edge.line);
    if (intersections.length == 0) return this.time = infinity$2;

    // Find the bisector(s)
    var projectionToEdgePosition = intersections[0].p;
    intersections = intersect$1(edge.line, vertex.previousEdge.line);
    if (intersections.length == 0) {
      // the two edges are parallel to each other, find the midpoint between them for the bisector
      var midpoint = Vector2.lerp(Vector2(0, 0), edge.start.position, vertex.previousEdge.start.position, 0.5);
      var bisector = new Line$1(midpoint, vertex.previousEdge.lineDirection);
    } else {
      var edgeToEdgePosition = intersections[0].p,
          dir1 = Vector2.sub(Vector2(0, 0), vertex.position, edgeToEdgePosition),
          dir2 = Vector2.sub(Vector2(0, 0), projectionToEdgePosition, edgeToEdgePosition);

      Vector2.normalize(dir1, dir1);
      Vector2.normalize(dir2, dir2);
      var direction = Vector2.add(Vector2(0, 0), dir1, dir2);
      Vector2.normalize(direction, direction);
      var bisector = new Ray$2(edgeToEdgePosition, direction);
    }

    // Find the point of split
    intersections = intersect$1(vertex.projection, bisector);
    if (intersections.length === 0) return this.time = infinity$2;

    // How far from the vertex to the bisector
    var length = edge.lengthAt(intersections[0].p);
    if (length < 0 || length === infinity$2) return this.time = infinity$2;

    this.time = length + this.edge.wavefront.time;
    //Drawing2D.log("created " + this.description(), [this.edge.wavefront, this, {colour: "pink", legend: "bisector", visuals: [bisector]}]);
  }

  createClass(SkeletonSplitEvent, [{
    key: 'name',
    value: function name() {
      if (!this.edge.wavefront || this.edge.wavefront != this.vertex.wavefront) return "Split(dead)";
      var projected = this.edge.projectBy(this.time - this.edge.wavefront.time),
          position = this.vertex.projectBy(this.time - this.edge.wavefront.time);
      var distance1 = Vector2.dist(this.edge.start.position, this.vertex.position),
          distance2 = Vector2.dist(this.edge.end.position, this.vertex.position);
      if (roughlyEqual$1(distance1, 0)) return "Cut.start";
      if (roughlyEqual$1(distance2, 0)) return "Cut.end";else return "Split";
    }
  }, {
    key: 'isValid',
    value: function isValid() {
      // The event must be on an existing wavefront and both the edge and vertex must also be on the same wavefront
      if (!this.edge.wavefront || this.edge.wavefront != this.vertex.wavefront) return false;

      // No events are allowed to happen immediately, that would require a self-intersecting source shape and that is not allowed for this algorithm. The only other way this can happen is with an open-path and no events should happen at instance-zero then either
      if (this.time === 0) return false;

      // No split or cut can happen with < 4 edges
      if (this.edge.wavefront.length < 4) return false;

      // Is the vertex still acute?
      if (this.vertex.isAcute) return false;

      // Is the event time infinite?
      if (this.time === infinity$2) return false;

      // Is the event actually happening?
      var futureEdge = this.edge.projectBy(this.time - this.edge.wavefront.time),
          futureVertex = this.vertex.projectBy(this.time - this.edge.wavefront.time);
      return futureEdge.roughlyContainsPoint(futureVertex);
    }
  }, {
    key: 'remove',
    value: function remove() {
      var _this = this;
      this.vertex.events = this.vertex.events.filter(function (ele) {
        return ele !== _this;
      });
      // this.vertex.events = this.vertex.events.without(this);
    }
  }, {
    key: 'description',
    value: function description() {
      return this.name() + ':' + this.id + ' edge ' + this.edge.id + ' from between ' + this.vertex.previousEdge.id + ' and ' + this.vertex.nextEdge.id + ' at ' + this.time;
    }
  }, {
    key: 'process',
    value: function process() {
      var distance1 = Vector2.dist(this.edge.start.position, this.vertex.position);
      if (roughlyEqual$1(distance1, 0)) return cut(this.edge.start, this.vertex);

      var distance2 = Vector2.dist(this.edge.end.position, this.vertex.position);
      if (roughlyEqual$1(distance2, 0)) return cut(this.edge.end, this.vertex);

      // The vertex.position was roughly contained within the edge, but not close
      // enough to have a roughly close distance to either end and when we test
      // if it's really contained and it is not, then it must still be treated as
      // a cut
      if (!this.edge.segment.boundingBox.containsPoint(this.vertex.position)) return distance1 < distance2 ? cut(this.edge.start, this.vertex) : cut(this.edge.end, this.vertex);

      return split(this.edge, this.vertex);
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      context.style = "#F00";
      context.legend("this.edge");
      this.edge.draw(context);

      context.style = "#F66";
      context.legend("this.edge - future");
      this.edge.projectBy(this.time - this.edge.wavefront.time).draw(context);

      context.style = "#00F";
      context.legend("this.vertex");
      this.vertex.previousEdge.draw(context);
      this.vertex.nextEdge.draw(context);

      context.style = "#66F";
      context.legend("this.vertex - future");
      this.vertex.previousEdge.projectBy(this.time - this.edge.wavefront.time).draw(context);
      this.vertex.nextEdge.projectBy(this.time - this.edge.wavefront.time).draw(context);

      context.style = "rgba(0, 0, 255, 0.25)";
      context.legend("this.vertex - projection");
      this.vertex.projection.draw(context);

      context.style = "#300";
      context.legend("intersection");
      context.dot(this.vertex.projectBy(this.time - this.edge.wavefront.time));
    }
  }]);
  return SkeletonSplitEvent;
}();

function join(previous, next, length) {
  // find the point at which these two edges connect and 'extend' or 'contract' the edges until they meet to preserve the direction of both edges
  var intersections = intersect$1(previous.line, next.line),
      moved = intersections.length > 0;
  if (moved) {
    next.start.position = intersections[0].p;
    next.wavefront.processor.commitSkeletonVertex(next.start);
  }

  // connect the edges
  connect([previous, next]);

  // did we twist an edge trying to do this, if so, try again skipping the twisted edge
  if (moved) {
    var twist1 = intersect$1(previous.previous.segment, next.segment);
    if (twist1.length > 0 && !twist1[0].isDegenerate) return join(previous.previous, next, length + 1);
    var twist2 = intersect$1(previous.segment, next.next.segment);
    if (twist2.length > 0 && !twist2[0].isDegenerate) return join(previous, next.next, length + 1);
  }

  // compute direction and speed
  next.start.computeDirectionAndSpeed();

  // compute collapse events
  previous.computeCollapseEvent();
  next.computeCollapseEvent();

  // compute split events
  next.start.computeSplitEvents();

  return [previous, next, length];
}

function cut(edgeVertex, cutVertex) {
  if (edgeVertex === cutVertex) return false;

  edgeVertex.wavefront.processor.commitSkeletonVertex(edgeVertex);
  cutVertex.wavefront.processor.commitSkeletonVertex(cutVertex);

  var wavefront0 = edgeVertex.wavefront,
      wavefront1 = null,
      previous0 = edgeVertex.previousEdge,
      previous1 = cutVertex.previousEdge,
      next0 = cutVertex.nextEdge,
      next1 = edgeVertex.nextEdge,
      length0 = 0,
      length1 = 0;

  var _join = join(previous0, next0, length0);

  var _join2 = slicedToArray(_join, 3);

  previous0 = _join2[0];
  next0 = _join2[1];
  length0 = _join2[2];

  // create the new wavefront
  var _join3 = join(previous1, next1, length1);

  var _join4 = slicedToArray(_join3, 3);

  previous1 = _join4[0];
  next1 = _join4[1];
  length1 = _join4[2];
  wavefront0.root = previous0;
  wavefront1 = new SkeletonWavefront(wavefront0.processor, previous1, wavefront0.time);
  wavefront0.length -= wavefront1.length + length0 + length1;

  //SkeletonEdge.isBroken(previous0);
  //SkeletonEdge.isBroken(previous1);

  // it's possible at this point that one of the two wavefronts
  // has < 3 vertices. If that's the case, we might as well
  // delete it now and add its spokes, otherwise make sure the
  // two wavefronts exist in the processor
  function endit(wavefront) {
    wavefront.processor.commitSkeletonVertex(wavefront.root.start);
    wavefront.processor.commitSkeletonVertex(wavefront.root.end);
    wavefront.processor.commitSkeletonSpoke(Vector3(wavefront.root.start.position[0], wavefront.root.start.position[1], wavefront.time), Vector3(wavefront.root.end.position[0], wavefront.root.end.position[1], wavefront.time));
  }
  if (wavefront0.length < 3) {
    endit(wavefront0);
    wavefront0.remove();
  } else {
    // wavefront[0] already exists in the processor
  }
  if (wavefront1.length < 3) {
    endit(wavefront1);
    wavefront1.root.next.wavefront = null;
    wavefront1.root.wavefront = null;
  } else {
    wavefront1.processor.addWavefront(wavefront1);
  }
  return true;
}

function split(edge, vertex) {
  var pair = edge.split(vertex.position);

  // compute direction and speed
  pair[1].start.computeDirectionAndSpeed();

  // compute collapse events
  // SKIPPED: cut will do it

  // compute split events for the two halves
  // pair[1].start is not acute and we do not have to compute its split events
  pair[0].computeSplitEvents();
  pair[1].computeSplitEvents();

  return cut(pair[1].start, vertex);
}

var id$1 = 0;

var SkeletonVertex = function () {
  function SkeletonVertex(position, nextEdge) {
    classCallCheck(this, SkeletonVertex);

    if (!isFinite(position[0]) || !isFinite(position[1])) throw "Bad vertex";

    this.id = id$1++;
    this.position = Vector2.clone(position);
    this.beginning = Vector3(position[0], position[1], 0);
    this.nextEdge = nextEdge;

    this.events = [];
    this.isParallel = null;
    this.isAcute = null;
    this.direction = null;
    this.projection = null;
    this.speed = null;
  }

  createClass(SkeletonVertex, [{
    key: 'computeDirectionAndSpeed',
    value: function computeDirectionAndSpeed() {
      // if direction and speed change, any split/cut events for this vertex
      // are now invalid
      this.events = [];

      var position = this.position;
      var nextEdge = this.nextEdge;
      var previousEdge = this.previousEdge;
      var orientation = Vector2.crossz(previousEdge.direction, nextEdge.direction);
      var isParallel = this.isParallel = roughlyEqual$1(Vector2.crossz(previousEdge.direction, nextEdge.direction), 0);
      this.isAcute = isParallel || orientation > 0;

      // direction & projection
      var direction = this.direction = Vector2.add(Vector2(0, 0), previousEdge.direction, nextEdge.direction);
      Vector2.normalize(direction, direction);
      this.projection = new Ray$2(position, direction);

      // speed
      if (isParallel) return this.speed = 1;
      var previousLine = new Line$1(Vector2.add(Vector2(0, 0), position, previousEdge.lineDirection), previousEdge.direction),
          nextLine = new Line$1(Vector2.add(Vector2(0, 0), position, nextEdge.lineDirection), nextEdge.direction),
          intersections = intersect$1(previousLine, nextLine);

      if (intersections.length === 0) return this.speed = 0;

      this.speed = Vector2.dist(position, intersections[0].p);
    }
  }, {
    key: 'computeSplitEvents',
    value: function computeSplitEvents() {
      this.events = [];
      if (this.isAcute) return;

      var start = this.nextEdge.next.next,
          end = this.previousEdge;
      while (true) {
        if (start === end) break;
        this.events.push(new SkeletonSplitEvent(start, this));
        start = start.next;
      }
    }
  }, {
    key: 'movementBy',
    value: function movementBy(amount) {
      return Vector2.scale(Vector2(0, 0), this.direction, this.speed * amount);
    }
  }, {
    key: 'projectBy',
    value: function projectBy(amount) {
      return Vector2.add(Vector2(0, 0), this.position, this.movementBy(amount));
    }
  }, {
    key: 'move',
    value: function move(amount) {
      Vector2.add(this.position, this.position, this.movementBy(amount));
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      context.dot(this.position);

      context.style = "#AAF";
      this.projection && this.projection.draw(context);
    }
  }, {
    key: 'name',
    get: function get$$1() {
      return "SkeletonVertex";
    }
  }, {
    key: 'wavefront',
    get: function get$$1() {
      return this.nextEdge.wavefront;
    }
  }, {
    key: 'previousEdge',
    get: function get$$1() {
      return this.nextEdge.previous;
    }
  }, {
    key: 'next',
    get: function get$$1() {
      return this.nextEdge.end;
    }
  }, {
    key: 'previous',
    get: function get$$1() {
      return this.previousEdge.start;
    }
  }]);
  return SkeletonVertex;
}();

var id$4 = 0;
var infinity$4 = Infinity;

var SkeletonCollapseEvent = function () {
  function SkeletonCollapseEvent(edge) {
    classCallCheck(this, SkeletonCollapseEvent);

    this.id = id$4++;
    this.edge = edge;

    var wavefront = edge.wavefront,
        intersections = intersect$1(edge.start.projection, edge.end.projection);

    if (intersections.length === 0) return this.time = infinity$4;

    this.position = intersections[0].p;
    this.time = edge.lengthAt(this.position) + wavefront.time;

    //if (this.time === 0)
    //  return this.time = infinity;
  }

  createClass(SkeletonCollapseEvent, [{
    key: 'name',
    value: function name() {
      if (!this.edge.wavefront || this.edge.wavefront.length < 3) return "SkeletonCollapseEvent(dead)";
      return this.edge.wavefront.length === 3 ? "Triangle" : "Collapse";
    }
  }, {
    key: 'isValid',
    value: function isValid() {
      if (!this.edge.wavefront) return false;

      // No events are allowed to happen immediately, that would require a self-intersecting source shape and that is not allowed for this algorithm. The only other way this can happen is with an open-path and no events should happen at instance-zero then either
      if (this.time === 0) return false;

      switch (this.edge.wavefront.length) {
        case 0:
        case 1:
        case 2:
          return false;
        case 3:
          return true;
        default:
          {
            // an edge cannot collapse if either of its projections are parallel to the edge
            var az = Vector2.crossz(this.edge.lineDirection, this.edge.start.direction);
            var bz = Vector2.crossz(this.edge.lineDirection, this.edge.end.direction);
            return !roughlyEqual$1(az, 0) && !roughlyEqual$1(bz, 0);
          }
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      this.time = infinity$4;
    }
  }, {
    key: 'description',
    value: function description() {
      return this.name() + ':' + this.id + ' edge ' + this.edge.id + ' at ' + this.time;
    }
  }, {
    key: 'process',
    value: function process() {
      var wavefront = this.edge.wavefront;
      wavefront.processor.commitSkeletonVertex(this.edge.start);
      wavefront.processor.commitSkeletonVertex(this.edge.end);

      if (wavefront.length === 3) {
        var position = this.time === infinity$4 ? this.edge.start.position : this.position;

        // commit the third vertex of the triangle
        wavefront.processor.commitSkeletonVertex(this.edge.next.end);

        // we know that -one- of the sides of the triangle has collapsed, but it's possible
        // the other two have not, they might now be parallel lines that overlap.
        // If that is the case, find one of the uncollapsed sides and connect it to the
        // triangle center
        var a = this.edge.start.position,
            b = this.edge.end.position,
            c = this.edge.next.end.position,
            center$$1 = center$1(a, b, c);

        var start = a,
            end = b;
        if (roughlyEqualVec2(a, b)) {
          if (roughlyEqualVec2(b, c)) {
            start = c;
            end = a;
          } else {
            start = b;
            end = c;
          }
        }

        center$$1 = Vector3(center$$1[0], center$$1[1], wavefront.time);
        start = Vector3(start[0], start[1], wavefront.time);
        end = Vector3(end[0], end[1], wavefront.time);
        wavefront.processor.commitSkeletonSpoke(start, center$$1);
        wavefront.processor.commitSkeletonSpoke(center$$1, end);

        wavefront.remove();
        return true;
      }

      var previous = this.edge.previous,
          next = this.edge.next;

      // collapse this.edge
      this.edge.collapse();

      // compute the direction and speed for the newly connected vertex
      next.start.computeDirectionAndSpeed();

      // compute the collapse events for the neighbours
      previous.computeCollapseEvent();
      next.computeCollapseEvent();

      // compute the split events for the connected vertex which may now be obtuse
      next.start.computeSplitEvents();

      return true;
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      if (this.wavefront.length === 3) {
        context.dot(this.position);
        return this.wavefront.draw(context);
      }

      this.edge.draw(context);
      context.dot(this.position);

      context.alpha = 0.25;

      this.edge.start.projection.draw(context);
      this.edge.end.projection.draw(context);
    }
  }]);
  return SkeletonCollapseEvent;
}();

var lastElementId = 0;

var Chain = function () {
  function Chain() {
    classCallCheck(this, Chain);

    this.previous = this;
    this.next = this;
    this.id = lastElementId;
    lastElementId++;
  }

  createClass(Chain, [{
    key: "length",
    value: function length() {
      var length = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var each = _step.value;
          length++;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return length;
    }
  }, {
    key: "isSingleElement",
    value: function isSingleElement() {
      return this.next === this && this.previous === this;
    }
  }, {
    key: Symbol.iterator,
    value: /*#__PURE__*/regeneratorRuntime.mark(function value() {
      var current;
      return regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              current = this;

            case 1:
              _context.next = 3;
              return current;

            case 3:
              current = current.next;

            case 4:
              if (current !== this) {
                _context.next = 1;
                break;
              }

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, value, this);
    })
  }], [{
    key: "connect",
    value: function connect(previous, next) {
      previous.next = next;
      next.previous = previous;
    }
  }, {
    key: "disconnect",
    value: function disconnect(node) {
      this.previous = this;
      this.next = this;
    }
  }]);
  return Chain;
}();

var infinity$1 = Infinity;
var InnerEdge = Symbol("InnerEdge");
var OuterEdge = Symbol("OuterEdge");
var StartCapEdge = Symbol("StartCapEdge");
var EndCapEdge = Symbol("EndCapEdge");

function create(path, isInfinite) {
  // console.log('isclosed', path.isClosed);
  return path.isClosed ? createClosedPath(path, isInfinite) : createOpenPath(path, isInfinite);
}

function createClosedPath(path, isInfinite) {
  var segments = path.segments,
      first = new SkeletonEdge(segments[0].start, InnerEdge),
      previous = first;
  for (var i = 1; i < segments.length; i++) {
    var next = new SkeletonEdge(segments[i].start, InnerEdge);
    connect([previous, next]);
    previous = next;
  }
  connect([previous, first]);
  //Chain.isBroken(first);

  if (isInfinite) return [first];

  var second = new SkeletonEdge(segments[segments.length - 1].end, OuterEdge);
  previous = second;
  for (var _i = segments.length - 2; _i >= 0; _i--) {
    var _next = new SkeletonEdge(segments[_i].end, OuterEdge);
    connect([previous, _next]);
    previous = _next;
  }
  connect([previous, second]);
  //Chain.isBroken(second);

  return [first, second];
}

function createOpenPath(path, isInfinite) {
  if (isInfinite) throw "Cannot propagate an open path wavefront infinitely";

  var segments = path.segments,
      edges = new Array(segments.length * 2 + 2),
      i = 0;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = segments.slice().reverse()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var segment = _step.value;

      edges[i++] = new SkeletonEdge(segment.end, OuterEdge);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  edges[i++] = new SkeletonEdge(segments[0].start, StartCapEdge);

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = segments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _segment = _step2.value;

      edges[i++] = new SkeletonEdge(_segment.start, InnerEdge);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  edges[i] = new SkeletonEdge(segments[segments.length - 1].end, EndCapEdge);

  connect(edges);
  connect([edges[edges.length - 1], edges[0]]);
  //Chain.isBroken(edges[0]);

  return [edges[0]];
}

function connect(edges) {
  if (edges.length < 2) throw "Need at least two edges to connect";

  // connect the list of edges
  var previous = edges[0];
  for (var i = 1; i < edges.length; i++) {
    var next = edges[i];
    Chain.connect(previous, next);
    previous = next;
  }
}



var id = 0;

var SkeletonEdge = function () {
  function SkeletonEdge(start, side) {
    classCallCheck(this, SkeletonEdge);

    this.id = id++;
    this.side = side;
    this.start = new SkeletonVertex(start, this);
    this.wavefront = null;
    this.next = this;
    this.previous = this;
    this.isCap = this.side === StartCapEdge || this.side === EndCapEdge;

    this.direction = null;
    this.lineDirection = null;
    this.collapseEvent = null;
  }

  createClass(SkeletonEdge, [{
    key: 'computeDirection',
    value: function computeDirection() {
      var startPosition = this.start.position,
          endPosition = this.end.position;

      if (this.isCap && startPosition[0] == endPosition[0] && startPosition[1] == endPosition[1]) {
        var previousDirection = this.previous.direction;
        this.direction = Vector2(previousDirection[1], -previousDirection[0]);
        this.lineDirection = Vector2.clone(previousDirection);
        return;
      }

      this.lineDirection = Vector2.sub(Vector2(0, 0), endPosition, startPosition);
      Vector2.normalize(this.lineDirection, this.lineDirection);
      this.direction = Vector2(-this.lineDirection[1], this.lineDirection[0]);
    }
  }, {
    key: 'checkSanity',
    value: function checkSanity() {
      var sane = false;
      var ray = new Ray$2(this.segment.midpoint, this.direction);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.next[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var edge = _step4.value;

          if (edge !== this) {
            if (intersect$1(edge.segment, ray).length > 0) {
              sane = true;
              break;
            }
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      if (!sane) throw "Hangon...";
    }
  }, {
    key: 'checkOverlap',
    value: function checkOverlap() {
      if (roughlyEqual(this.segment.length, 0)) return;
      intersect$1(this.previous.segment, this.next.segment).length > 0 && thisshouldnotbehappening();
    }
  }, {
    key: 'computeCollapseEvent',
    value: function computeCollapseEvent() {
      this.collapseEvent = new SkeletonCollapseEvent(this);
    }
  }, {
    key: 'computeSplitEvents',
    value: function computeSplitEvents() {
      var edge = this.next.next.next,
          end = this.previous;

      while (true) {
        if (edge === end) break;
        var vertex = edge.start;
        vertex.isAcute || vertex.events.push(new SkeletonSplitEvent(this, vertex));
        edge = edge.next;
      }
    }
  }, {
    key: Symbol.iterator,
    value: /*#__PURE__*/regeneratorRuntime.mark(function value() {
      var current;
      return regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              current = this;

            case 1:
              

              _context.next = 4;
              return current;

            case 4:
              current = current.next;

              if (!(current === this)) {
                _context.next = 7;
                break;
              }

              return _context.abrupt('break', 9);

            case 7:
              _context.next = 1;
              break;

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, value, this);
    })

    // At a position p, assuming p is between start.projection and end.projection
    // return how long it will be before the edge reaches p

  }, {
    key: 'lengthAt',
    value: function lengthAt(p) {
      var measuring = Vector2(-this.direction[0], -this.direction[1]);
      var intersections = intersect$1(new Ray$2(p, measuring), this.line);

      // If the point is behind the moving wavefront, return an infinite length
      return intersections.length === 0 ? infinity$1 : intersections[0].u;
    }
  }, {
    key: 'projectBy',
    value: function projectBy(amount) {
      return new LineSegment$2(this.start.projectBy(amount), this.end.projectBy(amount));
    }
  }, {
    key: 'collapse',
    value: function collapse() {
      // if we're the root edge, cycle to another edge
      if (this.wavefront.root === this) this.wavefront.root = this.next;

      var previous = this.previous,
          next = this.next;

      connect([previous, next]);
      this.wavefront.length--;
      //isBroken(previous);

      // delete the edge and therefore any split/cut events for this edge
      this.wavefront = null;
    }
  }, {
    key: 'split',
    value: function split(position) {
      // if we're the root edge, cycle to another edge
      if (this.wavefront.root === this) this.wavefront.root = this.next;

      var previous = this.previous,
          middle1 = new SkeletonEdge(this.start.position, previous.side),
          middle2 = new SkeletonEdge(position, previous.side),
          next = this.next;

      // keep the current start
      middle1.start = this.start;
      middle1.start.nextEdge = middle1;

      // Copy the properties
      middle1.wavefront = this.wavefront;
      middle2.wavefront = this.wavefront;
      middle1.direction = Vector2.clone(this.direction);
      middle2.direction = Vector2.clone(this.direction);
      middle1.lineDirection = Vector2.clone(this.lineDirection);
      middle2.lineDirection = Vector2.clone(this.lineDirection);


      // Quick set the new vertex
      middle2.start.isAcute = false;
      middle2.start.isParallel = true;
      middle2.start.speed = 1;
      middle2.start.direction = Vector2.clone(this.direction);
      middle2.start.projection = new Ray$2(middle2.start.position, middle2.start.direction);

      connect([previous, middle1, middle2, next]);
      this.wavefront.length++;
      //isBroken(previous);

      // delete the edge and therefore any split/cut events for this edge
      this.wavefront = null;

      return [middle1, middle2];
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      if (!this.wavefront) return;
      if (this.cutreverse) {
        context.stroke(new LineSegment$2(this.segment.start, this.cutsegment.end));
        context.stroke(new LineSegment$2(this.cutsegment.start, this.segment.end));
      } else {
        context.stroke(this.cutsegment || this.segment);
        //context.arrowhead(this.segment.end, this.lineDirection);
      }
      context.dot(this.start.position);
      context.fontsize = 13;
      context.textBaseline = "center";
      context.textAlign = "center";
      context.text(this.id, this.segment.midpoint);
    }
  }, {
    key: 'name',
    get: function get$$1() {
      return "SkeletonEdge";
    }
  }, {
    key: 'end',
    get: function get$$1() {
      return this.next.start;
    }
  }, {
    key: 'segment',
    get: function get$$1() {
      return new LineSegment$2(this.start.position, this.end.position);
    }
  }, {
    key: 'line',
    get: function get$$1() {
      return new Line$1(this.start.position, this.lineDirection);
    }
  }]);
  return SkeletonEdge;
}();

function Curve(start, direction, end) {
  this.start = start;
  this.end = end;
  this.direction = Vector2.clone(direction);
  Vector2.normalize(this.direction, this.direction);

  // using the chord vector start-end, find the orientation against direction
  // -1 is counter-clockwise, 1 is clockwise, 0 is either a line or
  // an invalid curve
  var vChord = Vector2(0, 0);
  Vector2.sub(vChord, this.start, this.end);
  this.orientation = sign(Vector2.crossz(this.direction, vChord));

  // an estimate of the curve length, used for computing u,v intersection values
  // and for path finding estimates
  var chordLength = Vector2.len(vChord);

  // Check if this is a line
  if (this.orientation === 0) {
    // Determine if the direction faces the same way as the chord,
    // if it doesn't then this is an infinite circle, not a line
    Vector2.normalize(vChord, vChord);
    var diff = Vector2.add(Vector2(0, 0), vChord, this.direction);
    if (!roughlyEqualVec2(diff, [0, 0])) throw "Not a valid curve, infinite circle found";

    //this.length = chordLength;
    //this.__proto__ = LineSegment.constructor.prototype;
    //return;
    return new LineSegment$2(start, end);
  }

  this.chordLength = chordLength;

  // compute the rays for intersection
  var rayStartToCenter = this.rayFromStartToCenter(),
      rayHalfChordToCenter = this.rayFromHalfChordToCenter();

  // the center of the circle is at the intersection of the two rays
  // but if none exist, then it's not a real circle
  var i = intersect$1(rayStartToCenter, rayHalfChordToCenter);

  // check the opposite direction in case we're >180º
  if (i.length !== 1) {
    i = intersect$1(rayStartToCenter, rayHalfChordToCenter.reverse());
  }

  if (i.length !== 1) throw "Not a valid curve, no circle found";

  this.center = i[0].p;
  this.radius = Vector2.dist(this.center, this.start);

  var angleSpan = 2 * Vector2.angleBetween(rayStartToCenter.direction, rayHalfChordToCenter.direction);
  this.length = this.radius * angleSpan;
}

Curve.createIfValid = createIfValid;

function createIfValid(start, direction, end) {
  try {
    return new Curve(start, direction, end);
  } catch (e) {
    return undefined;
  }
}

Object.defineProperties(Curve.prototype, {
  "name": { value: "Curve" },
  "type": { value: intersect$1.CurveTypeFunction },
  "isRay": { value: false },
  "isLineSegment": { value: false },
  "isCurve": { value: true },
  "isCircle": { value: false },

  "midpoint": { get: midpoint$2 },
  "boundingBox": { get: boundingBox$5 },
  "endDirection": { get: endDirection$1 },

  "rayFromStartToCenter": { value: rayFromStartToCenter },
  "rayFromHalfChordToCenter": { value: rayFromHalfChordToCenter },

  "subdivide": { value: subdivide$3 },
  "reverse": { value: reverse$3 },
  "translate": { value: translate$5 },
  "scale": { value: scale$5 },
  "offsetPerpendicular": { value: offsetPerpendicular$1 },

  "offsetPerpendicularLength": { value: offsetPerpendicularLength$1 },
  "mapPerpendicular": { value: mapPerpendicular$1 },

  "positionOf": { value: positionOf$1 },
  "closestPointTo": { value: closestPointTo$1 },
  "offsetOf": { value: offsetOf$1 },
  "directionOf": { value: directionOf$1 },
  "containsPoint": { value: containsPoint$2 },
  "wedgeContainsPoint": { value: wedgeContainsPoint },
  "getAlphaValueAtPosition": { value: getAlphaValueAtPosition$1 },

  "vertices": { value: vertices$1 },
  "uvs": { value: uvs$1 },
  "draw": { value: draw$5 }
});

function midpoint$2() {
  var direction = this.rayFromHalfChordToCenter().direction;
  Vector2.normalize(direction, direction);
  Vector2.scale(direction, direction, -this.radius);
  Vector2.add(direction, this.center, direction);
  return direction;
}

function boundingBox$5() {
  var origin = Vector2.clone(this.start),
      corner$$1 = Vector2.clone(this.end),
      midpoint = this.midpoint,
      left = Math.min(this.start[0], this.end[0]),
      left = Math.min(left, midpoint[0]),
      right = Math.max(this.start[0], this.end[0]),
      right = Math.max(right, midpoint[0]),
      top = Math.min(this.start[1], this.end[1]),
      top = Math.min(top, midpoint[1]),
      bottom = Math.max(this.start[1], this.end[1]),
      bottom = Math.max(bottom, midpoint[1]);

  return new Rectangle$2(top, right, bottom, left);
}

function rayFromStartToCenter() {
  var vStartToCenter = Vector2.fromValues(this.direction[1], -this.direction[0]);
  this.orientation === -1 && Vector2.negate(vStartToCenter, vStartToCenter);
  return new Ray$2(this.start, vStartToCenter);
}

function rayFromHalfChordToCenter() {
  var pHalfChord = Vector2(0, 0),
      vHalfChord = Vector2(0, 0);
  Vector2.lerp(pHalfChord, this.start, this.end, 0.5);
  Vector2.sub(vHalfChord, pHalfChord, this.start);

  var vHalfChordToCenter = Vector2.fromValues(vHalfChord[1], -vHalfChord[0]);
  Vector2.normalize(vHalfChordToCenter, vHalfChordToCenter);
  this.orientation === -1 && Vector2.negate(vHalfChordToCenter, vHalfChordToCenter);
  return new Ray$2(pHalfChord, vHalfChordToCenter);
}

function subdivide$3(p) {
  var head = new Curve(this.start, this.direction, p);
  var tail = new Curve(p, this.directionOf(this.offsetOf(p)), this.end);
  return [head, tail];
}

function reverse$3() {
  return new Curve(this.end, Vector2.negate(Vector2(0, 0), this.endDirection), this.start);
}

function scale$5(scalar) {
  var start = Vector2.clone(this.start),
      end = Vector2.clone(this.end);
  Vector2.scale(start, start, scalar);
  Vector2.scale(end, end, scalar);
  return new Curve(start, this.direction, end);
}

function translate$5(offset) {
  var start = Vector2.clone(this.start),
      end = Vector2.clone(this.end);
  Vector2.add(start, start, offset);
  Vector2.add(end, end, offset);
  return new Curve(start, this.direction, end);
}

function directionOf$1(offset) {
  var rotationSign = -this.orientation;
  var centerToStart = Vector2.sub(Vector2(0, 0), this.start, this.center);
  var centerToPoint = Vector2.rotate(Vector2(0, 0), centerToStart, rotationSign * offset / this.radius);

  var direction = this.orientation > 0 ? Vector2.fromValues(centerToPoint[1], -centerToPoint[0]) : Vector2.fromValues(-centerToPoint[1], centerToPoint[0]);

  Vector2.normalize(direction, direction);

  return direction;
}

function endDirection$1() {
  var vEnd = Vector2(0, 0);
  Vector2.sub(vEnd, this.center, this.end);
  var direction = this.orientation > 0 ? Vector2.fromValues(-vEnd[1], vEnd[0]) : Vector2.fromValues(vEnd[1], -vEnd[0]);
  return Vector2.normalize(direction, direction);
}

function containsPoint$2(p) {
  var distance = Vector2.squaredDistance(this.center, p);
  return distance <= this.radius * this.radius + Intersections.THICKNESS * Intersections.THICKNESS && this.wedgeContainsPoint(p, Intersections.THICKNESS);
}

function wedgeContainsPoint(p, tolerance) {
  // The point (p) must lye between start and end vectors
  // let start = 0, 0
  // let end = this.end - this.start
  // let test = p - this.start
  // let dir = this.direction
  // sign0 = sign(dir x end)
  //   sign0 == 0 error: all points are either inside or outside and it's impossile to tell
  // sign1 = sign(dir x test) <
  // sign2 = sign(test x end)
  // contained if:
  //    sign1 == 0 || sign2 == 0
  //    sign0 == sign1 && sign0 == sign2

  var test = Vector2(0, 0),
      endToStart = Vector2(0, 0),
      dir = tolerance ? this.directionOf(-tolerance) : this.direction;

  var start = tolerance ? this.positionOf(-tolerance) : this.start;
  var end = tolerance ? this.positionOf(this.length + tolerance) : this.end;

  Vector2.sub(test, p, start);
  Vector2.sub(endToStart, end, start);

  var sign0 = sign(Vector2.crossz(dir, endToStart));
  var sign1 = sign(Vector2.crossz(dir, test));
  var sign2 = sign(Vector2.crossz(test, endToStart));
  //console.log("dir", dir, "end", end, "test", test, "sign0", sign0, "sign1", sign1, "sign2", sign2);

  // All or no solutions because there is no arc, this should not be possible, it should
  // have been caught on curve creation
  if (sign0 === 0) throw "This curve has no wedge";

  // Solution because the test is on an edge of the wedge
  if (sign1 === 0 || sign2 === 0) return true;

  return sign0 === sign1 && sign0 === sign2;
}

function getAlphaValueAtPosition$1(p) {
  return this.offsetOf(p) / this.length;
}

function sign(value) {
  return roughlyEqual$1(value, 0) ? 0 : value > 0 ? 1 : -1;
}

function offsetOf$1(point$$1) {
  var tolerance = 1e-3;
  var centerToStart = Vector2.sub(Vector2(0, 0), this.start, this.center);
  var centerToPoint = Vector2.sub(Vector2(0, 0), point$$1, this.center);
  var centerToEnd = Vector2.sub(Vector2(0, 0), this.end, this.center);

  var angleSpan = this.length / this.radius;

  var directionAtPoint = this.orientation > 0 ? Vector2.fromValues(centerToPoint[1], -centerToPoint[0]) : Vector2.fromValues(-centerToPoint[1], centerToPoint[0]);
  var angleAToPoint = Vector2.angleBetweenWithDirections(centerToStart, this.direction, centerToPoint);
  var angleBToPoint = Vector2.angleBetweenWithDirections(centerToPoint, directionAtPoint, centerToEnd);

  return angleAToPoint <= angleSpan + tolerance && angleBToPoint <= angleSpan + tolerance ? angleAToPoint * this.radius : Vector2.dist(this.start, point$$1) < Vector2.dist(this.end, point$$1) ? -Vector2.angleBetween(centerToStart, centerToPoint) * this.radius : this.length + Vector2.angleBetween(centerToEnd, centerToPoint) * this.radius;
}

function closestPointTo$1(point$$1) {
  var offset = this.offsetOf(point$$1);
  if (roughlyBetween(0, offset, this.length)) {
    var centerToPoint = Vector2.sub(Vector2(0, 0), point$$1, this.center);
    return Vector2.add(centerToPoint, centerToPoint, this.center, Vector2.scale(centerToPoint, centerToPoint, this.radius / Vector2.len(centerToPoint)));
  }

  if (Vector2.dist(this.start, point$$1) < Vector2.dist(this.end, point$$1)) {
    return this.start;
  } else {
    return this.end;
  }
}

function positionOf$1(offset) {
  var rotationSign = -this.orientation;
  var centerToStart = Vector2.sub(Vector2(0, 0), this.start, this.center);
  var centerToPoint = Vector2.rotate(Vector2(0, 0), centerToStart, rotationSign * offset / this.radius);
  return Vector2.add(centerToPoint, centerToPoint, this.center);
}

function offsetPerpendicular$1(offsetToRight) {
  return Curve.createIfValid(Vector2.scalePerpendicularAndAdd(Vector2(0, 0), this.start, this.direction, offsetToRight), this.direction, Vector2.scalePerpendicularAndAdd(Vector2(0, 0), this.end, this.endDirection, offsetToRight));
}

function offsetPerpendicularLength$1(offsetToRight) {
  if (offsetToRight === 0) return this.length;
  var angleSpan = this.length / this.radius;
  return this.length + (this.orientation < 0 ? 1 : -1) * angleSpan * offsetToRight;
}

function mapPerpendicular$1(offsetA, offsetToRightA, offsetToRightB) {
  // TODO: maybe simplify?
  return offsetA * (this.offsetPerpendicularLength(offsetToRightB) / this.offsetPerpendicularLength(offsetToRightA));
}

var DEBUG_CURVE_DISPLAY = false;
function draw$5(context) {
  if (this.radius === 0) return;

  // Draw the full circle
  DEBUG_CURVE_DISPLAY && context.stroke(new Circle(this.center, this.radius));

  // Draw the arrow head at the end of the arc
  context.arrowhead(this.end, this.endDirection);
  context.stroke(this);
}

function vertices$1(offsetToRight) {
  var centerToStart = Vector2.sub(Vector2(0, 0), this.start, this.center);

  if (offsetToRight) {
    var desiredRadius = this.orientation > 0 ? this.radius - offsetToRight : this.radius + offsetToRight;
    var scaling = desiredRadius / this.radius;
    Vector2.scale(centerToStart, centerToStart, scaling);
  }

  var angleSpan = this.length / this.radius;
  // TODO: make less magic
  var subdivisions = Math.ceil(Math.abs(angleSpan) * 4 * (Math.abs(this.radius) / 100 + 1)) + 1;
  var vertices = new Array(subdivisions);
  var rotationSign = -this.orientation;
  var rotationMatrix = mat2.rotation(rotationSign * angleSpan * (1 / (subdivisions - 1)));
  var pointer = Vector2.clone(centerToStart);

  for (var i = 0; i < subdivisions; i++) {
    vertices[i] = Vector2.add(Vector2(0, 0), pointer, this.center);
    mat2.map(pointer, rotationMatrix, pointer);
  }

  return vertices;
}

function uvs$1(offsetToRight, multiplierAlongPath) {
  var angleSpan = this.length / this.radius;
  // TODO: make less magic
  var subdivisions = Math.ceil(Math.abs(angleSpan) * 4 * (Math.abs(this.radius) / 100 + 1)) + 1;

  var uvs = new Array(subdivisions);

  for (var i = 0; i < subdivisions; i++) {
    uvs[i] = Vector2.fromValues(multiplierAlongPath * this.length * (i / (subdivisions - 1)), offsetToRight);
  }

  return uvs;
}

var It = function () {
  function It() {
    classCallCheck(this, It);

    this.op = id$5;
  }

  createClass(It, [{
    key: "of",
    value: function of(iterable) {
      // might return normal or iterator function
      return this.op(iterable);
    }
  }, {
    key: "chain",
    value: function chain(second) {
      this.op = compose(this.op, second);
      return this;
    }
  }, {
    key: "cycle",


    // Iterators
    value: function cycle() {
      return this.chain(cycler());
    }
  }, {
    key: "flatten",
    value: function flatten() {
      return this.chain(flattener());
    }
  }, {
    key: "map",
    value: function map(mapping) {
      return this.chain(mapper(mapping));
    }
  }, {
    key: "filter",
    value: function filter(predicate) {
      return this.chain(filterer(predicate));
    }
  }, {
    key: "take",
    value: function take(n) {
      return this.chain(taker(n));
    }
  }, {
    key: "drop",
    value: function drop(n) {
      return this.chain(dropper(n));
    }
  }, {
    key: "windows",
    value: function windows(size) {
      return this.chain(windower(size));
    }
  }, {
    key: "chunks",
    value: function chunks(size) {
      return this.chain(chunker(size));
    }
  }, {
    key: "slice",
    value: function slice(start, end) {
      return this.chain(compose(dropper(start - 1), taker(start - end)));
    }
  }, {
    key: "common",
    value: function common(otherIterable) {
      return this.chain(commoner(otherIterable));
    }
  }, {
    key: "zip",
    value: function zip(otherIterable) {
      return this.chain(zipper(otherIterable));
    }
  }, {
    key: "append",
    value: function append(otherIterable) {
      return this.chain(appender(otherIterable));
    }

    // Reducers

  }, {
    key: "reduce",
    value: function reduce(step, initial) {
      return this.chain(reducerer(step, initial));
    }
  }, {
    key: "first",
    value: function first() {
      return this.chain(firster());
    }
  }, {
    key: "find",
    value: function find(predicate) {
      return this.chain(finder(predicate));
    }
  }, {
    key: "has",
    value: function has(item) {
      return this.chain(haser(item));
    }
  }, {
    key: "extreme",
    value: function extreme(mapping) {
      return this.chain(extremer(mapping));
    }
  }, {
    key: "max",
    value: function max(mapping) {
      return this.chain(maxer(mapping));
    }
  }, {
    key: "min",
    value: function min(mapping) {
      return this.chain(miner(mapping));
    }
  }, {
    key: "all",
    value: function all(predicate) {
      return this.chain(aller(predicate));
    }
  }, {
    key: "any",
    value: function any(predicate) {
      return this.chain(anyer(predicate));
    }
  }, {
    key: "unique",
    value: function unique() {
      return this.chain(uniquer());
    }
  }, {
    key: "empty",
    value: function empty() {
      return this.chain(emptyer());
    }
  }], [{
    key: "concat",
    value: function concat(first, second) {
      // this only returns an iterating function,
      // it doesn't run it yet!
      return (/*#__PURE__*/regeneratorRuntime.mark(function concatenation() {
          return regeneratorRuntime.wrap(function concatenation$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  return _context.delegateYield(first, "t0", 1);

                case 1:
                  return _context.delegateYield(second, "t1", 2);

                case 2:
                case "end":
                  return _context.stop();
              }
            }
          }, concatenation, this);
        })
      );
    }
  }]);
  return It;
}();

function createIteration() {
  return new It();
}
createIteration.concat = It.concat;
function id$5(iterable) {
  return iterable;
}

function compose(first, second) {
  return function composition(iterable) {
    return second(first(iterable));
  };
}

// Iterator-ers

function cycler() {
  return (/*#__PURE__*/regeneratorRuntime.mark(function cycle(iterable) {
      var seenValues, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, value;

      return regeneratorRuntime.wrap(function cycle$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              seenValues = [];
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context2.prev = 4;
              _iterator = iterable[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context2.next = 14;
                break;
              }

              value = _step.value;

              seenValues.push(value);
              _context2.next = 11;
              return value;

            case 11:
              _iteratorNormalCompletion = true;
              _context2.next = 6;
              break;

            case 14:
              _context2.next = 20;
              break;

            case 16:
              _context2.prev = 16;
              _context2.t0 = _context2["catch"](4);
              _didIteratorError = true;
              _iteratorError = _context2.t0;

            case 20:
              _context2.prev = 20;
              _context2.prev = 21;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 23:
              _context2.prev = 23;

              if (!_didIteratorError) {
                _context2.next = 26;
                break;
              }

              throw _iteratorError;

            case 26:
              return _context2.finish(23);

            case 27:
              return _context2.finish(20);

            case 28:
              

              return _context2.delegateYield(seenValues, "t1", 30);

            case 30:
              _context2.next = 28;
              break;

            case 32:
            case "end":
              return _context2.stop();
          }
        }
      }, cycle, this, [[4, 16, 20, 28], [21,, 23, 27]]);
    })
  );
}

function flattener() {
  return (/*#__PURE__*/regeneratorRuntime.mark(function flatten(iterable) {
      var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, subIterable;

      return regeneratorRuntime.wrap(function flatten$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              // for some reason yield* doesn't compile in here
              _iteratorNormalCompletion2 = true;
              _didIteratorError2 = false;
              _iteratorError2 = undefined;
              _context3.prev = 3;
              _iterator2 = iterable[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                _context3.next = 11;
                break;
              }

              subIterable = _step2.value;
              return _context3.delegateYield(subIterable, "t0", 8);

            case 8:
              _iteratorNormalCompletion2 = true;
              _context3.next = 5;
              break;

            case 11:
              _context3.next = 17;
              break;

            case 13:
              _context3.prev = 13;
              _context3.t1 = _context3["catch"](3);
              _didIteratorError2 = true;
              _iteratorError2 = _context3.t1;

            case 17:
              _context3.prev = 17;
              _context3.prev = 18;

              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }

            case 20:
              _context3.prev = 20;

              if (!_didIteratorError2) {
                _context3.next = 23;
                break;
              }

              throw _iteratorError2;

            case 23:
              return _context3.finish(20);

            case 24:
              return _context3.finish(17);

            case 25:
            case "end":
              return _context3.stop();
          }
        }
      }, flatten, this, [[3, 13, 17, 25], [18,, 20, 24]]);
    })
  );
}

function mapper(mapping) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function map(iterable) {
      var _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, value;

      return regeneratorRuntime.wrap(function map$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _iteratorNormalCompletion3 = true;
              _didIteratorError3 = false;
              _iteratorError3 = undefined;
              _context4.prev = 3;
              _iterator3 = iterable[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                _context4.next = 12;
                break;
              }

              value = _step3.value;
              _context4.next = 9;
              return mapping(value);

            case 9:
              _iteratorNormalCompletion3 = true;
              _context4.next = 5;
              break;

            case 12:
              _context4.next = 18;
              break;

            case 14:
              _context4.prev = 14;
              _context4.t0 = _context4["catch"](3);
              _didIteratorError3 = true;
              _iteratorError3 = _context4.t0;

            case 18:
              _context4.prev = 18;
              _context4.prev = 19;

              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }

            case 21:
              _context4.prev = 21;

              if (!_didIteratorError3) {
                _context4.next = 24;
                break;
              }

              throw _iteratorError3;

            case 24:
              return _context4.finish(21);

            case 25:
              return _context4.finish(18);

            case 26:
            case "end":
              return _context4.stop();
          }
        }
      }, map, this, [[3, 14, 18, 26], [19,, 21, 25]]);
    })
  );
}

function filterer(predicate) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function filter(iterable) {
      var _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, value;

      return regeneratorRuntime.wrap(function filter$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _iteratorNormalCompletion4 = true;
              _didIteratorError4 = false;
              _iteratorError4 = undefined;
              _context5.prev = 3;
              _iterator4 = iterable[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
                _context5.next = 13;
                break;
              }

              value = _step4.value;

              if (!predicate(value)) {
                _context5.next = 10;
                break;
              }

              _context5.next = 10;
              return value;

            case 10:
              _iteratorNormalCompletion4 = true;
              _context5.next = 5;
              break;

            case 13:
              _context5.next = 19;
              break;

            case 15:
              _context5.prev = 15;
              _context5.t0 = _context5["catch"](3);
              _didIteratorError4 = true;
              _iteratorError4 = _context5.t0;

            case 19:
              _context5.prev = 19;
              _context5.prev = 20;

              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }

            case 22:
              _context5.prev = 22;

              if (!_didIteratorError4) {
                _context5.next = 25;
                break;
              }

              throw _iteratorError4;

            case 25:
              return _context5.finish(22);

            case 26:
              return _context5.finish(19);

            case 27:
            case "end":
              return _context5.stop();
          }
        }
      }, filter, this, [[3, 15, 19, 27], [20,, 22, 26]]);
    })
  );
}

function taker(n) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function take(iterable) {
      var left, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, value;

      return regeneratorRuntime.wrap(function take$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              left = n;
              _iteratorNormalCompletion5 = true;
              _didIteratorError5 = false;
              _iteratorError5 = undefined;
              _context6.prev = 4;
              _iterator5 = iterable[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
                _context6.next = 16;
                break;
              }

              value = _step5.value;

              if (!(left === 0)) {
                _context6.next = 10;
                break;
              }

              return _context6.abrupt("return");

            case 10:
              left--;_context6.next = 13;
              return value;

            case 13:
              _iteratorNormalCompletion5 = true;
              _context6.next = 6;
              break;

            case 16:
              _context6.next = 22;
              break;

            case 18:
              _context6.prev = 18;
              _context6.t0 = _context6["catch"](4);
              _didIteratorError5 = true;
              _iteratorError5 = _context6.t0;

            case 22:
              _context6.prev = 22;
              _context6.prev = 23;

              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }

            case 25:
              _context6.prev = 25;

              if (!_didIteratorError5) {
                _context6.next = 28;
                break;
              }

              throw _iteratorError5;

            case 28:
              return _context6.finish(25);

            case 29:
              return _context6.finish(22);

            case 30:
            case "end":
              return _context6.stop();
          }
        }
      }, take, this, [[4, 18, 22, 30], [23,, 25, 29]]);
    })
  );
}

function dropper(n) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function drop(iterable) {
      var startIn, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, value;

      return regeneratorRuntime.wrap(function drop$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              startIn = n;
              _iteratorNormalCompletion6 = true;
              _didIteratorError6 = false;
              _iteratorError6 = undefined;
              _context7.prev = 4;
              _iterator6 = iterable[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
                _context7.next = 17;
                break;
              }

              value = _step6.value;

              if (!(startIn === 0)) {
                _context7.next = 13;
                break;
              }

              _context7.next = 11;
              return value;

            case 11:
              _context7.next = 14;
              break;

            case 13:
              startIn--;

            case 14:
              _iteratorNormalCompletion6 = true;
              _context7.next = 6;
              break;

            case 17:
              _context7.next = 23;
              break;

            case 19:
              _context7.prev = 19;
              _context7.t0 = _context7["catch"](4);
              _didIteratorError6 = true;
              _iteratorError6 = _context7.t0;

            case 23:
              _context7.prev = 23;
              _context7.prev = 24;

              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }

            case 26:
              _context7.prev = 26;

              if (!_didIteratorError6) {
                _context7.next = 29;
                break;
              }

              throw _iteratorError6;

            case 29:
              return _context7.finish(26);

            case 30:
              return _context7.finish(23);

            case 31:
            case "end":
              return _context7.stop();
          }
        }
      }, drop, this, [[4, 19, 23, 31], [24,, 26, 30]]);
    })
  );
}

function windower(size) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function windows(iterable) {
      var window, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, value;

      return regeneratorRuntime.wrap(function windows$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              window = [];
              _iteratorNormalCompletion7 = true;
              _didIteratorError7 = false;
              _iteratorError7 = undefined;
              _context8.prev = 4;
              _iterator7 = iterable[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done) {
                _context8.next = 16;
                break;
              }

              value = _step7.value;

              window.push(value);

              if (!(window.length === size)) {
                _context8.next = 13;
                break;
              }

              _context8.next = 12;
              return window.slice();

            case 12:
              window.shift();

            case 13:
              _iteratorNormalCompletion7 = true;
              _context8.next = 6;
              break;

            case 16:
              _context8.next = 22;
              break;

            case 18:
              _context8.prev = 18;
              _context8.t0 = _context8["catch"](4);
              _didIteratorError7 = true;
              _iteratorError7 = _context8.t0;

            case 22:
              _context8.prev = 22;
              _context8.prev = 23;

              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }

            case 25:
              _context8.prev = 25;

              if (!_didIteratorError7) {
                _context8.next = 28;
                break;
              }

              throw _iteratorError7;

            case 28:
              return _context8.finish(25);

            case 29:
              return _context8.finish(22);

            case 30:
            case "end":
              return _context8.stop();
          }
        }
      }, windows, this, [[4, 18, 22, 30], [23,, 25, 29]]);
    })
  );
}

function chunker(size) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function chunk(iterable) {
      var group, _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, value;

      return regeneratorRuntime.wrap(function chunk$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              group = [];
              _iteratorNormalCompletion8 = true;
              _didIteratorError8 = false;
              _iteratorError8 = undefined;
              _context9.prev = 4;
              _iterator8 = iterable[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
                _context9.next = 16;
                break;
              }

              value = _step8.value;

              group.push(value);

              if (!(group.length === size)) {
                _context9.next = 13;
                break;
              }

              _context9.next = 12;
              return group;

            case 12:
              group = [];

            case 13:
              _iteratorNormalCompletion8 = true;
              _context9.next = 6;
              break;

            case 16:
              _context9.next = 22;
              break;

            case 18:
              _context9.prev = 18;
              _context9.t0 = _context9["catch"](4);
              _didIteratorError8 = true;
              _iteratorError8 = _context9.t0;

            case 22:
              _context9.prev = 22;
              _context9.prev = 23;

              if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
              }

            case 25:
              _context9.prev = 25;

              if (!_didIteratorError8) {
                _context9.next = 28;
                break;
              }

              throw _iteratorError8;

            case 28:
              return _context9.finish(25);

            case 29:
              return _context9.finish(22);

            case 30:
            case "end":
              return _context9.stop();
          }
        }
      }, chunk, this, [[4, 18, 22, 30], [23,, 25, 29]]);
    })
  );
}

function commoner(otherIterable) {
  var otherItems = new Set(otherIterable);
  return (/*#__PURE__*/regeneratorRuntime.mark(function common(iterable) {
      var _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, value;

      return regeneratorRuntime.wrap(function common$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _iteratorNormalCompletion9 = true;
              _didIteratorError9 = false;
              _iteratorError9 = undefined;
              _context10.prev = 3;
              _iterator9 = new Set(iterable)[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
                _context10.next = 13;
                break;
              }

              value = _step9.value;

              if (!otherItems.has(value)) {
                _context10.next = 10;
                break;
              }

              _context10.next = 10;
              return value;

            case 10:
              _iteratorNormalCompletion9 = true;
              _context10.next = 5;
              break;

            case 13:
              _context10.next = 19;
              break;

            case 15:
              _context10.prev = 15;
              _context10.t0 = _context10["catch"](3);
              _didIteratorError9 = true;
              _iteratorError9 = _context10.t0;

            case 19:
              _context10.prev = 19;
              _context10.prev = 20;

              if (!_iteratorNormalCompletion9 && _iterator9.return) {
                _iterator9.return();
              }

            case 22:
              _context10.prev = 22;

              if (!_didIteratorError9) {
                _context10.next = 25;
                break;
              }

              throw _iteratorError9;

            case 25:
              return _context10.finish(22);

            case 26:
              return _context10.finish(19);

            case 27:
            case "end":
              return _context10.stop();
          }
        }
      }, common, this, [[3, 15, 19, 27], [20,, 22, 26]]);
    })
  );
}

function zipper(otherIterable) {
  otherIterable = otherIterable[Symbol.iterator]();
  return (/*#__PURE__*/regeneratorRuntime.mark(function zip(iterable) {
      var _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, value, other;

      return regeneratorRuntime.wrap(function zip$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              _iteratorNormalCompletion10 = true;
              _didIteratorError10 = false;
              _iteratorError10 = undefined;
              _context11.prev = 3;
              _iterator10 = iterable[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
                _context11.next = 15;
                break;
              }

              value = _step10.value;
              other = otherIterable.next();

              if (!other.done) {
                _context11.next = 10;
                break;
              }

              return _context11.abrupt("break", 15);

            case 10:
              _context11.next = 12;
              return [value, other.value];

            case 12:
              _iteratorNormalCompletion10 = true;
              _context11.next = 5;
              break;

            case 15:
              _context11.next = 21;
              break;

            case 17:
              _context11.prev = 17;
              _context11.t0 = _context11["catch"](3);
              _didIteratorError10 = true;
              _iteratorError10 = _context11.t0;

            case 21:
              _context11.prev = 21;
              _context11.prev = 22;

              if (!_iteratorNormalCompletion10 && _iterator10.return) {
                _iterator10.return();
              }

            case 24:
              _context11.prev = 24;

              if (!_didIteratorError10) {
                _context11.next = 27;
                break;
              }

              throw _iteratorError10;

            case 27:
              return _context11.finish(24);

            case 28:
              return _context11.finish(21);

            case 29:
            case "end":
              return _context11.stop();
          }
        }
      }, zip, this, [[3, 17, 21, 29], [22,, 24, 28]]);
    })
  );
}

function appender(otherIterable) {
  return (/*#__PURE__*/regeneratorRuntime.mark(function append(iterable) {
      return regeneratorRuntime.wrap(function append$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              return _context12.delegateYield(iterable, "t0", 1);

            case 1:
              return _context12.delegateYield(otherIterable, "t1", 2);

            case 2:
            case "end":
              return _context12.stop();
          }
        }
      }, append, this);
    })
  );
}

// Reducer-ers

function reducerer(step, initial) {
  return function reduce(iterable) {
    var reducedValue = initial;
    var _iteratorNormalCompletion11 = true;
    var _didIteratorError11 = false;
    var _iteratorError11 = undefined;

    try {
      for (var _iterator11 = iterable[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
        var value = _step11.value;
        reducedValue = step(reducedValue, value);
      }
    } catch (err) {
      _didIteratorError11 = true;
      _iteratorError11 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion11 && _iterator11.return) {
          _iterator11.return();
        }
      } finally {
        if (_didIteratorError11) {
          throw _iteratorError11;
        }
      }
    }

    return reducedValue;
  };
}

function firster() {
  return function first(iterable) {
    return iterable.next().value;
  };
}

function finder(predicate) {
  return function find(iterable) {
    var _iteratorNormalCompletion12 = true;
    var _didIteratorError12 = false;
    var _iteratorError12 = undefined;

    try {
      for (var _iterator12 = iterable[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
        var value = _step12.value;
        if (predicate(value)) return value;
      }
    } catch (err) {
      _didIteratorError12 = true;
      _iteratorError12 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion12 && _iterator12.return) {
          _iterator12.return();
        }
      } finally {
        if (_didIteratorError12) {
          throw _iteratorError12;
        }
      }
    }
  };
}

function haser(item) {
  return function has(iterable) {
    var _iteratorNormalCompletion13 = true;
    var _didIteratorError13 = false;
    var _iteratorError13 = undefined;

    try {
      for (var _iterator13 = iterable[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
        var value = _step13.value;
        if (value === item) return true;
      }
    } catch (err) {
      _didIteratorError13 = true;
      _iteratorError13 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion13 && _iterator13.return) {
          _iterator13.return();
        }
      } finally {
        if (_didIteratorError13) {
          throw _iteratorError13;
        }
      }
    }
  };
}

function extremer(mapping) {
  return function extreme(iterable) {
    var bestMetric = void 0;
    var best = void 0;
    var rest = [];

    var _iteratorNormalCompletion14 = true;
    var _didIteratorError14 = false;
    var _iteratorError14 = undefined;

    try {
      for (var _iterator14 = iterable[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
        var value = _step14.value;

        var metric = mapping(value);
        if (best === undefined || metric > bestMetric) {
          if (best !== undefined) rest.push(best);
          best = value;
          bestMetric = metric;
        } else rest.push(value);
      }
    } catch (err) {
      _didIteratorError14 = true;
      _iteratorError14 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion14 && _iterator14.return) {
          _iterator14.return();
        }
      } finally {
        if (_didIteratorError14) {
          throw _iteratorError14;
        }
      }
    }

    return { best: best, bestMetric: bestMetric, rest: rest };
  };
}

function maxer(mapping) {
  return function max(iterable) {
    var _extremer = extremer(mapping)(iterable),
        best = _extremer.best,
        maximum = _extremer.bestMetric,
        rest = _extremer.rest;

    return { best: best, max: maximum, rest: rest };
  };
}

function miner(mapping) {
  var negativeMapping = function negativeMapping(i) {
    return -mapping(i);
  };
  return function min(iterable) {
    var _extremer2 = extremer(negativeMapping)(iterable),
        best = _extremer2.best,
        negativeMin = _extremer2.bestMetric,
        rest = _extremer2.rest;

    return { best: best, min: -negativeMin, rest: rest };
  };
}

function aller(predicate) {
  return function all(iterable) {
    var _iteratorNormalCompletion15 = true;
    var _didIteratorError15 = false;
    var _iteratorError15 = undefined;

    try {
      for (var _iterator15 = iterable[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
        var value = _step15.value;
        if (!predicate(value)) return false;
      }
    } catch (err) {
      _didIteratorError15 = true;
      _iteratorError15 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion15 && _iterator15.return) {
          _iterator15.return();
        }
      } finally {
        if (_didIteratorError15) {
          throw _iteratorError15;
        }
      }
    }

    return true;
  };
}

function anyer(predicate) {
  return function any(iterable) {
    var _iteratorNormalCompletion16 = true;
    var _didIteratorError16 = false;
    var _iteratorError16 = undefined;

    try {
      for (var _iterator16 = iterable[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
        var value = _step16.value;
        if (predicate(value)) return true;
      }
    } catch (err) {
      _didIteratorError16 = true;
      _iteratorError16 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion16 && _iterator16.return) {
          _iterator16.return();
        }
      } finally {
        if (_didIteratorError16) {
          throw _iteratorError16;
        }
      }
    }

    return false;
  };
}

function uniquer() {
  return function unique(iterable) {

    //return new Set(iterable);
    var s = new Set();
    var _iteratorNormalCompletion17 = true;
    var _didIteratorError17 = false;
    var _iteratorError17 = undefined;

    try {
      for (var _iterator17 = iterable[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
        var value = _step17.value;
        s.add(value);
      }
    } catch (err) {
      _didIteratorError17 = true;
      _iteratorError17 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion17 && _iterator17.return) {
          _iterator17.return();
        }
      } finally {
        if (_didIteratorError17) {
          throw _iteratorError17;
        }
      }
    }

    return s;
  };
}

function emptyer() {
  return function empty(iterable) {
    return iterable.next().done;
  };
}

var Path = function () {
  function Path(segments, isClockwise, boundingBox) {
    classCallCheck(this, Path);

    this.segments = segments === undefined ? [] : segments.slice(0);
    this.isClockwise = isClockwise === undefined ? orientation(this.segments) : isClockwise;
    this.boundingBox = boundingBox === undefined ? aabb(this.segments) : boundingBox;

    this.segmentOffsets = new Array(this.segments.length);
    var offset = 0;
    for (var i = 0; i < this.segments.length; i++) {
      this.segmentOffsets[i] = offset;
      offset += this.segments[i].length;
    }
    this.length = offset;
  }

  //static name = "Path";

  // Return true if the path is closed and can be considered a shape


  createClass(Path, [{
    key: 'concat',
    value: function concat(path) {
      return new Path(this.segments.concat(path.segments));
    }
  }, {
    key: 'reverse',
    value: function reverse() {
      var segments = new Array(this.segments.length);
      for (var i = 0, j = this.segments.length - 1; i < this.segments.length; i++, j--) {
        segments[j] = this.segments[i].reverse();
      }
      return new Path(segments, !this.isClockwise);
    }
  }, {
    key: 'cut',
    value: function cut(startOffset, endOffset) {
      //startOffset = startOffset || 0;
      //endOffset = endOffset || this.length;
      var tolerance = 1e-2;

      var firstSegmentToReplace; // = this.segments[0];
      var firstSegmentToReplaceIndex; // = 0;
      var lastSegmentToReplace; // = this.segments[ this.segments.length-1];
      var lastSegmentToReplaceIndex; // = this.segments.length - 1;

      for (var s = 0; s < this.segments.length; s++) {
        var segmentOffset = this.segmentOffsets[s];
        if (segmentOffset < startOffset + tolerance) {
          firstSegmentToReplaceIndex = s;
          firstSegmentToReplace = this.segments[s];
        }
        if (segmentOffset < endOffset + tolerance) {
          lastSegmentToReplaceIndex = s;
          lastSegmentToReplace = this.segments[s];
        }
      }

      if (firstSegmentToReplace === lastSegmentToReplace) {
        return new Path([new Curve(this.positionOf(startOffset /*Math.max(0, startOffset)*/), this.directionOf(startOffset /*Math.max(0, startOffset)*/), this.positionOf(endOffset /*Math.min(endOffset, this.length)*/))]);
      } else {
        var newSegments = this.segments.slice(firstSegmentToReplaceIndex + 1, lastSegmentToReplaceIndex);

        var newFirstSegment = new Curve(this.positionOf(startOffset /*Math.max(0, startOffset)*/), this.directionOf(startOffset /*Math.max(0, startOffset)*/), firstSegmentToReplace.end);

        newSegments.unshift(newFirstSegment);

        var newLastSegment = new Curve(lastSegmentToReplace.start, lastSegmentToReplace.direction, this.positionOf(endOffset /*Math.min(endOffset, this.length)*/));

        newSegments.push(newLastSegment);

        return new Path(newSegments);
      }
    }
  }, {
    key: 'makeContigous',
    value: function makeContigous(isLoop) {
      var newSegments = [];

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.segments.values().windows(2)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = slicedToArray(_step.value, 2),
              segmentA = _step$value[0],
              segmentB = _step$value[1];

          newSegments.push(segmentA);
          if (!roughlyEqualVec2(segmentA.end, segmentB.start)) {
            newSegments.push(new LineSegment$2(segmentA.end, /*segmentA.endDirection,*/segmentB.start));
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      newSegments.push(this.segments[this.segments.length - 1]);

      if (isLoop && !roughlyEqualVec2(this.segments[this.segments.length - 1].end, this.segments[0].start)) {
        newSegments.push(new LineSegment$2(this.segments[this.segments.length - 1].end, /*this.segments[ this.segments.length-1].end.endDirection,*/this.segments[0].start));
      }

      return new Path(newSegments);
    }
  }, {
    key: 'simplifySelfIntersections',
    value: function simplifySelfIntersections() {
      var newSegments = [];
      var eps = 1 / 10;

      var previousIntersectionPosition;

      for (var s = 0; s < this.segments.length; s++) {
        var segment = this.segments[s];
        var foundSelfIntersection = false;
        var intersectionPosition;
        var nextSegmentIndex;
        var otherSegment;
        var offsetOnOtherSegment;

        for (var o = s + 1; o < this.segments.length + 1; o++) {
          otherSegment = this.segments[o % this.segments.length];

          var intersectionInfos = intersect$1(segment, otherSegment);

          if (intersectionInfos.length > 0) {
            intersectionPosition = intersectionInfos[0].p;
            offsetOnOtherSegment = otherSegment.offsetOf(intersectionPosition);

            if (offsetOnOtherSegment > eps && offsetOnOtherSegment < otherSegment.length - eps) {
              //DebugPoints.add(vec2.toThree(intersectionPosition), 0xff0000, "si");
              foundSelfIntersection = true;
              nextSegmentIndex = o - 1;
              break;
            }
          }
        }

        if (previousIntersectionPosition) {
          var offsetOfPreviousIntersection = segment.offsetOf(previousIntersectionPosition);
          var directionOfPreviousIntersection = segment.directionOf(offsetOfPreviousIntersection);

          if (foundSelfIntersection && !roughlyEqualVec2(previousIntersectionPosition, intersectionPosition)) {
            newSegments.push(new Curve(previousIntersectionPosition, directionOfPreviousIntersection, intersectionPosition));
            s = nextSegmentIndex;
            previousIntersectionPosition = intersectionPosition;
          } else {
            newSegments.push(new Curve(previousIntersectionPosition, directionOfPreviousIntersection, segment.end));
            previousIntersectionPosition = undefined;
          }
        } else {
          if (foundSelfIntersection) {
            newSegments.push(new Curve(segment.start, segment.direction, intersectionPosition));
            s = nextSegmentIndex;
            previousIntersectionPosition = intersectionPosition;
          } else {
            newSegments.push(segment);
          }
        }
      }

      return new Path(newSegments);
    }
  }, {
    key: 'weld',
    value: function weld(maxWeldDistance) {
      var longEnoughSegments = this.segments.filter(function (s) {
        return s.length > maxWeldDistance;
      });
      var newSegments = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = createIteration().windows(2).of(createIteration.concat(longEnoughSegments, [longEnoughSegments[0]])())[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = slicedToArray(_step2.value, 2),
              segment = _step2$value[0],
              nextSegment = _step2$value[1];

          var newEnd = segment.end;

          if (roughlyEqualVec2(segment.end, nextSegment.start, maxWeldDistance)) {
            newEnd = nextSegment.start;
          }

          if (segment.isCurve) newSegments.push(new Curve(segment.start, segment.direction, newEnd));else newSegments.push(new LineSegment$2(segment.start, newEnd));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return new Path(newSegments);
    }
  }, {
    key: 'scale',
    value: function scale(scalar) {
      var segments = new Array(this.segments.length);
      for (var i = 0; i < this.segments.length; i++) {
        var each = this.segments[i];
        segments[i] = each.scale(scalar);
      }
      return new Path(segments, this.isClockwise);
    }
  }, {
    key: 'translate',
    value: function translate(offset) {
      function translate(offset) {
        var segments = new Array(this.segments.length);
        for (var i = 0; i < this.segments.length; i++) {
          var each = this.segments[i];
          segments[i] = each.translate(offset);
        }
        return new Path(segments, this.isClockwise);
      }
    }
  }, {
    key: 'offsetPerpendicular',
    value: function offsetPerpendicular(offsetToRight) {
      return new Path(this.segments.map(function (segment) {
        return segment.offsetPerpendicular(offsetToRight);
      }).filter(function (segment) {
        return segment;
      }));
    }
  }, {
    key: 'offsetPerpendicularLength',
    value: function offsetPerpendicularLength(offsetToRight) {
      var length = 0;
      for (var s = 0; s < this.segments.length; s++) {
        length += this.segments[s].offsetPerpendicularLength(offsetToRight);
      }
      return length;
    }
  }, {
    key: 'mapPerpendicular',
    value: function mapPerpendicular(offsetA, offsetToRightA, offsetToRightB) {
      var currentSegment;
      var currentOffsetA = 0;
      var currentOffsetB = 0;
      var tolerance = 1e-2;

      for (var s = 0; s < this.segments.length; s++) {
        currentSegment = this.segments[s];
        var segmentLengthA = currentSegment.offsetPerpendicularLength(offsetToRightA);
        var segmentLengthB = currentSegment.offsetPerpendicularLength(offsetToRightB);
        var nextOffsetA = currentOffsetA + segmentLengthA;
        var nextOffsetB = currentOffsetB + segmentLengthB;

        if (nextOffsetA > offsetA - tolerance) {
          var offsetAOnSegment = offsetA - currentOffsetA;
          var offsetBOnSegment = currentSegment.mapPerpendicular(offsetAOnSegment, offsetToRightA, offsetToRightB);
          return currentOffsetB + offsetBOnSegment;
        } else {
          currentOffsetA = nextOffsetA;
          currentOffsetB = nextOffsetB;
        }
      }
    }

    // Return the segments that intersect

  }, {
    key: 'intersections',
    value: function intersections(b) {
      var aSegments = this.segments;
      var bSegments = b.segments;
      var allIntersections = [];
      for (var i = 0; i < aSegments.length; i++) {
        var aSegment = aSegments[i];
        for (var j = 0; j < bSegments.length; j++) {
          var bSegment = bSegments[j];
          var relativeIntersections = intersect$1(aSegment, bSegment);

          for (var r = 0; r < relativeIntersections.length; r++) {
            var intersection = relativeIntersections[r];

            // u,v is meant to be a value between 0,1 - shouldn't they all get scaled?
            intersection.u += i;
            intersection.v += j;

            allIntersections.push(intersection);
          }
        }
      }
      return allIntersections;
    }

    // Use a 'crossings number' to determine if p is inside the path

  }, {
    key: 'containsPoint',
    value: function containsPoint(p) {
      if (!this.isClosed) return false;

      // Should use an actual Ray here, but the intersections code for
      // Ray-Line, Ray-Curve hasn't been written yet, only Ray-Ray
      var segments = this.segments,
          crossings = 0,
          degenerate = false,
          ray = new LineSegment$2(p, Vector2.fromValues(this.boundingBox.right + 1, p[1]));
      for (var i = 0; i < segments.length; i++) {
        var potentials = intersect$1(ray, segments[i]);
        //console.log("containsPoint step", i + "/" + (segments.length - 1), potentials.length);

        for (var j = 0; j < potentials.length; j++) {
          if (potentials[j].uIsDegenerate) {
            //console.warn("containsPoint uIsDegenerate", potentials[j]);
            return true;
          }
          if (potentials[j].vIsDegenerate) {
            degenerate = true;
            break;
          }
        }
        if (degenerate) {
          // If a point is degenerate, restart the search
          //console.log("containsPoint vIsDegenerate", potentials[j]);
          i = -1;
          crossings = 0;
          degenerate = false;
          // make the ray longer and rotate it
          var alongRayLonger = Vector2.sub(Vector2(0, 0), ray.end, ray.start);
          Vector2.add(alongRayLonger, alongRayLonger, alongRayLonger);
          Vector2.rotate(alongRayLonger, alongRayLonger, 0.5);
          Vector2.add(ray.end, ray.start, alongRayLonger);
          continue;
        }

        crossings += potentials.length;
      }
      //console.log("crossings: " + crossings + " => contained: " + ((crossings & 1) == 1));
      //console.canvas(Drawing2D.canvas([this, ray]));
      //console.log("containsPoint crossings", crossings);
      return (crossings & 1) == 1;
    }
  }, {
    key: 'offsetOf',
    value: function offsetOf(p, returnInvalid) {
      var closestSegmentIndex;
      var closestDistance = Number.POSITIVE_INFINITY;
      var closestOffset;
      var closestInvalidOffset;
      var closestInvalidSegmentIndex;
      var tolerance = 1e-2;

      for (var s = 0; s < this.segments.length; s++) {
        var segment = this.segments[s];
        var closestPoint = segment.closestPointTo(p);
        if (closestPoint) {
          var distance = Vector2.dist(p, closestPoint);

          if (distance < closestDistance) {
            var offset = segment.offsetOf(p);
            if (offset >= -tolerance && offset <= segment.length + tolerance) {
              closestDistance = distance;
              closestSegmentIndex = s;
              closestOffset = offset;
            } else {
              closestInvalidOffset = offset;
              closestInvalidSegmentIndex = s;
            }
          }
        }
      }

      if (closestOffset !== undefined) return closestOffset + this.segmentOffsets[closestSegmentIndex];else if (returnInvalid) return closestInvalidOffset + this.segmentOffsets[closestInvalidSegmentIndex];
    }
  }, {
    key: 'closestPointTo',
    value: function closestPointTo(p, noEndPoints) {
      var closestPoint;
      var closestPointAtEndOfSegment;
      var closestDistance = Number.POSITIVE_INFINITY;
      var closestDistanceFromEndOfSegment = Number.POSITIVE_INFINITY;
      var tolerance = 1e-2;

      for (var s = 0; s < this.segments.length; s++) {
        var segment = this.segments[s];
        var closestPointOnSegment = segment.closestPointTo(p);
        if (closestPointOnSegment) {
          var distance = Vector2.dist(p, closestPointOnSegment);

          if (distance < closestDistance) {
            closestDistanceFromEndOfSegment = distance;
            closestPointAtEndOfSegment = closestPointOnSegment;

            var offset = segment.offsetOf(p);
            if (offset >= -tolerance && offset <= segment.length + tolerance) {
              closestDistance = distance;
              closestPoint = closestPointOnSegment;
            }
          }
        }
      }

      return closestPoint || (noEndPoints ? undefined : closestPointAtEndOfSegment);
    }
  }, {
    key: 'positionOf',
    value: function positionOf(offset) {
      var segmentWithPoint = this.segments[0];
      var segmentWithPointOffset = 0;

      for (var s = 0; s < this.segments.length; s++) {
        if (this.segmentOffsets[s] > offset) break;
        if (this.segmentOffsets[s] < offset) {
          segmentWithPoint = this.segments[s];
          segmentWithPointOffset = this.segmentOffsets[s];
        }
      }

      return segmentWithPoint.positionOf(offset - segmentWithPointOffset);
    }
  }, {
    key: 'directionOf',
    value: function directionOf(offset) {
      var segmentToUse;
      var segmentOffset;

      for (var s = 0; s < this.segments.length; s++) {
        if (this.segmentOffsets[s] > offset) {
          segmentToUse = this.segments[s - 1];
          segmentOffset = this.segmentOffsets[s - 1];
          break;
        }
      }

      if (!segmentToUse) {
        segmentToUse = this.segments[this.segments.length - 1];
        segmentOffset = this.segmentOffsets.last();
      }

      return segmentToUse.directionOf(offset - segmentOffset);
    }
  }, {
    key: 'dump',
    value: function dump() {
      console.log("path dump");
      for (var i = 0; i < this.segments.length; i++) {
        var segment = this.segments[i];
        console.log("\t" + (i + 1) + "/" + this.segments.length, segment.type.typeName, segment.start[0] + ", " + segment.start[1], "to", segment.end[0] + ", " + segment.end[1]);
      }
    }
  }, {
    key: 'vertices',
    value: function vertices(offsetToRight, minPointDistance) {
      var vertices = [];
      var lastVertex;

      for (var s = 0; s < this.segments.length; s++) {
        var segment = this.segments[s];
        var segmentVertices = segment.vertices(offsetToRight);

        for (var v = 0; v < segmentVertices.length; v++) {
          var vertex = segmentVertices[v];

          if (!minPointDistance || !lastVertex || Vector2.dist(lastVertex, vertex) > minPointDistance) vertices.push(vertex);

          lastVertex = vertex;
        }
      }

      if (minPointDistance && this.isClosed) vertices.pop();

      return vertices;
    }
  }, {
    key: 'uvs',
    value: function uvs(offsetToRight, multiplierAlongPath) {
      var uvs = [];

      for (var s = 0; s < this.segments.length; s++) {
        var segment = this.segments[s];
        var segmentOffset = this.segmentOffsets[s];

        uvs = uvs.concat(segment.uvs(offsetToRight, multiplierAlongPath).map(function (uv) {
          uv[0] += segmentOffset * multiplierAlongPath;
          return uv;
        }));
      }

      return uvs;
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      var DEBUG_DRAW_JOINTS = false;
      if (!this.segments.length) return;

      context.stroke(this);

      if (!DEBUG_DRAW_JOINTS) return;
      context.dot(this.segments[0].start);
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.segments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var segment = _step3.value;

          context.dot(segment.end);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: 'isClosed',
    get: function get$$1() {
      // console.log('is closed check', this.segments[0].start, this.segments[this.segments.length - 1].end)
      return this.segments.length > 1 && roughlyEqualVec2(this.segments[0].start, this.segments[this.segments.length - 1].end);
    }
  }, {
    key: 'isCounterClockwise',
    get: function get$$1() {
      return !this.isClockwise;
    }
  }, {
    key: 'isContiguous',
    get: function get$$1() {
      if (this.segments.length < 2) return true;

      for (var i = 0; i < this.segments.length - 1; i++) {
        var a = this.segments[i];
        var b = this.segments[i + 1];
        if (!roughlyEqualVec2(a.end, b.start)) return false;
      }

      return true;
    }
  }, {
    key: 'start',
    get: function get$$1() {
      return this.segments[0].start;
    }
  }, {
    key: 'end',
    get: function get$$1() {
      return this.segments[this.segments.length - 1].end;
    }
  }, {
    key: 'debug',
    get: function get$$1() {
      DebugPaths.add(this, 0x0000ff, "debug", 0, 1);
      return "shown";
    }
  }], [{
    key: 'packedSize',
    value: function packedSize(path) {
      return path.segments.length * 2 * 3 * BinaryTypes.getByteSize("FloatLE");
    }
  }, {
    key: 'pack',
    value: function pack(path, buffer, offset, maxSize) {
      var fSize = BinaryTypes.getByteSize("FloatLE");

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = path.segments[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var segment = _step4.value;

          buffer.writeFloatLE(segment.start[0]);offset += fSize;
          buffer.writeFloatLE(segment.start[1]);offset += fSize;

          buffer.writeFloatLE(segment.direction[0]);offset += fSize;
          buffer.writeFloatLE(segment.direction[1]);offset += fSize;

          buffer.writeFloatLE(segment.end[0]);offset += fSize;
          buffer.writeFloatLE(segment.end[1]);offset += fSize;
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: 'unpack',
    value: function unpack(buffer, offset, size) {
      var nSegments = size / (2 * 3 * BinaryTypes.getByteSize("FloatLE"));
      var segments = new Array(nSegments);
      var fSize = BinaryTypes.getByteSize("FloatLE");

      for (var i = 0; i < nSegments; i++) {
        var startX = buffer.readFloatLE(offset);offset += fSize;
        var startY = buffer.readFloatLE(offset);offset += fSize;
        var directionX = buffer.readFloatLE(offset);offset += fSize;
        var directionY = buffer.readFloatLE(offset);offset += fSize;
        var endX = buffer.readFloatLE(offset);offset += fSize;
        var endY = buffer.readFloatLE(offset);offset += fSize;

        segments[i] = new Curve(Vector2(startX, startY), Vector2(directionX, directionY), Vector2(endX, endY));
      }

      return new Path(segments);
    }
  }]);
  return Path;
}();

function orientation(segments) {
  var sum = 0;
  for (var i = 0; i < segments.length; i++) {
    var segment = segments[i],
        dx = segment.end[0] - segment.start[0],
        dy = segment.end[1] + segment.start[1];
    sum += dx * dy;
  }
  return sum > 0;
}

// Find the boundingBox for an array of segments
var MAX_VALUE = Number.MAX_VALUE;
var MIN_VALUE = Number.MIN_VALUE;
function aabb(segments) {
  var origin = Vector2.fromValues(MAX_VALUE, MAX_VALUE),
      corner$$1 = Vector2.fromValues(MIN_VALUE, MIN_VALUE);
  for (var i = 0; i < segments.length; i++) {
    var segment = segments[i];
    var bb = segment.boundingBox;
    origin[0] = Math.min(origin[0], bb.origin[0]);
    origin[1] = Math.min(origin[1], bb.origin[1]);
    corner$$1[0] = Math.max(corner$$1[0], bb.corner[0]);
    corner$$1[1] = Math.max(corner$$1[1], bb.corner[1]);
  }
  return newRectangleCorner(origin, corner$$1);
}

function Pather$1(start) {
  this.current = start || Vector2.fromValues(0, 0);
  this.direction = null;
  this.segments = [];
  this.orientation = 0;
}

Object.defineProperties(Pather$1.prototype, {
  "name": { value: "Pather" },
  "path": { get: toPath },
  "isClockwise": { get: isClockwise },
  "isCounterClockwise": { get: isCounterClockwise },

  "append": { value: append },
  "moveTo": { value: moveTo },
  "lineTo": { value: lineTo },
  "curveTo": { value: curveTo },
  "close": { value: close },

  "scale": { value: scale$4 },
  "translate": { value: translate$4 }
});

function toPath() {
  return new Path(this.segments, this.isClockwise);
}

function isClockwise() {
  return this.orientation > 0;
}

function isCounterClockwise() {
  return !this.isClockwise;
}

function append(pather) {
  if (!pather.segments.length) return;
  this.segments = this.segments.concat(pather.segments);
  this.current = this.segments[this.segments.length - 1].end;
  this.direction = pather.direction;
  this.orientation += pather.orientation;
  return this;
}

function moveTo(position) {
  this.current = position;
  this.direction = null;
  return this;
}

function lineTo(position) {
  var line = new LineSegment$2(this.current, position);
  this.segments.push(line);
  this.current = line.end;
  this.direction = line.direction;
  updateOrientation(this);
  return this;
}

function curveTo(position, direction) {
  function NoDirection() {
    throw "Direction required if no existing segments";
  }
  var curve = new Curve(this.current, direction || this.direction || NoDirection(), position);
  this.segments.push(curve);
  this.current = curve.end;
  this.direction = curve.endDirection;
  updateOrientation(this);
  return this;
}

function close() {
  if (!this.segments.length) throw "Cannot close an empty path";
  if (this.path.isClosed) return this.path;

  var line = new LineSegment$2(this.current, this.segments[0].start);
  this.segments.push(line);
  this.current = line.end;
  this.direction = line.direction;
  updateOrientation(this);

  // console.log('after closing',this.path.isClosed );

  return this.path;
}

function scale$4(scale) {
  return this.path.scale(scale);
}

function translate$4(offset) {
  return this.path.translate(offset);
}

function updateOrientation(pather) {
  var segment = pather.segments[pather.segments.length - 1],
      dx = segment.end[0] - segment.start[0],
      dy = segment.end[1] + segment.start[1];
  pather.orientation += dx * dy;
}

/* TODO
 * Curves
  1) For curves that are shrinking, only a wavefront that is within its original
    circle can have a collision event with it
  2) For curves that are expanding, all vertices have a potential future event
    with the circle? can we limit this some how to only !acute vertices?
  3) A shrinking curve can collapse in on itself (radius=0)
 * Order the pathways from the center outward, return an array of paths rather than
 *   haphazard segments, building them up from outside in, merging as it intersects
 *
 * Find the center line:
 *  1) Find the longest spoke-tospoke
 *  2) Remove tiny segments
 *  3) Remove the first and last segment
 *  4) Extent the first and last segment to intersect the nearest original edge
 */

var DeadEdge = Symbol("DeadEdge");
var infinity = Infinity;

var StraightSkeleton = function () {
  function StraightSkeleton(path, length, options) {
    var _this = this;

    classCallCheck(this, StraightSkeleton);

    options = options || {};
    this.length = length || infinity;
    this.spokes = [];
    this.waves = [];

    this.DEBUG_DRAW_INITIAL = options.DEBUG_DRAW_INITIAL || false;
    this.DEBUG_DRAW_SKIPPED_EVENTS = options.DEBUG_DRAW_SKIPPED_EVENTS || false;
    this.DEBUG_DRAW_STEPS = options.DEBUG_DRAW_STEPS || false;
    this.DEBUG_DRAW_MOVE = options.DEBUG_DRAW_MOVE || this.DEBUG_DRAW_STEPS;
    this.DEBUG_DRAW_OBTUSE_EVENTS_EACH_STEP = options.DEBUG_DRAW_OBTUSE_EVENTS_EACH_STEP || false;

    if ("capWeight" in options) {
      var startDirection = Vector2.scale(Vector2(0, 0), path.segments[0].direction, -1),
          startNormal = [-startDirection[1], startDirection[0]],
          endDirection = path.segments[path.segments.length - 1].direction,
          endNormal = [-endDirection[1], endDirection[0]];

      var a = Vector2.lerp(Vector2(0, 0), startDirection, startNormal, 1 - options.capWeight);
      var b = Vector2.lerp(Vector2(0, 0), startDirection, startNormal, options.capWeight);
      var c = Vector2.lerp(Vector2(0, 0), endDirection, endNormal, 1 - options.capWeight);
      var d = Vector2.lerp(Vector2(0, 0), endDirection, endNormal, options.capWeight);

      this.caps = [new Ray$2(path.start, [b[1], -b[0]]), new Ray$2(path.start, a), new Ray$2(path.end, [d[1], -d[0]]), new Ray$2(path.end, c)];
    }

    this.wavefronts = create(path, this.length === infinity, this.cap).map(function (each) {
      return new SkeletonWavefront(_this, each, 0).initialise();
    });

    //this.process();
    options.DEBUG ? this.debugprocess() : this.process();
  }

  createClass(StraightSkeleton, [{
    key: 'process',
    value: function process() {
      while (this.wavefronts.length > 0) {
        var wavefront = this.wavefronts[0];
        if (!wavefront.process(this.length)) {
          // if (this.length === infinity) throw "EventsExhaustedPrematurely";
          this.commitWavefront(wavefront);
          wavefront.remove();
        }
      }
    }
  }, {
    key: 'debugprocess',
    value: function debugprocess() {
      while (this.wavefronts.length > 0) {
        var wavefront = this.wavefronts[0];
        if (!wavefront.debugprocess(this.length)) {
          if (this.length === infinity) throw "EventsExhaustedPrematurely";
          this.commitWavefront(wavefront);
          wavefront.remove();
        }
      }
    }
  }, {
    key: 'addWavefront',
    value: function addWavefront(wavefront) {
      this.wavefronts.push(wavefront);
    }
  }, {
    key: 'removeWavefront',
    value: function removeWavefront(wavefront) {
      this.wavefronts.splice(this.wavefronts.indexOf(wavefront), 1);
    }
  }, {
    key: 'commitSkeletonSpoke',
    value: function commitSkeletonSpoke(start, end) {

      this.spokes.push(new LineSegment$2(Vector3.clone(start), Vector3.clone(end)));
    }
  }, {
    key: 'commitSkeletonVertex',
    value: function commitSkeletonVertex(vertex) {

      var beginning = Vector3(vertex.position[0], vertex.position[1], vertex.wavefront.time);
      this.commitSkeletonSpoke(vertex.beginning, beginning);
      vertex.beginning = beginning;
    }
  }, {
    key: 'commitWavefront',
    value: function commitWavefront(wavefront) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = wavefront.root[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var edge = _step.value;

          this.commitSkeletonVertex(edge.start);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (!("caps" in this)) return this.commitFullWavefront(wavefront);

      // Find all the caps
      var caps = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = wavefront.root[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _edge = _step2.value;

          if (_edge.isCap) caps.push(_edge);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      if (caps.length === 0) return this.commitFullWavefront(wavefront);

      // iterate forward, then backward, marking edges as 'dead' until one
      // intersects the cut, which gets split at the cutting point, or another
      // cap is reached
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = caps[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var cap = _step3.value;

          var cut = cap.side === StartCapEdge ? this.caps[0] : this.caps[2];
          var current = cap;
          var dead = [];
          while (true) {
            var intersections = intersect$1(current.segment, cut);
            if (intersections.length !== 0) {
              current.cutsegment = new LineSegment$2(intersections[0].p, (current.cutsegment || current.segment).end);
              break;
            }

            if (!current.isCap) current.side = DeadEdge;
            dead.push(current);

            current = current.next;
            if (current.isCap) break;
          }

          cut = cap.side === EndCapEdge ? this.caps[3] : this.caps[1];
          current = cap;
          dead = [];
          while (true) {
            var _intersections = intersect$1(current.segment, cut);
            if (_intersections.length !== 0) {
              if (current.cutsegment) current.cutreverse = true;
              current.cutsegment = new LineSegment$2((current.cutsegment || current.segment).start, _intersections[0].p);
              break;
            }

            if (!current.isCap) current.side = DeadEdge;
            dead.push(current);

            current = current.previous;
            if (current.isCap) break;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = caps[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _cap = _step4.value;

          if (!_cap.cutsegment) _cap.side = DeadEdge;
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      this.commitFullWavefront(wavefront);
    }
  }, {
    key: 'commitFullWavefront',
    value: function commitFullWavefront(wavefront) {
      var _this2 = this;

      var side = null,
          pather = null,
          segment = null;
      var commit = function commit() {
        if (pather && side !== DeadEdge) _this2.waves.push({ "path": pather.path, "side": side });
      };

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = wavefront.root[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var edge = _step5.value;

          segment = edge.cutsegment || edge.segment;
          if (side !== edge.side) {
            commit();
            side = edge.side;
            pather = new Pather$1();

            if (edge.cutreverse) {
              pather.moveTo(Vector2.clone(edge.start.position));
              pather.lineTo(Vector2.clone(edge.cutsegment.end));
              commit();
              pather = new Pather$1();
              pather.moveTo(Vector2.clone(edge.cutsegment.start));
            } else {
              pather.moveTo(Vector2.clone(segment.start));
            }
          }
          if (edge.cutreverse) {
            pather.lineTo(Vector2.clone(edge.segment.end));
          } else {
            pather.lineTo(Vector2.clone(segment.end));
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      commit();
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = this.wavefronts[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var wavefront = _step6.value;

          wavefront.draw(context);
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.spokes[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var spoke = _step7.value;

          spoke.draw(context);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }, {
    key: 'name',
    get: function get$$1() {
      return "StraightSkeleton";
    }
  }]);
  return StraightSkeleton;
}();

//import * as THREE from 'three';
//require('../missing-stuff/cdt2d');
var cleanPSLG = global.cleanPSLG;
function Shape$1(contourPath, holes) {
  this.contour = contourPath;
  this.holes = holes || [];
}

Object.defineProperties(Shape$1.prototype, {
  "contains": { value: contains },
  "union": { value: union },
  "difference": { value: difference },
  "intersection": { value: intersection },
  "not": { value: not },
  "triangulate": { value: triangulate },
  "area": { value: area },
  "split": { value: split$1 },
  "grow": { value: grow },
  "growWithSkeleton": { value: growWithSkeleton }
});

function contains(otherShape) {
  var intersects = this.contour.intersections(otherShape.contour).length === 0;
  if (intersects) return false;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = otherShape.contour.segments.map(function (s) {
      return s.start;
    })[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var point = _step.value;

      if (!this.contour.containsPoint(point)) return false;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return true;
}

function union(otherShape) {}

function difference(otherShape, clipGrowthOffset) {
  if (otherShape.contains(this)) return [];
  var difference = Clipper.difference(this.contour, otherShape.grow(clipGrowthOffset).contour);
  return difference.map(function (contour) {
    return new Shape$1(contour);
  });
}

function intersection(otherShape) {}

function not(otherShape) {}

function validate(vec) {
  if (isNaN(vec[0]) || isNaN(vec[1])) {
    return false;
  }
  if (!isFinite(vec[0]) || !isFinite(vec[1])) {
    return false;
  }
  return true;
}

function triangulate(segments, borders) {
  var minVertexDistance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.00001;

  var geometry = new THREE.Geometry();

  var points = [];
  var edges = [];

  var vertices = [];

  var count = 0;
  console.error(this.contour.segments.length, 'countours')
  this.contour.segments.forEach(function (_ref, index) {
    var start = _ref.start,
        end = _ref.end;

    if (validate(start) && validate(end)) {
      vertices.push(start, end);
      points.push([start[0], start[1]], [end[0], end[1]]);
      edges.push([count * 2, count * 2 + 1]);
      count++;
    }
  });

  var precision = 3;
  //  preserve z-axis data...
  var zs = {};
  vertices.forEach(function (_ref2) {
    var _ref3 = slicedToArray(_ref2, 3),
        x = _ref3[0],
        y = _ref3[1],
        z = _ref3[2];

    if (z === undefined) {
      z = 0;
    }
    zs[x.toFixed(precision) + '_' + y.toFixed(precision)] = z;
  });

  //  clean up skeleton + contour because it's not a valid edge loop
  cleanPSLG(points, edges, null, false);


  if (segments) {
    var interior = [];
    segments.forEach(function(point, index) {
      var next = segments[index + 1] || segments[0];
      var bestSDistance = Infinity;
      var bestS;
      points.forEach(function(p, j) {
        var d = Math.sqrt(Math.pow(p[0] - point.x, 2) + Math.pow(p[1] - point.y, 2), 2);
        if (d < bestSDistance && d < 5) {
          bestSDistance = d;
          bestS = j;
        }
      })
      var bestEDistance = Infinity;
      var bestE;
      points.forEach(function(p, j) {
        var d = Math.sqrt(Math.pow(p[0] - next.x, 2) + Math.pow(p[1] - next.y, 2), 2);
        if (d < bestEDistance && d < 5) {
          bestEDistance = d;
          bestE = j;
        }
      })
      if (bestS != null && bestE != null) {
        for (var e = 0; e < edges.length; e++) {
          if ((edges[e][0] == bestS && edges[e][1] == bestE) ||
             (edges[e][0] == bestE && edges[e][1] == bestS))
            return
        }
        interior.push([bestS, bestE]);
        edges.push([bestS, bestE]);
      }
    })
    interior = cdt2d(points, interior, { exterior: false, delaunay: true })
  }

  var triangulation = cdt2d(points, edges, { exterior: false, delaunay: true });
  if (interior) {
    triangulation = triangulation.concat(interior)
  }

  var points3D = points.map(function (_ref4) {
    var _ref5 = slicedToArray(_ref4, 2),
        x = _ref5[0],
        y = _ref5[1];

    var key = x.toFixed(precision) + '_' + y.toFixed(precision);
    var z = zs[key];
    if (z === undefined) {
      console.warn('z not found', x, y, zs);
      return [x, y, 0];
    }
    return [x, y, z];
  });

  // console.log( zs, points3D );
  geometry.vertices = points3D.map(function (_ref6) {
    var _ref7 = slicedToArray(_ref6, 3),
        x = _ref7[0],
        y = _ref7[1],
        z = _ref7[2];

    return new THREE.Vector3(x, y, z);
  });

  var edge1 =  new THREE.Vector3();
  var edge2 =  new THREE.Vector3();
  var normal = new THREE.Vector3();
  geometry.faces = []
  triangulation.map(function (_ref8) {
    var _ref9 = slicedToArray(_ref8, 3),
        ix = _ref9[0],
        iy = _ref9[1],
        iz = _ref9[2];

    var vectors = [
       geometry.vertices[ix]
      ,geometry.vertices[iy],
       geometry.vertices[iz]
    ]

    var x = geometry.vertices.push(geometry.vertices[ix].clone()) - 1;
    var y = geometry.vertices.push(geometry.vertices[iy].clone()) - 1;
    var z = geometry.vertices.push(geometry.vertices[iz].clone()) - 1;


      geometry.faces.push(new THREE.Face3(x, y, z));

  })
  //geometry.computeFaceNormals()
  //geometry.computeVertexNormals()
  //THREE.calculateVertexNormals(geometry, 45)
  return geometry;
}

// function triangulate2(minVertexDistance = 0.00001) {
//  var geometry = new THREE.Geometry();

//  const vs = this.contour.vertices(0, minVertexDistance);

//  //  TODO / FIXME
//  //  this is pretty awful, find a more elegant solution...
//  const unique = [];
//  for( let i=0; i<vs.length; i++ ){
//    const vertex = vs[ i ];

//    let found = false;
//    for( let s=0; s<unique.length; s++ ){
//      if( vec3.dist( unique[ s ], vertex ) < minVertexDistance ){
//        found = true;
//        break;
//      }
//    }

//    if( !found ){
//      unique.push( vertex );
//    }
//  }

//  console.log( unique );

//  const vertices = unique.reduce( function( collection, vertex ){
//    const z = vertex[2] !== undefined ? vertex[2] : 0;
//    collection.push( vertex[0], vertex[1], z );
//    return collection;
//  }, [] );

//  // console.log(vertices);

//  var triangulation = earcut( vertices, null, 3 );
//  console.log(triangulation);

//  for (var i = 0; i < triangulation.length; i +=3){
//    const ia = triangulation[ i ] * 3;
//    const ib = triangulation[ i + 1 ] * 3;
//    const ic = triangulation[ i + 2 ] * 3;

//    const va = new THREE.Vector3( vertices[ia], vertices[ia+1], vertices[ia+2] );
//    const vb = new THREE.Vector3( vertices[ib], vertices[ib+1], vertices[ib+2] );
//    const vc = new THREE.Vector3( vertices[ic], vertices[ic+1], vertices[ic+2] );

//    geometry.vertices.push( va, vb, vc );
//    geometry.faces.push( new THREE.Face3( i, i+1, i+2 ) );

//    // console.log( i, va, i+1, vb, i+2, vc );
//  }

//  // console.log( geometry.vertices );

//  return geometry;
// }

function area() {
  var vertices = earcut([this.contour.vertices(0, 1)]);

  var area = 0;
  var side1 = vec2(0, 0);
  var side2 = vec2(0, 0);

  for (var t = 0; t < vertices.length; t += 3) {
    vec2.sub(side1, vertices[t + 1], vertices[t]);
    vec2.sub(side2, vertices[t + 2], vertices[t]);
    area += 0.5 * Math.abs(vec2.crossz(side1, side2));
  }

  return area;
}

function split$1(splittingBiRay) {
  // TODO faking it by intersecting the shape with two really large boxes on either side of the biray
  // TODO doesn't handle split resulting in more than 2 shapes
  var boxSize = 1000;
  var perpendicularDirection = vec2.perpendicular(vec2(0, 0), splittingBiRay.direction);

  var box1 = new Pather().lineTo(splittingBiRay.direction).lineTo(vec2.add(vec2(0, 0), splittingBiRay.direction, perpendicularDirection)).lineTo(vec2.sub(vec2(0, 0), perpendicularDirection, splittingBiRay.direction)).lineTo(vec2.negate(vec2(0, 0), splittingBiRay.direction)).close().scale(boxSize).translate(splittingBiRay.middle);

  var box2 = box1.translate(vec2.scale(vec2(0, 0), perpendicularDirection, -boxSize));

  var results = [Clipper.intersection(this.contour, box1)[0], Clipper.intersection(this.contour, box2)[0]].filter(function (c) {
    return c;
  }).map(function (c) {
    return new Shape$1(c);
  });

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = results[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var shape = _step2.value;

      if (!shape.contour.isClosed) {
        DebugPaths.add(box1, 0x00ff00, "splitfail", 0, 2);
        DebugPaths.add(this.contour, 0x00ffff, "splitfail", 0, 4);
        DebugPaths.add(shape.contour, 0xff00ff, "splitfail", 0, 4);
        throw "splitfail";
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return results;
}

function grow(amount) {

  //var offsetContour = this.contour.offsetPerpendicular(this.contour.isCounterClockwise ? amount : -amount);
  //DebugPaths.add(offsetContour, 0xffffff, "grow", 0, 1);
  //offsetContour = offsetContour.makeContiguous(true);
  //DebugPaths.add(offsetContour, 0x888888, "grow", 0, 1.5);
  //offsetContour = offsetContour.simplifySelfIntersections();
  //DebugPaths.add(offsetContour, 0x8800ff, "grow", 0, 2);
  return new Shape$1(offsetContour);
}

function growWithSkeleton(amount) {
  var skeleton = new Skeleton(amount > 0 ? this.contour : this.contour.reverse(), Math.abs(amount));
  return new Shape$1(skeleton.waves[0].path);
}

// require("babel-core/register")({
//  blacklist: ['regenerator', 'es6.forOf'],
//  optional: ['es7.classProperties']
// });

// import Clipper from './es6/clipper/clipper';
// import Intersections from './es6/intersections/Intersections';
// import PathCollisionCollection from './es6/shapes/PathCollisionCollection';

//import * as BabelPolyfill from 'babel-polyfill';

// import Circle from './es6/primitives/Circle';
// import Curve from './es6/primitives/Curve';
// import Line from './es6/primitives/Line';
// import LineSegment from './es6/primitives/LineSegment';
// import Ray from './es6/primitives/Ray';
// import Rectangle from './es6/primitives/Rectangle';
// import Triangle from './es6/primitives/Triangle';
// import Stroke from './es6/shapes/Stroke';

var out = global.CompGeo = {
  Skeleton: StraightSkeleton,
  shapes: {
    Path: Path, Pather: Pather$1, Shape: Shape$1
  }
};

module.exports = out;

// module.exports = {
//  Clipper: require('./es6/clipper/Clipper'),
//  Intersections: require('./es6/intersections/Intersections').default,
//  PathCollisionCollection: require('./es6/shapes/PathCollisionCollection'),
//  Skeleton: require('./es6/skeleton/Skeleton').default,
//  primitives: {
//    Circle: require('./es6/primitives/Circle'),
//    Curve: require('./es6/primitives/Curve'),
//    Line: require('./es6/primitives/Line'),
//    LineSegment: require('./es6/primitives/LineSegment'),
//    Ray: require('./es6/primitives/Ray'),
//    Rectangle: require('./es6/primitives/Rectangle'),
//    Triangle: require('./es6/primitives/Triangle')
//  },
//  shapes: {
//    Path: require('./es6/shapes/Path').default,
//    Pather: require('./es6/helpers/Pather').default,
//    Shape: require('./es6/shapes/Shape').default,
//    Stroke: require('./es6/shapes/Stroke').default
//  },
//  Drawing2D: require('./es6/drawing/Drawing2D')
// };


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);

