// Require dependencies
const fs         = require('fs-extra');
const os         = require('os');
const glob       = require('glob-all');
const gulp       = require('gulp');
const path       = require('path');
const buffer     = require('vinyl-buffer');
const source     = require('vinyl-source-stream');
const header     = require('gulp-header');
const babel      = require('@babel/core');
const uglify     = require('gulp-uglify-es').default;
const babelify   = require('babelify');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('browserify');

// Globally require babel plugins (i wish eslint would thank me too)
const babelPresets = {
  presetEnv : require('@babel/preset-env'), // eslint-disable-line global-require
};

const babelPlugins = {
  arrayIncludes    : require('babel-plugin-array-includes'), // eslint-disable-line global-require
  transformClasses : require('@babel/plugin-transform-classes'), // eslint-disable-line global-require
  transformAsync   : require('@babel/plugin-transform-async-to-generator'), // eslint-disable-line global-require
  transformRuntime : require('@babel/plugin-transform-runtime'), // eslint-disable-line global-require
};

// Require local dependencies
const config = require('config');

/**
 * Create Javascript Task class
 *
 * @task javascript
 */
class JavascriptTask {
  /**
   * Construct Javascript Task class
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
   * Run javascript task
   *
   * @return {Promise}
   */
  run() {
    // create sync
    const sync = [
      `${global.edenRoot}/node_modules/*/bundles/*/public/js/bootstrap.js`,
      `${global.edenRoot}/node_modules/*/*/bundles/*/public/js/bootstrap.js`,
    ];

    // loop modules
    for (const mod of (config.get('modules') || [])) {
      // add module
      sync.push(`${mod}/bundles/*/public/js/bootstrap.js`);
      sync.push(`${mod}/node_modules/*/bundles/*/public/js/bootstrap.js`);
      sync.push(`${mod}/node_modules/*/*/bundles/*/public/js/bootstrap.js`);
    }

    // Create javascript array
    const entries = glob.sync(sync);

    // Build vendor prepend
    const js = config.get('js');
    let head = '';

    // Loop javascript
    (js || []).forEach((file) => {
      if (fs.existsSync(path.join(global.edenRoot, file))) {
        head += fs.readFileSync(path.join(global.edenRoot, file), 'utf8') + os.EOL;
      } else {
        head += fs.readFileSync(path.join(global.appRoot, 'bundles', file), 'utf8') + os.EOL;
      }
    });

    // Setup paths
    const moduleRoots = (config.get('modules') || []).map(mod => `${mod}/node_modules`);
    const daemonRoots = fs.existsSync(`${global.appRoot}/data/cache/daemon.roots.json`) ? require(`${global.appRoot}/data/cache/daemon.roots.json`) : []; // eslint-disable-line global-require, import/no-dynamic-require
    const controllerRoots = fs.existsSync(`${global.appRoot}/data/cache/controller.roots.json`) ? require(`${global.appRoot}/data/cache/controller.roots.json`) : []; // eslint-disable-line global-require, import/no-dynamic-require

    // Browserify javascript
    let job = browserify({
      paths : [
        `${global.appRoot}/data`,

        ...moduleRoots,
        ...daemonRoots,
        ...controllerRoots,

        // EdenJS modules
        `${global.edenRoot}/node_modules`,

        // App modules
        `${global.appRoot}/node_modules`,
        // App modules (legacy format)
        `${global.appRoot}/bundles/node_modules`,

        // App bundles
        `${global.appRoot}/bundles`,
      ],
      debug         : true,
      entries,
      ignoreGlobals : true,
    })
      .transform(babelify, {
        presets : [
          babel.createConfigItem([babelPresets.presetEnv, {
            useBuiltIns : 'entry',
            targets     : {
              browsers : ['> 1%', 'last 2 versions', 'not ie <= 8'],
            },
          }]),
        ],
        plugins : [
          babel.createConfigItem(babelPlugins.arrayIncludes),
          babel.createConfigItem(babelPlugins.transformClasses),
          babel.createConfigItem(babelPlugins.transformAsync),
          babel.createConfigItem([babelPlugins.transformRuntime, {
            helpers      : false,
            regenerators : true,
          }]),
        ],
      })
      .bundle()
      .pipe(source('app.min.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps : true,
      }))
      .pipe(header(head));

    // Only minify in live
    if (['live', 'production'].includes(config.get('environment'))) {
      // Pipe uglify
      job = job.pipe(uglify({
        ie8    : false,
        mangle : true,
        output : {
          comments : false,
        },
        compress : true,
      }));
    }

    // Pipe job
    job = job.pipe(sourcemaps.write(`${global.appRoot}/data/www/public/js`))
      .pipe(gulp.dest(`${global.appRoot}/data/www/public/js`))
      .on('end', () => {
        // Restart server
        this._runner.restart();
      });

    // Return job
    return job;
  }

  /**
   * Watch task
   *
   * @return {String[]}
   */
  watch() {
    // Return files
    return [
      'public/js/**/*.js',
    ];
  }
}

/**
 * Export Javascript Task class
 *
 * @type {JavascriptTask}
 */
module.exports = JavascriptTask;
