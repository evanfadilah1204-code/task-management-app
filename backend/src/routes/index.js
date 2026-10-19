"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/ping', (req, res) => {
    res.status(200).json({
        success: true,
        message: "PONG! API Backend siap tempur!"
    });
});
exports.default = router;
