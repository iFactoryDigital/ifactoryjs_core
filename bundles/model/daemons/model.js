// Require daemon
const Daemon = require('daemon');

// Require helpers
const socket = helper('socket');

/**
 * Create live daemon
 *
 * @cluster back
 * @cluster model
 *
 * @extends daemon
 */
class ModelDaemon extends Daemon {
  /**
   * Constructor
   */
  constructor(...args) {
    // Run arguments
    super(...args);

    // Bind build
    this.build = this.build.bind(this);
    this.models = new Map();

    // Bind private methods
    this._save = this._save.bind(this);
    this._deafen = this._deafen.bind(this);
    this._listen = this._listen.bind(this);
    this._collect = this._collect.bind(this);

    // Bind building
    this.building = this.build();
  }

  /**
   * Build live daemon
   */
  build() {
    // Add endpoint for listen
    this.eden.endpoint('model.listen', this._listen);
    this.eden.endpoint('model.deafen', this._deafen);
    this.eden.endpoint('model.listen', this._listen, true);
    this.eden.endpoint('model.deafen', this._deafen, true);

    // Add listeners for events
    this.eden.on('model.save', this._save, true);

    // Set interval for garbage collection
    setInterval(this._collect, 30 * 1000);
  }

  /**
   * On model save
   * @param  {Object}  opts
   */
  async _save(opts) {
    // Check models has
    if (!this.models.has(opts.model)) return;

    // check updates
    opts.updates = opts.updates.filter((key) => {
      // check key
      return !['created_at', 'updated_at'].includes(key);
    });

    // don't emit if not required
    if (!opts.updates.length) return;

    // Get cache
    const listeners = await this.eden.get(`model.listen.${opts.model.toLowerCase()}.${opts.id}`) || [];

    // Check length
    if (!listeners.length) return;

    // Log to eden
    this.logger.log('debug', `Sending live response on ${opts.model.toLowerCase()} #${opts.id}`, {
      class : this.constructor.name,
    });

    // Get model
    const Model = model(opts.model);

    // Load by id
    const foundModel = await Model.findById(opts.id);

    // Emit sanitised
    const sent      = [];
    const atomic    = {};
    const sanitised = await foundModel.sanitise();

    // emit only updates
    Object.keys(sanitised).forEach((key) => {
      // remove key if not in updated
      if (opts.updates.includes(key)) atomic[key] = sanitised[key];
    });

    // Loop listeners
    listeners.forEach((listener) => {
      // check atomic
      if (sent.includes(listener.session)) return;

      // send atomic update
      socket.session(listener.session, `model.update.${opts.model.toLowerCase()}.${opts.id}`, listener.atomic ? atomic : sanitised);

      // Push to sent
      sent.push(listener.session);
    });
  }

  /**
   * Listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   */
  async _deafen(sessionID, type, id, listenID) {
    // Set model
    if (!this.models.has(type)) this.models.set(type, true);

    // Log to eden
    this.logger.log('debug', `removing model listener on ${type} #${id} for ${sessionID}`, {
      class : 'ModelDaemon',
    });

    // Lock listen
    const unlock = await this.eden.lock(`model.listen.${type}.${id}`);

    // Set cache
    let listeners = await this.eden.get(`model.listen.${type}.${id}`) || [];

    // Add sessionID to listeners
    listeners = listeners.filter((listener) => {
      // Return filtered
      return listener.uuid !== listenID;
    });

    // Set to eden again
    await this.eden.set(`model.listen.${type}.${id}`, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }

  /**
   * Listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   * @param  {Boolean} atomic
   */
  async _listen(sessionID, type, id, listenID, atomic = false) {
    // Set model
    if (!this.models.has(type)) this.models.set(type, true);

    // Log to eden
    this.logger.log('debug', `adding model listener on ${type} #${id} for ${sessionID}`, {
      class : 'ModelDaemon',
    });

    // Lock listen
    const unlock = await this.eden.lock(`model.listen.${type}.${id}`);

    // Set cache
    const listeners = await this.eden.get(`model.listen.${type}.${id}`) || [];

    // Check found
    const found = listeners.find((listener) => {
      // Return filtered
      return listener.session === sessionID && listener.uuid === listenID;
    });

    // Add sessionID to listeners
    if (found) {
      // Update date
      found.last = new Date();
    } else {
      // Push listener
      listeners.push({
        atomic,
        uuid    : listenID,
        last    : new Date(),
        session : sessionID,
      });
    }

    // Set to eden again
    await this.eden.set(`model.listen.${type}.${id}`, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }

  /**
   * Removes all listeners
   */
  _collect() {

  }
}

/**
 * Build live daemon class
 *
 * @type {ModelDaemon}
 */
module.exports = ModelDaemon;
