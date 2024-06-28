
export interface Contact {
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: 'primary' | 'secondary';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface NewContact {
    phoneNumber?: string;
    email?: string;
    linkedId?: number;
    linkPrecedence: 'primary' | 'secondary';
    deletedAt?: Date | null;
}

export interface UpdateContact {
    phoneNumber?: string | null;
    email?: string | null;
    linkedId?: number | null;
    linkPrecedence?: 'primary' | 'secondary';
    deletedAt?: Date | null;
}