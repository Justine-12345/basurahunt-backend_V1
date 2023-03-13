const express = require('express');
const router = express.Router();

const{
	getCleanedDumps,
	getDonatedItems,
	getUncleanedDumps,
	getTotalUsers,
	getTotalDumps,
	getTotalDonations,
	getCollectionPerTruck,
	getCollectionPoints,
	getReportsPerCategory,
	getDonationsPerCategory,
	getTopUserDonation,
	getTopUserReport
} = require(`../controllers/dashboardController`);

const { isAuthenticatedUser,authorizeRoles } = require('../middlewares/auth');

router.route(`/dashboard/cleanedDumps`).post(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator'),getCleanedDumps);
router.route(`/dashboard/donatedItems`).post(isAuthenticatedUser, authorizeRoles('administrator'),getDonatedItems);
router.route(`/dashboard/uncleanedDumps`).post(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator'),getUncleanedDumps);
router.route(`/dashboard/collection-per-truck`).post(isAuthenticatedUser, authorizeRoles('administrator'),getCollectionPerTruck);
router.route(`/dashboard/collectionPoints`).post(isAuthenticatedUser, authorizeRoles('administrator'),getCollectionPoints);

router.route(`/dashboard/totalUsers`).get(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator'),getTotalUsers);
router.route(`/dashboard/totalDumps`).get(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator'),getTotalDumps);
router.route(`/dashboard/totalDonations`).get(isAuthenticatedUser, authorizeRoles('administrator'),getTotalDonations);

router.route(`/dashboard/reportsPerCategory`).post(isAuthenticatedUser, authorizeRoles('administrator','barangayAdministrator'), getReportsPerCategory);
router.route(`/dashboard/donationsPerCategory`).post(isAuthenticatedUser, authorizeRoles('administrator'), getDonationsPerCategory);
router.route(`/dashboard/topUserDonation`).post(isAuthenticatedUser, authorizeRoles('administrator'), getTopUserDonation);
router.route(`/dashboard/topUserReport`).post(isAuthenticatedUser, authorizeRoles('administrator'), getTopUserReport);

module.exports = router;