import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { ApiResponse } from '@/types/apiResponse';
import { errorResponse, successResponse, failureResponse } from "@/utils/response";
import { Student } from "@prisma/client";

// Function to handle BigInt serialization
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Student | null>>> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(errorResponse(400, "Id is required"), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: String(id)
      }
    });

    const profile = await prisma.student.findUnique({
      where: {
        id: user?.userId
      },
      include: {
        details: true
      }
    });

    if (!profile) {
      return NextResponse.json(errorResponse(404, "User profile not found"), { status: 404 });
    }

    return NextResponse.json(successResponse(200, serializeBigInt(profile), "Profile fetched successfully"), { status: 200 });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(failureResponse(error), { status: 500 });
  }
}

export async function PATCH(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Student | null>>> {
  try {
    const { id } = await params;
    const data = await req.json();
    const email = data.email;
    const enrollment = data.enrollmentNo;
    const studentdetails = data.details;
    console.log(studentdetails);

    if (!id) {
      return NextResponse.json(errorResponse(400, "Id is required"), { status: 400 });
    }
    if (!data) {
      return NextResponse.json(errorResponse(400, "Data is required"), { status: 400 });
    }
    if (email) {
      return NextResponse.json(errorResponse(400, "Email cannot be updated"), { status: 400 });
    }
    if (enrollment) {
      return NextResponse.json(errorResponse(400, "Enrollment Number cannot be updated"), { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: String(id) },
      select: { studentDetailsId: true }
    });

    if (!student) {
      return NextResponse.json(errorResponse(404, "Student not found"), { status: 404 });
    }

    if (studentdetails) {
      const detailsupdatedProfile = await prisma.studentDetails.update({
        where: { id: String(student.studentDetailsId) },
        data: {
          ...studentdetails
        },
      });
      if (!detailsupdatedProfile) {
        return NextResponse.json(errorResponse(404, "Student details not found"), { status: 404 });
      }
      delete data.details;
    }

    const updatedProfile = await prisma.student.update({
      where: { id: String(id) },
      data: {
        ...data
      },
    });
    const userupdatedProfile = await prisma.user.updateMany({
      where: { userId: String(id) },
      data: {
        name: data.name,
      },
    });

    if (!updatedProfile) {
      return NextResponse.json(errorResponse(404, "Student profile not found"), { status: 404 });
    }
    if (!userupdatedProfile) {
      return NextResponse.json(errorResponse(404, "User profile not found"), { status: 404 });
    }

    return NextResponse.json(successResponse(200, (updatedProfile), "Profile updated successfully"), { status: 200 });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(failureResponse(error), { status: 500 });
  }
}

export async function DELETE(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(errorResponse(400, "id is required"), { status: 400 });
    }

    await prisma.student.delete({
      where: { id: String(id) },
    });

    return NextResponse.json(successResponse(200, null, "Profile deleted successfully"), { status: 200 });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(failureResponse(error), { status: 500 });
  }
}