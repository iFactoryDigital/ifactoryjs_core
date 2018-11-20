// Require dependencies
const fs         = require('fs-extra');
const os         = require('os');
const sass       = require('gulp-sass');
const path       = require('path');
const gulp       = require('gulp');
const rename     = require('gulp-rename');
const prefix     = require('gulp-autoprefixer');
const through    = require('through2');
const sourcemaps = require('gulp-sourcemaps');

// Require local dependencies
const config = require('config');

function customImporter(url) {
  if (url[0] !== '~') {
    return null;
  }

  const edenPath = path.resolve(global.edenRoot, 'node_modules', url.substr(1));

  if (fs.existsSync(path.dirname(edenPath))) {
    return { file : edenPath };
  }

  const appPath = path.resolve(global.appRoot, 'node_modules', url.substr(1));

  if (fs.existsSync(path.dirname(appPath))) {
    return { file : appPath };
  }

  return null;
}

/**
 * Create SASS Task class
 *
 * @task sass
 */
class SASSTask {
  /**
   * Construct SASS Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);

    // Bind private methods
    this._tmp = this._tmp.bind(this);
  }

  /**
   * Run sass task
   *
   * @returns {Promise}
   */
  run() {
    // Return new promise
    return new Promise((resolve, reject) => {
      // Run tmp
      this._tmp().then(() => {
        // Run gulp task
        gulp.src(`${global.appRoot}/data/cache/tmp.scss`)
          .pipe(sourcemaps.init())
          .pipe(sass({
            importer    : customImporter,
            outputStyle : 'compressed',
          }))
          .pipe(prefix({
            browsers : [
              'last 2 versions',
            ],
          }))
          .pipe(rename('app.min.css'))
          .pipe(sourcemaps.write(`${global.appRoot}/data/www/public/css`))
          .pipe(gulp.dest(`${global.appRoot}/data/www/public/css`))
          .on('end', resolve)
          .on('error', (err) => {
            // Reject promise
            reject(err);
          });
      });
    });
  }

  /**
   * Builds temporary scss file
   *
   * @returns {Promise}
   *
   * @private
   */
  _tmp() {
    // Set variables
    let all = '';

    // Grab gulp source for sass. Create local variables array for sass files
    let sassFiles = this._runner.files('public/scss/variables.scss');

    // Load sass
    const configSass = config.get('sass');

    // Loop config sass files
    if (configSass) {
      for (let i = 0; i < configSass.length; i += 1) {
        sassFiles.push(path.join(global.edenRoot, configSass[i]));
        sassFiles.push(path.join(global.appRoot, configSass[i]));
      }
    }

    // Push local bootstrap files
    sassFiles = sassFiles.concat(this._runner.files('public/scss/bootstrap.scss'));

    // Run gulp
    return new Promise((resolve, reject) => {
      // Run gulp on sass files
      gulp.src(sassFiles)
        .pipe(through.obj(function thru(chunk, enc, cb) {
          // Run through callback
          let type = chunk.path.split('.');

          // Update type
          type = type[type.length - 1];

          // Check type
          if (type === 'css') {
            // Prepend
            const prepend = fs.readFileSync(chunk.path, 'utf8');

            // Push to this
            this.push({
              all : prepend + os.EOL,
            });
          } else {
            // Push to this
            this.push({
              all : `@import "${chunk.path}";${os.EOL}`,
            });
          }

          // Run callback
          cb(null, chunk);
        }))
        .on('data', (data) => {
          if (data.all) {
            all += data.all;
          }
        })
        .on('end', () => {
          // Write temp sass file
          fs.writeFileSync(`${global.appRoot}/data/cache/tmp.scss`, all);

          // Resolve
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return 'public/scss/**/*.scss';
  }
}

/**
 * Export SASS Task class
 *
 * @type {SASSTask}
 */
module.exports = SASSTask;
