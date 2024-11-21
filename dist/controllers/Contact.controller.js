var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export function handleIdentifyContact(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, phoneNumber } = req.body;
            if (!email && !phoneNumber)
                return res.status(400).json({ status: "Error", message: "Please provide user email or phone number" });
            // getting any existing contacts
            const existingContacts = yield prisma.contact.findMany({
                where: {
                    OR: [
                        { phoneNumber },
                        { email }
                    ]
                }
            });
            if (existingContacts.length > 0) {
                let primaryContact = null;
                // check for other linked contacts
                if (existingContacts.length === 1 && existingContacts[0].linkPrecedence === "primary") {
                    return yield handlePrimaryLinkedContact(existingContacts, res);
                }
                let filterPrimary = existingContacts.filter((contact) => contact.linkPrecedence === "primary");
                if (filterPrimary.length === 1) {
                    primaryContact = filterPrimary[0];
                }
                else {
                    let primary = existingContacts.find((contact) => contact.email === email);
                    let secondary = existingContacts.find((contact) => contact.phoneNumber === phoneNumber);
                    let updateContactToSecondary = yield prisma.contact.update({
                        where: {
                            id: secondary === null || secondary === void 0 ? void 0 : secondary.id
                        },
                        data: {
                            linkedId: primary === null || primary === void 0 ? void 0 : primary.id,
                            linkPrecedence: "secondary"
                        }
                    });
                    let data = yield handleExisitingContact([updateContactToSecondary], primary);
                    return res.status(200).json({ status: "Success", contact: data });
                }
                if (!primaryContact) {
                    primaryContact = yield getPrimaryContact(existingContacts);
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
            }
            else {
                let newContact = yield createNewContact({ email, phoneNumber, linkPrecedence: "primary" });
                let data = yield handleExisitingContact(null, newContact);
                return res.status(200).json({ status: "Success", contact: data });
            }
        }
        catch (error) {
            console.log("Error creating contact", error);
            return res.status(500).json({ status: "Error", message: error.message });
        }
    });
}
function createNewContact(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newContact = yield prisma.contact.create({
                data: Object.assign({}, data),
            });
            return newContact;
        }
        catch (error) {
            console.log("Error creating new contact", error);
            throw error;
        }
    });
}
function handleExisitingContact(existingContacts, primaryContact) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = {
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
            if ((existingContacts === null || existingContacts === void 0 ? void 0 : existingContacts.length) === 1 && existingContacts[0].linkPrecedence === "primary")
                return data;
        }
        if (existingContacts) {
            for (let i = 0; i < existingContacts.length; i++) {
                let contact = existingContacts[i];
                if (contact.linkPrecedence === "primary")
                    continue;
                data.emails.push(contact.email);
                data.phoneNumbers.push(contact.phoneNumber);
                data.secondaryContactIds.push(contact.id);
            }
        }
        return data;
    });
}
function getPrimaryContact(existingContacts) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let secondaryContact = existingContacts[0];
            let contact = yield prisma.contact.findUnique({
                where: {
                    id: secondaryContact === null || secondaryContact === void 0 ? void 0 : secondaryContact.linkedId
                }
            });
            if (contact) {
                return contact;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    });
}
function handlePrimaryLinkedContact(existingContacts, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let primaryContact = existingContacts[0];
        let otherContacts = yield prisma.contact.findMany();
        let linkedContacts = otherContacts.filter((contact) => contact.linkedId === primaryContact.id);
        let data = yield handleExisitingContact(linkedContacts, primaryContact);
        return res.status(200).json({ status: "Success", contact: data });
    });
}
