import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PrimaryContact {
    id: number;
    phoneNumber?: string | null;
    email?: string | null;
    linkedId?: number | null;
    linkPrecedence?: string | null;
    createdAt?: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

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

            let primaryContact: PrimaryContact | null | undefined = existingContacts.find(contact => contact.linkPrecedence === "primary");

            if (!primaryContact) {
                primaryContact = await getPrimaryContact(existingContacts);
            }

            // checking if payload contains some unique info
            let isPayloadExist = existingContacts.some((contact) => {
                if (phoneNumber && !email) return contact.phoneNumber === phoneNumber;
                else if (email && !phoneNumber) return contact.email === email;
                else return contact.phoneNumber === phoneNumber && contact.email === email;
            });

            if (!isPayloadExist) {
                console.log("WWHHWHWHWH")
                let newContact = await createNewContact({ email, phoneNumber, linkPrecedence: "secondary", linkedId: primaryContact?.id }, res);
                let data = await handleExisitingContact(existingContacts, primaryContact);

                if (email) data.emails.push(newContact.email);
                if (phoneNumber) data.phoneNumbers.push(newContact.phoneNumber);
                data.secondaryContactIds.push(newContact.id);
                return res.status(200).json({ status: "Success", contact: data });
            }

            let data = await handleExisitingContact(existingContacts, primaryContact);
            console.log(data, "DATA");
            return res.status(200).json({ status: "Success", contact: data });

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

async function handleExisitingContact(existingContacts: any[], primaryContact: PrimaryContact | null | undefined) {

    let data: { [key: string]: any } = {
        primaryContactId: null,
        emails: [],
        phoneNumbers: [],
        secondaryContactIds: []
    };

    // setting primary field first
    if (primaryContact) {
        data.primaryContactId = primaryContact.id;
        data.emails.push(primaryContact.email);
        data.phoneNumbers.push(primaryContact.phoneNumber);

        if (existingContacts.length === 1 && existingContacts[0].linkPrecedence === "primary") return data;
    }

    for (let i = 0; i < existingContacts.length; i++) {
        let contact = existingContacts[i];

        if (contact.linkPrecedence === "primary") continue;

        data.emails.push(contact.email);
        data.phoneNumbers.push(contact.phoneNumber);
        data.secondaryContactIds.push(contact.id);
    }
    return data;
}

async function getPrimaryContact(existingContacts: any) {
    try {
        let secondaryContact = existingContacts[0];
        let contact = await prisma.contact.findUnique({
            where: {
                id: secondaryContact?.linkedId
            }
        })
        if (contact) {
            return contact;
        }
        return null;
    } catch (error) {
        throw error
    }
}