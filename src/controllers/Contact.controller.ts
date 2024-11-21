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

interface ResponseData {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
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

        if (existingContacts.length > 0) {
            
            let primaryContact: PrimaryContact | null = null;

            // check for other linked contacts
            if (existingContacts.length === 1 && existingContacts[0].linkPrecedence === "primary") {
                return await handlePrimaryLinkedContact(existingContacts, res);
            }

            let filterPrimary = existingContacts.filter(contact => contact.linkPrecedence === "primary");

            if(filterPrimary.length === 1) {
                primaryContact = filterPrimary[0];
            } else {
                let primary = existingContacts.find(contact => contact.email === email);
                let secondary = existingContacts.find(contact => contact.phoneNumber === phoneNumber);

                let updateContactToSecondary = await prisma.contact.update({
                    where: {
                        id: secondary?.id
                    },
                    data: {
                        linkedId: primary?.id,
                        linkPrecedence: "secondary"
                    }
                })

                let data = await handleExisitingContact([updateContactToSecondary], primary);
                return res.status(200).json({status: "Success", contact: data});
            }

            if (!primaryContact) {
                primaryContact = await getPrimaryContact(existingContacts);
            }

            // checking if payload contains some unique info
            // let isPayloadExist = existingContacts.some((contact) => {
            //     if (phoneNumber && !email) return contact.phoneNumber === phoneNumber;
            //     else if (email && !phoneNumber) return contact.email === email;
            //     else return contact.phoneNumber === phoneNumber && contact.email === email;
            // });

            // if (!isPayloadExist) {
            //     let newContact = await createNewContact({ email, phoneNumber, linkPrecedence: "secondary", linkedId: primaryContact?.id });
            //     let data = await handleExisitingContact(existingContacts, primaryContact);

            //     if (newContact.email) data.emails.push(newContact.email);
            //     if (newContact.phoneNumber) data.phoneNumbers.push(newContact.phoneNumber);
            //     data.secondaryContactIds.push(newContact.id);
            //     return res.status(200).json({ status: "Success", contact: data });
            // }

            // let data = await handleExisitingContact(existingContacts, primaryContact);
            // return res.status(200).json({ status: "Success", contact: data });
        } else {
            let newContact = await createNewContact({ email, phoneNumber, linkPrecedence: "primary" })
            let data = await handleExisitingContact(null, newContact);
            return res.status(200).json({ status: "Success", contact: data });
        }

    } catch (error: any) {
        console.log("Error creating contact", error);
        return res.status(500).json({ status: "Error", message: error.message });
    }
}

async function createNewContact(data: object) {
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

async function handleExisitingContact(existingContacts: any[] | null, primaryContact: PrimaryContact | null | undefined) {

    let data : ResponseData = {
        primaryContactId: 0,
        emails: [],
        phoneNumbers: [],
        secondaryContactIds: []
    };

    // setting primary field first
    if (primaryContact) {
        data.primaryContactId = primaryContact.id;
        if (primaryContact.email) {
            data.emails.push(primaryContact.email);
        }
        if (primaryContact.phoneNumber) {
            data.phoneNumbers.push(primaryContact.phoneNumber);
        }

        if (existingContacts?.length === 1 && existingContacts[0].linkPrecedence === "primary") return data;
    }

    if(existingContacts) {
        for (let i = 0; i < existingContacts.length; i++) {
            let contact = existingContacts[i];
    
            if (contact.linkPrecedence === "primary") continue;
    
            data.emails.push(contact.email);
            data.phoneNumbers.push(contact.phoneNumber);
            data.secondaryContactIds.push(contact.id);
        }
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

async function handlePrimaryLinkedContact(existingContacts: any, res: Response){
    let primaryContact = existingContacts[0];
    let otherContacts = await prisma.contact.findMany();
    let linkedContacts = otherContacts.filter(contact => contact.linkedId === primaryContact.id);

    let data = await handleExisitingContact(linkedContacts, primaryContact);
    return res.status(200).json({ status: "Success", contact: data });
}
