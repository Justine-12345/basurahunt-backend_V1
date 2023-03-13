const express = require('express');
const router = express.Router();

const { registerUser, findEmail, loginUser, logout, getUserProfile, updatePassword, updateProfile, allUsers, getUserDetails, forgotPassword, resetPassword, refreshOtp, checkOtp, updateUser, deleteUser, reportedDumps, receiveItems, donatedItems, claimedItems, readNofication, getLevelExp} = require('../controllers/authController');

const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/auth');

router.route('/register').post(registerUser);
router.route('/findEmail').post(findEmail);
router.route('/login').post(loginUser);
router.route('/logout').post(logout);

router.route('/me').get(isAuthenticatedUser, getUserProfile);
router.route('/password/update').put(isAuthenticatedUser, updatePassword);
router.route('/me/update').put(isAuthenticatedUser, updateProfile);
router.route('/otp/update').put(isAuthenticatedUser, refreshOtp);
router.route('/otp/check').put(isAuthenticatedUser, checkOtp);

router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);

router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('administrator'), allUsers);

// router.route('/admin/users').get( allUsers);


router.route('/admin/user/:id').get(isAuthenticatedUser, getUserDetails).delete(isAuthenticatedUser, authorizeRoles('administrator'), deleteUser);;
router.route('/admin/user/:id').put(isAuthenticatedUser, authorizeRoles('administrator'), updateUser)

router.route('/me/reported-dumps').get(isAuthenticatedUser, reportedDumps);
router.route('/me/receive-items').get(isAuthenticatedUser, receiveItems);
router.route('/me/donated-items').get(isAuthenticatedUser, donatedItems);
router.route('/me/claimed-items').get(isAuthenticatedUser, claimedItems);

router.route('/me/read-notification').post(isAuthenticatedUser, readNofication);

router.route('/me/level-exp').get(isAuthenticatedUser, getLevelExp);
module.exports = router;