import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploader: true, student: { include: { user: true } } },
  });
  return NextResponse.json(docs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const doc = await prisma.document.create({
    data: {
      title: body.title,
      fileUrl: body.fileUrl,
      category: body.category,
      entityType: body.entityType,
      entityId: body.entityId || null,
      uploadedBy: body.uploadedBy,
      studentId: body.entityType === "STUDENT" ? body.entityId : null,
    },
  });
  return NextResponse.json(doc);
}
