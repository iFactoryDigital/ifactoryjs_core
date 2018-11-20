// Require dependencies
const glob = require('glob');
const path = require('path');

/**
 * Create Models Task class
 *
 * @task models
 */
class ModelsTask {
  /**
   * Construct Models Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   *
   * @returns {Promise}
   */
  run(files) {
    // Return promise
    return new Promise((resolve) => {
      // Grab model files
      let Models = [];

      for (let i = 0; i < files.length; i += 1) {
        Models = Models.concat(glob.sync(files[i]));
      }

      // Loop models
      const models = {};

      for (const model of Models) {
        const modelPath = path.relative(`${global.appRoot}/bundles`, model);

        // Not relative to app, must be in eden
        if (modelPath.split(path.sep)[0] === '..') {
          models[path.basename(model).split('.')[0].toLowerCase()] = path.relative(global.edenRoot, model);
        } else {
          models[path.basename(model).split('.')[0].toLowerCase()] = modelPath;
        }
      }

      // Write models cache file
      this._runner.write('models', models);

      // Restart server
      this._runner.restart();

      // Resolve
      resolve(true);
    });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return [
      'models/**/*.js',
    ];
  }
}

/**
 * Export Models Task class
 *
 * @type {ModelsTask}
 */
module.exports = ModelsTask;
