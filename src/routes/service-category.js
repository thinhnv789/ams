var express = require('express');
var router = express.Router();
var ServiceCategoryController = require('../controllers/ServiceCategory');


/**
 * API keys and Passport configuration.
 */
const passport = require('../middleware/passport');

/* get all categories. */
router.get('/', passport.isAuthenticated, ServiceCategoryController.getIndex);
router.get('/create', passport.isAuthenticated, ServiceCategoryController.getCreate);
router.post('/create', passport.isAuthenticated, ServiceCategoryController.postCreate);
router.get('/edit/:categoryId', passport.isAuthenticated, ServiceCategoryController.getEdit);
router.post('/update/:categoryId', passport.isAuthenticated, ServiceCategoryController.postUpdate);
router.get('/delete/:categoryId', passport.isAuthenticated, ServiceCategoryController.getDelete)

module.exports = router;
