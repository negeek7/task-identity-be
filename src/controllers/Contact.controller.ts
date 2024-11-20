import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function handleIdentifyContact(req: Request, res: Response): Promise<any> {
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) return res.status(400).json({ status: "Error", message: "Please provide user email or phone number" });

        // getting any existing contacts
        const existingContacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { phoneNumber },
                    { email }
                ]
            }
        });

        console.log(existingContacts, "existingContacts");
        console.log(existingContacts.length, "existingContacts length");

        if (existingContacts.length > 0) {

            let primaryContact = existingContacts.find(contact => contact.linkPrecedence === "primary");

            // structure for identify response
            let isPayloadExist = existingContacts.some((contact) => {
                if (phoneNumber) contact.phoneNumber === phoneNumber
                else if (email) contact.email === email;
                else contact.phoneNumber === phoneNumber && contact.email === email;
            });

            if (!isPayloadExist) {
                let newContact = await createNewContact({ email, phoneNumber, linkPrecedence: "primary", linkedId: primaryContact?.id }, res);
                let data = await handleExisitingContact(existingContacts, { email, phoneNumber });

                if (email) data.emails.push(newContact.email);
                if (phoneNumber) data.phoneNumbers.push(newContact.phoneNumber);
                data.secondaryContactIds.push(newContact.id);
                return res.status(200).json({ status: "Success", contact: data })
            }

            let data = await handleExisitingContact(existingContacts, { email, phoneNumber });
            console.log(data, "DATA");
            return res.status(200).json({ status: "Success", contact: data })

        } else {
            let newContact = await createNewContact({ email, phoneNumber, linkPrecedence: "primary" }, res)
            return res.status(200).json({ status: "Success", newContact });
        }

    } catch (error: any) {
        console.log("Error creating contact", error);
        return res.status(500).json({ status: "Error", message: error.message });
    }
}


async function createNewContact(data: object, res: Response) {
    console.log("creating new contact");
    try {
        const newContact = await prisma.contact.create({
            data: {
                ...data,
            },
        })
        return newContact
    } catch (error) {
        console.log("Error creating new contact", error);
        throw error
    }
}


async function handleExisitingContact(existingContacts: any[], payload: any) {
    const { email, phoneNumber } = payload;


    let data: { [key: string]: any } = {
        primaryContactId: null,
        emails: [],
        phoneNumbers: [],
        secondaryContactIds: []
    };



    for (let i = 0; i < existingContacts.length; i++) {
        let contact = existingContacts[i];
        if (contact.linkPrecedence === "primary") {
            data.primaryContactId = contact.id;
            data.emails.unshift(contact.email);
            data.phoneNumbers.unshift(contact.phoneNumber);
        } else {
            data.emails.push(contact.email);
            data.phoneNumbers.push(contact.phoneNumber);
            data.secondaryContactIds.push(contact.id);
        }
    }

    return data;
}