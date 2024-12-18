import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleIdentifyContact } from './controllers/Contact.controller.js';

const app = express();
const PORT = process.env.PORT;
const prisma = new PrismaClient();


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}...`);
})

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello Bitespeed!");
});

app.post('/api/new', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, phoneNumber } = req.body;

        const contact = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
            },
        });

        return res.status(200).json({ status: "Success", contact });
    } catch (error: any) {
        console.log("Error creating contact", error);

        return res.status(500).json({ status: "Error", message: error.message });
    }
});



app.post('/api/identify', handleIdentifyContact);
    


