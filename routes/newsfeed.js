const express = require('express');
const router = express.Router();

const { 
    getNewsfeedList,
    getSingleNewsfeed,
    getNewsfeeds,
    newNewsfeed,
    updateNewsfeed,
    deleteNewsfeed,
    getNewsfeedListPublic,
    getSingleNewsfeedPublic
} = require('../controllers/newsfeedController');

const { isAuthenticatedUser,authorizeRoles } = require('../middlewares/auth');

router.route('/newsfeed').get(isAuthenticatedUser, getNewsfeedList);
router.route('/newsfeed/:id').get(isAuthenticatedUser, getSingleNewsfeed);
router.route('/public/newsfeed').get(getNewsfeedListPublic);
router.route('/public/newsfeed/:id').get(getSingleNewsfeedPublic);

// Admin
router.route('/admin/newsfeeds').get(isAuthenticatedUser, getNewsfeeds);
router.route('/admin/newsfeed/new').post(isAuthenticatedUser, authorizeRoles('administrator'), newNewsfeed);
router.route('/admin/newsfeed/:id').put(isAuthenticatedUser, authorizeRoles('administrator'), updateNewsfeed);
router.route('/admin/newsfeed/:id').delete(isAuthenticatedUser, authorizeRoles('administrator'), deleteNewsfeed);

module.exports = router;