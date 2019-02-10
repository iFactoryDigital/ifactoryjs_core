// Require dependencies
const uuid    = require('uuid');
const Events  = require('events');
const dotProp = require('dot-prop');

/**
 * Create live model class
 *
 * @extends events
 */
class EdenModel extends Events {
  /**
   * Construct model class
   *
   * @param {String} type
   * @param {String} id
   * @param {Object} object
   */
  constructor(type, id, opts) {
    // Run super
    super();

    // Set id
    this.__id = id;
    this.__data = opts;
    this.__type = type;
    this.__queue = [];

    // Bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.build = this.build.bind(this);
    this.listen = this.listen.bind(this);
    this.setOpts = this.setOpts.bind(this);
    this.refresh = this.refresh.bind(this);
    this.destroy = this.destroy.bind(this);

    // Bind private methods
    this._update = this._update.bind(this);
    this._connect = this._connect.bind(this);

    // Build
    if (typeof eden !== 'undefined') this.building = this.build();
  }

  /**
   * Returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get(key) {
    // Check key
    if (!key || !key.length) return this.__data;

    // Return this key
    return dotProp.get(this.__data, key);
  }

  /**
   * Returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  set(key, value) {
    // Return this key
    this.__data = dotProp.set(this.__data, key, value);

    // emit key
    this.emit(key);

    // emit base key
    if (key !== key.split('.')[0]) this.emit(key.split('.')[0]);

    // return get key
    return this.get(key);
  }

  /**
   * sets opts
   *
   * @param {Object} opts
   */
  setOpts(opts) {
    // loop keys
    for (let key in opts) {
      // check value matches
      if (this.__data[key] !== opts[key]) {
        // set value
        this.set(key, opts[key]);
      }
    }
  }

  /**
   * Builds this
   */
  async build() {
    // Listen
    await this.listen();
  }

  /**
   * Listens to model by id
   *
   * @return {Promise}
   */
  async destroy() {
    // Await building
    await this.building;

    // Check listening
    await Promise.all(this.__queue);

    // Check loading
    if (!this.__isListening) return null;

    // Create new promise
    const promise = new Promise(async (resolve) => {
      // Call eden
      await eden.socket.call(`model.deafen.${this.__type}`, this.__id, this.__uuid);

      // Set listen
      this.__isListening = false;

      // Add on event
      eden.socket.off(`model.update.${this.__type}.${this.__id}`, this._update);

      // Listen to connect again
      eden.socket.off('connect', this._connect);
      eden.socket.off('connected', this._connect);

      // Resolve
      resolve();
    });

    // Add to queue
    this.__queue.push(promise);

    // Return await deafening
    return await promise;
  }

  /**
   * Refreshes this
   */
  async refresh() {
    // Await building
    await this.building;

    // Call eden
    const object = await eden.socket.call(`model.refresh.${this.__type}`, this.__id);

    // Run update
    this._update(object);
  }

  /**
   * Listens to model by id
   *
   * @return {Promise}
   */
  async listen() {
    // Await building
    await this.building;

    // check id
    if (!this.__id) return null;

    // Check listening
    await Promise.all(this.__queue);

    // Check loading
    if (this.__isListening) return null;

    // Set uuid
    if (!this.__uuid) this.__uuid = uuid();

    // Create new promise
    const promise = new Promise(async (resolve) => {
      // Call eden
      await eden.socket.call(`model.listen.${this.__type}`, this.__id, this.__uuid);

      // Set listen
      this.__isListening = true;

      // Add on event
      eden.socket.on(`model.update.${this.__type}.${this.__id}`, this._update);

      // Listen to connect again
      eden.socket.on('connect', this._connect);
      eden.socket.on('connected', this._connect);

      // Resolve
      resolve();
    });

    // Add to queue
    this.__queue.push(promise);

    // Return listening promise
    return await promise;
  }

  /**
   * On update
   *
   * @param  {Object} object
   */
  _update(object) {
    // Update details
    for (const key of Object.keys(object)) {
      // Check differences
      if (this.__data[key] !== object[key]) {
        // Listen to object key
        this.__data[key] = object[key];

        // Emit event
        this.emit(key, object[key]);
      }
    }

    // Emit update
    this.emit('update');
  }

  /**
   * On socket reconnect
   */
  _connect() {
    // Reconnected
    if (this.__isListening) {
      // Call live listen again
      eden.socket.call(`model.listen.${this.__type}`, this.__id, this.__uuid);
    }
  }
}

/**
 * Export live model class
 *
 * @type {EdenModel}
 */
module.exports = EdenModel;
