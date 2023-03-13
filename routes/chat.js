const express = require('express');
const router = express.Router();

const { 
    getChat, newChat, updateChat, activeChat
} = require('../controllers/chatController');

const { isAuthenticatedUser,authorizeRoles } = require('../middlewares/auth');

router.route('/chat/:id').get(isAuthenticatedUser, authorizeRoles('administrator','user',  'newUser'), getChat);
router.route('/chat/new').post(isAuthenticatedUser, authorizeRoles('administrator','user',  'newUser'), newChat);
router.route('/chat/:id').put(isAuthenticatedUser, authorizeRoles('administrator','user',  'newUser'), updateChat);
router.route('/chat/active-chat').post(isAuthenticatedUser, activeChat);
module.exports = router;