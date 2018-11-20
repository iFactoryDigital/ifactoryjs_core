
// Require live model
const FEModel = require('model/public/js/model');

// Create mixin
riot.mixin('model', {
  /**
   * On init function
   */
  init() {
    // Set live models
    this.__model = [];

    // Let kill
    const killAll = () => {
      // Kill all models
      this.__model.forEach((model) => {
        // Destroy
        model.destroy();
      });
    };

    // On unmount
    this.on('deafen', killAll);
    this.on('unmount', killAll);
  },

  /**
   * Creates live model
   *
   * @param  {String} type
   * @param  {Object} object
   *
   * @return {FEModel}
   */
  model(type, object) {
    // Create model
    const Model = new FEModel(type, object);

    // Push new live model
    this.__model.push(Model);

    // On update
    Model.on('update', this.update);

    // Return model
    return Model;
  },
});
