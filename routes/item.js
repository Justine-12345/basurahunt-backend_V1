const express = require('express');
const router = express.Router();

const { 
    getItemList,
    getSingleItem,
    addItem,
    claimItem,
    cancelItem,
    confirmItem,
    receiveItem,
    getItems,
    newItem,
    updateItem,
    deleteItem
} = require('../controllers/itemController');

const { isAuthenticatedUser,authorizeRoles } = require('../middlewares/auth');

router.route('/items').get(isAuthenticatedUser, authorizeRoles('administrator', 'newUser', 'user'), getItemList);
router.route('/item/:id').get(isAuthenticatedUser, authorizeRoles('administrator', 'newUser','user'), getSingleItem);
router.route('/item/new').post(isAuthenticatedUser, authorizeRoles('administrator', 'newUser','user'),addItem);
router.route('/item/claim/:id').put(isAuthenticatedUser, authorizeRoles('administrator','user'),claimItem);
router.route('/item/cancel/:id').put(isAuthenticatedUser, authorizeRoles('administrator','user'),cancelItem);
router.route('/item/confirm/:id').put(isAuthenticatedUser, authorizeRoles('administrator','user'),confirmItem);
router.route('/item/receive/:id').put(isAuthenticatedUser, authorizeRoles('administrator','user'),receiveItem);


// Admin
router.route('/admin/items').get(isAuthenticatedUser, authorizeRoles('administrator'), getItems);
router.route('/admin/item/new').post(isAuthenticatedUser, authorizeRoles('administrator'), newItem);
router.route('/admin/item/:id').put(isAuthenticatedUser, authorizeRoles('administrator'), updateItem);
router.route('/admin/item/:id').delete(isAuthenticatedUser, authorizeRoles('administrator', 'newUser', 'user'), deleteItem);

module.exports = router;