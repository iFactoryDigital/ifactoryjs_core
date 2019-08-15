
// require dependencies
const Events = require('events');
const socket = require('socket/public/js/bootstrap');

/**
 * extend agas
 *
 * @extends Events
 */
class EdenBootstrap extends Events {
  /**
   * construct agas bootstrap
   */
  constructor() {
    // super
    super();

    // build agas
    this.build = this.build.bind(this);

    // build
    this.building = this.build();
  }

  /**
   * build agas
   *
   * @return {*}
   */
  build() {
    // on scss
    socket.on('dev:scss', (type) => {
      // check reload
      if (type === 'reload') {
        // set query string
        const queryString = '?reload=' + new Date().getTime();

        // reload stylesheets
        jQuery('link[rel="stylesheet"]').each(function () {
          this.href = this.href.replace(/\?.*|$/, queryString);
        });
      }
    });

    // on scss
    socket.on('dev:page', (type) => {
      // check reload
      if (type === 'reload') {
        // set query string
        window.location.reload();
      }
    });
  }
}

/**
 * export bootstrap
 *
 * @type {AgasBootstrap}
 */
exports = new EdenBootstrap();