-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedId" INTEGER NOT NULL,
    "linkPrecedence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
