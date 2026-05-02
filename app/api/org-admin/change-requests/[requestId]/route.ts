import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdminOrOrgAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await apiAdminOrOrgAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { requestId } = await params;
    const body = await request.json();
    const action = String(body.action ?? "");
    const rejectionReason = String(body.rejectionReason ?? "").trim() || null;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Ongeldige actie." }, { status: 400 });
    }
    if (action === "REJECT" && !rejectionReason) {
      return NextResponse.json(
        { error: "Reden voor afwijzing is verplicht." },
        { status: 400 }
      );
    }

    const changeRequest = await prisma.accountChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, organizationId: true },
        },
      },
    });

    if (!changeRequest) {
      return NextResponse.json(
        { error: "Verzoek niet gevonden." },
        { status: 404 }
      );
    }
    if (changeRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Verzoek is al beoordeeld." },
        { status: 409 }
      );
    }

    if (changeRequest.userId === auth.id) {
      return NextResponse.json(
        { error: "Je kunt je eigen verzoek niet beoordelen." },
        { status: 403 }
      );
    }

    // ORG_ADMIN requests must be reviewed by ADMIN only
    if (
      changeRequest.user.role === "ORG_ADMIN" &&
      auth.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Verzoeken van afdelingsadmins kunnen alleen door een ADMIN worden beoordeeld." },
        { status: 403 }
      );
    }

    if (auth.role === "ORG_ADMIN") {
      if (
        !changeRequest.user.organizationId ||
        !auth.organizationAccessIds.includes(changeRequest.user.organizationId)
      ) {
        return NextResponse.json(
          { error: "Geen rechten om dit verzoek te beoordelen." },
          { status: 403 }
        );
      }
      if (
        action === "APPROVE" &&
        changeRequest.type === "ROLE" &&
        changeRequest.requestedValue === "ADMIN"
      ) {
        return NextResponse.json(
          { error: "Een afdelingsadmin mag geen beheerdersrol toekennen." },
          { status: 403 }
        );
      }
    }

    const now = new Date();

    if (action === "APPROVE") {
      if (changeRequest.type === "EMAIL") {
        const taken = await prisma.user.findFirst({
          where: {
            email: changeRequest.requestedValue,
            NOT: { id: changeRequest.userId },
          },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json(
            { error: "Dit e-mailadres is al in gebruik door een andere gebruiker." },
            { status: 409 }
          );
        }
      }

      const updateData =
        changeRequest.type === "EMAIL"
          ? { email: changeRequest.requestedValue }
          : { role: changeRequest.requestedValue as "ORG_ADMIN" | "EDITOR" | "VIEWER" };

      await prisma.$transaction([
        prisma.user.update({ where: { id: changeRequest.userId }, data: updateData }),
        prisma.accountChangeRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED", reviewedById: auth.id, reviewedAt: now },
        }),
      ]);

      await writeAuditLog({
        action: changeRequest.type === "EMAIL" ? "USER_EMAIL_CHANGED" : "USER_ROLE_CHANGED",
        entity: "user",
        entityId: changeRequest.userId,
        metadata: {
          via: "account_change_request",
          requestId,
          newValue: changeRequest.requestedValue,
          approvedBy: auth.email,
        },
      });
    } else {
      await prisma.accountChangeRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason,
          reviewedById: auth.id,
          reviewedAt: now,
        },
      });
    }

    const typeNl = changeRequest.type === "EMAIL" ? "e-mailadres" : "rol";
    await prisma.notification.create({
      data: {
        userId: changeRequest.userId,
        message:
          action === "APPROVE"
            ? `Je verzoek om je ${typeNl} te wijzigen naar "${changeRequest.requestedValue}" is goedgekeurd.`
            : `Je verzoek om je ${typeNl} te wijzigen is afgewezen.${rejectionReason ? ` Reden: ${rejectionReason}` : ""}`,
        link: "/dashboard/account",
      },
    });

    await writeAuditLog({
      action:
        action === "APPROVE"
          ? "ACCOUNT_CHANGE_REQUEST_APPROVED"
          : "ACCOUNT_CHANGE_REQUEST_REJECTED",
      entity: "account_change_request",
      entityId: requestId,
      metadata: {
        type: changeRequest.type,
        requestedValue: changeRequest.requestedValue,
        userId: changeRequest.userId,
        reviewedBy: auth.email,
        ...(rejectionReason ? { rejectionReason } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CHANGE REQUEST REVIEW ERROR:", error);
    return NextResponse.json({ error: "Beoordelen mislukt." }, { status: 500 });
  }
}
