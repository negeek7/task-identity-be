import express, { Request, Response } from 'express';
import {PrismaClient} from '@prisma/client';

const app = express();
const PORT = process.env.PORT;
const prisma = new PrismaClient();


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}...`);
})

app.use(express.json());

app.post('/api/new', async (request: Request, response: Response) => {
    const {email, phoneNumber} = request.body;

    const contact = prisma.contact.create({
        data: {
            email,
            phoneNumber
        }
    })
})