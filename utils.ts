import exp from "constants";
import pool from "./db";
import { Contact, NewContact, UpdateContact } from "./types";

export async function findContactsByPhoneNumberOrEmail(
  phoneNumber?: string,
  email?: string
): Promise<Contact[]> {
  try {
    const query = `SELECT * FROM contact WHERE phoneNumber = ? or email = ?`;
    const contacts = (await pool.query(query, [
      phoneNumber,
      email,
    ])) as unknown as Contact[];

    if (contacts.length === 0) {
      return [];
    }

    return contacts;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function withPrimaryContacts(contacts: Contact[]) {
  const missingPrimaryContactIds = new Set<number>();
  contacts.forEach(
    (item) =>
      item.linkPrecedence === "secondary" &&
      missingPrimaryContactIds.add(item.linkedId!)
  );
  contacts.forEach(
    (item) =>
      item.linkPrecedence === "primary" &&
      missingPrimaryContactIds.delete(item.id)
  );

  if (missingPrimaryContactIds.size > 0) {
    const query = `SELECT * FROM contact WHERE id IN (?)`;
    const missingPrimaryContacts = (await pool.query(query, [
      Array.from(missingPrimaryContactIds),
    ])) as unknown as Contact[];

    return [...contacts, ...missingPrimaryContacts];
  }

  return contacts;
}

export async function findContactsByLinkedId(
  linkedId: number
): Promise<Contact[]> {
  try {
    const query = `SELECT * FROM contact WHERE linkedId = ?`;
    const contacts = (await pool.query(query, [
      linkedId,
    ])) as unknown as Contact[];

    if (contacts.length === 0) {
      return [];
    }

    return contacts;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function findContactsByEmail(email?: string): Promise<Contact[]> {
  if (!email) return [];

  try {
    const query = `SELECT * FROM contact WHERE email = ?`;
    const rows = await pool.query(query, [email]);

    if (rows.length === 0) {
      return [];
    }

    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function createContact(newContact: NewContact): Promise<Contact> {
  try {
    const query = `
            INSERT INTO contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt)
            VALUES (?, ?, ?, ?, NOW(), NOW(), ?)
        `;
    const { phoneNumber, email, linkedId, linkPrecedence, deletedAt } =
      newContact;
    const result = await pool.query(query, [
      phoneNumber,
      email,
      linkedId,
      linkPrecedence,
      deletedAt,
    ]);

    const rows = await pool.query(`SELECT * FROM contact WHERE id = ?`, [
      result.insertId,
    ]);
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateContact(
  id: number,
  updates: UpdateContact
): Promise<Contact> {
  try {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const query = `
            UPDATE contact
            SET ${fields}, updatedAt = NOW()
            WHERE id = ?
        `;

    values.push(id);
    await pool.query(query, values);

    const rows = await pool.query(`SELECT * FROM contact WHERE id = ?`, [id]);
    if (rows.length === 0) {
      throw new Error("Contact not found");
    }

    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function buildResponse(contacts: Contact[]) {
  console.log(contacts);
  const primaryContact = contacts.find(
    (contact) => contact.linkPrecedence === "primary"
  );
  const secondaryContacts = contacts.filter(
    (contact) => contact.linkPrecedence === "secondary"
  );

  const primaryContactId = primaryContact ? primaryContact.id : null;
  const emails = Array.from(
    new Set(
      contacts.map((contact) => contact.email).filter((email) => email !== null)
    )
  ) as string[];
  const phoneNumbers = Array.from(
    new Set(
      contacts
        .map((contact) => contact.phoneNumber)
        .filter((phoneNumber) => phoneNumber !== null)
    )
  ) as string[];
  const secondaryContactIds = secondaryContacts.map((contact) => contact.id);

  const response = {
    contact: {
      primaryContactId: primaryContactId,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: secondaryContactIds,
    },
  };

  return response;
}
