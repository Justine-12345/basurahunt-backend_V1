const express = require('express');
const router = express.Router();

const { getDumpsCoordinates, getDumpList, newDump, getDumps, getSingleDump, updateDump, deleteDump, updateDumpStatus, rankings, allDumps, addComment, getComments, deleteComment } = require('../controllers/dumpController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.route('/dump/new').post(isAuthenticatedUser, authorizeRoles('administrator', 'user', 'newUser'), newDump);
router.route('/dumps').get(isAuthenticatedUser, authorizeRoles('administrator', 'garbageCollector', 'user', 'newUser'), getDumps);
router.route('/dump/:id').get(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator', 'garbageCollector', 'user', 'newUser'), getSingleDump);

router.route('/dump-list').get(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator', 'garbageCollector', 'user', 'newUser'), getDumpList);

router.route('/public-dump').get(getDumpList);

router.route('/dumps-coordinates').get(getDumpsCoordinates);

router.route('/admin/dumps').get(isAuthenticatedUser, authorizeRoles('administrator'), allDumps);
router.route('/admin/dump/:id').put(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator', 'newUser'), updateDump).delete(isAuthenticatedUser, authorizeRoles('administrator', 'newUser'), deleteDump);
router.route('/admin/dump-status/:id').put(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator', 'garbageCollector'), updateDumpStatus);

router.route('/rankings').post(isAuthenticatedUser, authorizeRoles('administrator', 'user', 'barangayAdministrator'), rankings);

router.route('/dump/comment/:id').put(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator', 'garbageCollector', 'user'), addComment);
router.route('/dump/comment/:id').get(isAuthenticatedUser, authorizeRoles('administrator', 'barangayAdministrator', 'garbageCollector', 'user', 'newUser'), getComments);
router.route('/admin/comment/:id').put(isAuthenticatedUser, authorizeRoles('administrator'), deleteComment);
module.exports = router;
