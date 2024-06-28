CREATE TABLE contact (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phoneNumber VARCHAR(15),
    email VARCHAR(255),
    linkedId INT,
    linkPrecedence TEXT NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME,
    FOREIGN KEY (linkedId) REFERENCES contact(id)
);