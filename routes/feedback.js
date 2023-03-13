const express = require('express');
const router = express.Router();

const { 
    newFeedback, getFeedbacks, getFeedback, getUserFeedbacks
} = require('../controllers/feedbackController');

const { isAuthenticatedUser,authorizeRoles } = require('../middlewares/auth');

router.route('/feedback/new').post(isAuthenticatedUser, newFeedback);
router.route('/feedback/:id').get(isAuthenticatedUser, getFeedback);
router.route('/feedbacks/').get(isAuthenticatedUser, getUserFeedbacks);
router.route('/admin/feedbacks/').get(isAuthenticatedUser, authorizeRoles('administrator'), getFeedbacks);


module.exports = router;