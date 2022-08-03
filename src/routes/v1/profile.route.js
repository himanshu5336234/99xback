const express = require('express');

const profileController = require('../../controllers/profile.controller');
const currencyMiddleware  = require('../../middlewares/currency');
const w3AuthMiddleware = require('../../middlewares/w3auth');

const router = express.Router();

router.get('/', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency, profileController.getUserConfig);
// router.post('/', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency,  profileController.setUserConfig);
router.post('/upload', w3AuthMiddleware.mandatoryAuth, profileController.setUserProfilePicture)

router.post('/', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency,  profileController.setUserConfig);

module.exports = router;
