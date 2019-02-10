
// Require live model
const EdenModel = require('model/public/js/model');

// Create mixin
riot.mixin('model', {
  /**
   * On init function
   */
  init() {

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
    if (!this.eden.frontend) {
      // create model
      const model = new EdenModel(type, object.id, object);

      // Return model
      return model;
    }

    // return model
    const model = window.eden.model.get(type, object.id, object);

    // On update
    model.on('update', this.update);

    // Return model
    return model;
  },
});
