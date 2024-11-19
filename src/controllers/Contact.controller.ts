import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function handleIdentifyContact(req: Request, res: Response): Promise<any> {
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) return res.send(400).json({ status: "Error", message: "Please provide user email or phone number" });

        const existingContact = await prisma.contact.findMany({
            where: {
                phoneNumber,
                email
            }
        });

        if(!existingContact.length) return createNewContact({email, phoneNumber, linkPrecedence: "primary"}, res)

        return res.status(200).json({ status: "Success" });
    } catch (error: any) {
        console.log("Error creating contact", error);
        return res.status(500).json({ status: "Error", message: error.message });
    }
}


async function createNewContact(data: object, res: Response){
    try {
        const newContact = await prisma.contact.create({
            data
        })
        return res.status(200).json({message: "New contact created", data: newContact})
    } catch (error) {
        console.log("Error creating new contact", error);
        return res.status(500).json({Status: "Error", message: "Error creating new contact"})
    }
}