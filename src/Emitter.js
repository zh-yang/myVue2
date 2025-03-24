function Emitter(object) {
	if (object) {
		return mixin(object);
	}

	this._callbacks = new Map();
}

function mixin(object) {
	Object.assign(object, Emitter.prototype);
	object._callbacks = new Map();
	return object;
}

Emitter.prototype.on = function (event, listener) {
	var callbacks = this._callbacks.get(event) || [];
	callbacks.push(listener);
	this._callbacks.set(event, callbacks);
	return this;
};

Emitter.prototype.once = function (event, listener) {
	var on = function (){
		this.off(event, on);
		listener.apply(this, arguments);
	}.bind(this);

	on.fn = listener;
	this.on(event, on);
	return this;
};

Emitter.prototype.off = function (event, listener) {
	if (event === undefined && listener === undefined) {
		this._callbacks.clear();
		return this;
	}

	if (listener === undefined) {
		this._callbacks.delete(event);
		return this;
	}

	var callbacks = this._callbacks.get(event);
	if (callbacks) {
        var entries = callbacks.entries()
		for (var key in entries) {
            var index = entries[key].index,
                callback = entries[key].callback;
			if (callback === listener || callback.fn === listener) {
				callbacks.splice(index, 1);
				break;
			}
		}

		if (callbacks.length === 0) {
			this._callbacks.delete(event);
		} else {
			this._callbacks.set(event, callbacks);
		}
	}

	return this;
};

Emitter.prototype.emit = function (event) {
	var callbacks = this._callbacks.get(event);
	if (callbacks) {
		// Create a copy of the callbacks array to avoid issues if it's modified during iteration
		var callbacksCopy = callbacks.slice();

		for (var key in callbacksCopy) {
			callbacksCopy[key].apply(this, [].slice.call(arguments, 1));
		}
	}

	return this;
};

Emitter.prototype.listeners = function (event) {
	return this._callbacks.get(event) || [];
};

Emitter.prototype.listenerCount = function (event) {
	if (event) {
		return this.listeners(event).length;
	}

	var totalCount = 0;
    var values = this._callbacks.values();
	for (var key in values) {
		totalCount += values[key].length;
	}

	return totalCount;
};

Emitter.prototype.hasListeners = function (event) {
	return this.listenerCount(event) > 0;
};

// Aliases
Emitter.prototype.addEventListener = Emitter.prototype.on;
Emitter.prototype.removeListener = Emitter.prototype.off;
Emitter.prototype.removeEventListener = Emitter.prototype.off;
Emitter.prototype.removeAllListeners = Emitter.prototype.off;

if (typeof module !== 'undefined') {
	module.exports = Emitter;
}