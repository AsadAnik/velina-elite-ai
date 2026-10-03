-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT NOT NULL DEFAULT 'Velina Elite',
    "site_logo" TEXT DEFAULT '/1776256116755-removebg-preview.png',
    "whatsapp_number" TEXT NOT NULL DEFAULT '8801347375533',
    "whatsapp_message" TEXT DEFAULT 'Hello! I have a question about Velina Elite.',
    "is_whatsapp_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
