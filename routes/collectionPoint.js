const express = require('express');
const router = express.Router();

const { 
    getLandingPageTodayCollectionPointList,
    getTodayCollectionPointList,
    getUpcomingCollectionPointList,
    getSingleCollectionPoint,
    getCollectors,
    getCollectionPoints,
    newCollectionPoint,
    updateCollectionPoint,
    deleteCollectionPoint,
    addCollectionnumOfTruck,
    liveMapNotification
} = require('../controllers/collectionPointController');

const { isAuthenticatedUser,authorizeRoles } = require('../middlewares/auth');

router.route('/collectionPoint/landingPage/today').get(getLandingPageTodayCollectionPointList);

router.route('/collectionPoint/today').get(isAuthenticatedUser, getTodayCollectionPointList);
router.route('/collectionPoint/upcoming').get(isAuthenticatedUser, getUpcomingCollectionPointList);
router.route('/collectionPoint/:id').get(isAuthenticatedUser, getSingleCollectionPoint);
router.route('/collectionPoint/live-notification/:id').put(isAuthenticatedUser, liveMapNotification);

router.route('/collectionPoint/num-of-truck/:id').put(isAuthenticatedUser, authorizeRoles('administrator', 'garbageCollector'), addCollectionnumOfTruck);

// Admin
router.route('/admin/collectionPoint/collectors').get(isAuthenticatedUser, authorizeRoles('administrator','barangayAdministrator'), getCollectors);
router.route('/admin/collectionPoints').get(isAuthenticatedUser, authorizeRoles('administrator'), getCollectionPoints);
router.route('/admin/collectionPoint/new').post(isAuthenticatedUser, authorizeRoles('administrator'), newCollectionPoint);
router.route('/admin/collectionPoint/:id').put(isAuthenticatedUser, authorizeRoles('administrator'), updateCollectionPoint);
router.route('/admin/collectionPoint/:id').delete(isAuthenticatedUser, authorizeRoles('administrator'), deleteCollectionPoint);


module.exports = router;