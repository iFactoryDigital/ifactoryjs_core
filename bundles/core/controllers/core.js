
// Require local class dependencies
const Controller = require('controller');

/**
 * Create Core Controller class
 */
class CoreController extends Controller {

  /**
   * Construct Home Controller class
   */
  constructor () {
    // Run super
    super();

    // Bind public methods
    this.homeAction = this.homeAction.bind(this);
  }

  /**
   * Index action
   *
   * @param    {Request}  req
   * @param    {Response} res
   *
   * @name     HOME
   * @route    {get} /
   * @menu     {MAIN} Home
   * @priority 1
   */
  indexAction (req, res) {
    // Render home page
    res.render('home');
  }

}

/**
 * Export Core Controller class
 *
 * @type {CoreController}
 */
exports = module.exports = CoreController;
