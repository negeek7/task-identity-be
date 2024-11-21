"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const Contact_controller_1 = require("./controllers/Contact.controller");
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const prisma = new client_1.PrismaClient();
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}...`);
});
app.use(express_1.default.json());
app.post('/api/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phoneNumber } = req.body;
        const contact = yield prisma.contact.create({
            data: {
                email,
                phoneNumber,
            },
        });
        return res.status(200).json({ status: "Success", contact });
    }
    catch (error) {
        console.log("Error creating contact", error);
        return res.status(500).json({ status: "Error", message: error.message });
    }
}));
app.post('/api/identify', Contact_controller_1.handleIdentifyContact);
