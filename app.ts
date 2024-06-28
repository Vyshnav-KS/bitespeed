// src/app.ts
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { buildResponse, createContact, findContactsByLinkedId, findContactsByPhoneNumberOrEmail, updateContact, withPrimaryContacts } from './utils';
import { Contact } from './types';


// Create an Express app
const app = express();
app.use(bodyParser.json());



// Endpoint to create a new contact
app.post('/identify', async (req: Request, res: Response) => {
    try {

    } catch (error) {

    }

    const { phoneNumber, email } = req.body;

    if (!email && !phoneNumber) {
        return res.status(422).json({ error: 'Invalid input' });
    }

    let contacts = await findContactsByPhoneNumberOrEmail(phoneNumber, email);
    console.log("---------------")
    // case primary creation
    if (contacts.length === 0) {
        const newContact = await createContact({
            email,
            phoneNumber,
            linkPrecedence: "primary",
        })
        console.log("case new");
        return res.json(buildResponse([newContact]));
    }

    // load other primary contacts that may be linked with these contacts 
    contacts = await withPrimaryContacts(contacts);
    // case primary to secondary conversion
    const primaryContacts = contacts.filter(contact => contact.linkPrecedence === "primary").sort((a, b) => a.id - b.id)
    if (primaryContacts.length === 0) throw "Fatal no primary contacts";

    if (primaryContacts.length > 1) {
        const oldestContact = primaryContacts[0];
        const updatedRecords : Record<number, Contact> = {}
        for (let i = 1; i < primaryContacts.length; i++) {
            const record = await updateContact(primaryContacts[i].id, {
                ...primaryContacts[i],
                linkPrecedence: "secondary",
                linkedId: oldestContact.id
            })
            updatedRecords[record.id] = record
        }
        console.log("case prim -> sec");
        const updatedContacts = contacts.map(contact => updatedRecords[contact.id] ? updatedRecords[contact.id] : contact);
        return res.json(buildResponse(updatedContacts));
    }
    const primaryContact = primaryContacts[0];
    // get all secondary contacts linked with
    contacts = await findContactsByLinkedId(primaryContact.id);
    contacts.push(primaryContact);

    // case secondary creation
    if (!contacts.find(contact => contact.email === email && contact.phoneNumber === phoneNumber)) {
        const newContact = await createContact({
            email,
            phoneNumber,
            linkPrecedence: "secondary",
            linkedId: primaryContact.id
        })
        console.log("case secondary");
        return res.json(buildResponse([...contacts, newContact]));
    }

    console.log("last case");
    return res.json(buildResponse(contacts));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
