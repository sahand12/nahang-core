const {EventEmitter} = require('events');
let eventRegistryInstance;

class EventRegistry extends EventEmitter {

  /**
   * Registers a handler for a number of events
   *
   * @param {Array} arr - Array of eventNames
   * @param {Function} onEvent - Event handler function
   */
  onMany(arr, onEvent) {
    arr.forEach(eventName => this.on(eventName, onEvent));
  }
}

eventRegistryInstance = new EventRegistry();
eventRegistryInstance.setMaxListeners(100);

module.exports = eventRegistryInstance;
