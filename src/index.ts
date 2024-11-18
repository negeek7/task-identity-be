import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT;
const prisma = new PrismaClient();


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}...`);
})

app.use(express.json());

app.post('/api/new', async (request: Request, response: Response) => {
    try {
      const { email, phoneNumber } = request.body;
  
      const contact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
        },
      });

      return response.status(200).json({ status: "Success", contact });
    } catch (error: any) {
      console.log("Error creating contact", error);
  
      return response.status(500).json({ status: "Error", message: error.message });
    }
  });