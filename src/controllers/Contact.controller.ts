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
                    {phoneNumber},
                    {email}
                ]
            }
        });

        console.log(existingContacts, "existingContacts");

        // actions for if existing contacts exists
        if(existingContacts.length > 0) {

            console.log(existingContacts.length, "existingContacts length");

            // structure for identify response
            let newContact = null;
            let data: {[key: string]: any} = {
                primaryContactId: null,
                emails: [],
                phoneNumbers: [],
                secondaryContactIds: []
            };

            // finding if identify query has new info
            const isDuplicate = existingContacts.some(contact =>
                contact.phoneNumber === phoneNumber &&
                contact.email === email
            );

            if(isDuplicate) {
                newContact = await createNewContact({email, phoneNumber}, "secondary", res);
                data.emails.push(email);
                data.phoneNumbers.push(phoneNumber);
                data.secondaryContactIds.push(newContact?.id)
            }

            for(let i=0; i < existingContacts.length; i++){
                let contact = existingContacts[i];
                if(contact.linkPrecedence === "primary") {
                    data.primaryContactId = contact.id;
                    data.emails.unshift(contact.email);
                    data.phoneNumbers.unshift(contact.phoneNumber);
                } else {
                    data.emails.push(contact.email);
                    data.phoneNumbers.push(contact.phoneNumber);
                    data.secondaryContactIds.push(contact.id);
                }
            }

            return res.status(200).json({status: "Success", contact: data})
        } else {
            let newContact = await createNewContact({email, phoneNumber}, "primary", res)
            return res.status(200).json({status: "Success", newContact});
        }
    } catch (error: any) {
        console.log("Error creating contact", error);
        return res.status(500).json({ status: "Error", message: error.message });
    }
}


async function createNewContact(data: object, linkPrecedence: string, res: Response){
    try {
        const newContact = await prisma.contact.create({
            data: {
                ...data,
                linkPrecedence
            },
        })
        return newContact
    } catch (error) {
        console.log("Error creating new contact", error);
        throw error
    }
}