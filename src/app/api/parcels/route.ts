import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const parcels = await prisma.landRecord.findMany({
      select: {
        id: true,
        parcelId: true,
        deedNumber: true,
        ownerName: true,
        ownerNationalId: true,
        areaSqFt: true,
        status: true,
        recordHash: true,
        createdAt: true,
      },
      orderBy: { parcelId: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: parcels,
    });
  } catch (error) {
    console.error("Error fetching parcels in /api/parcels:", error);
    return NextResponse.json(
      {
        success: false,
        error: "FAILED_FETCH_PARCELS",
        message: "Failed to retrieve parcels from SQLite database.",
      },
      { status: 500 }
    );
  }
}
