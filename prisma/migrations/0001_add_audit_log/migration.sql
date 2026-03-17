-- CreateTable
CREATE TABLE "_AuditLog" (
    "id" SERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER,
    "userName" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_AuditLog_pkey" PRIMARY KEY ("id")
);
