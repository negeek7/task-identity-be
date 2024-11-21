var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleIdentifyContact } from './controllers/Contact.controller.ts';
const app = express();
const PORT = process.env.PORT;
const prisma = new PrismaClient();
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}...`);
});
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello Bitespeed!");
});
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
app.post('/api/identify', handleIdentifyContact);
