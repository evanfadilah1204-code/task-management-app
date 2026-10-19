"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authcontroller_1 = require("../controllers/authcontroller");
const router = (0, express_1.Router)();
router.post('/register', authcontroller_1.register);
router.post('/login', authcontroller_1.login);
router.post('/google', authcontroller_1.googleLogin);
exports.default = router;
