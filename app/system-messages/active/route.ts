import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredMutationUser();
    if (!user) {
      return NextResponse.json(
        { error: "Geen rechten." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const updated = await prisma.systemMessage.update({
      where: { id },
      data: {
        title: body.title,
        message: body.message,
        severity: body.severity,
        targetDepot: body.targetDepot,
        active: body.active,
        activeFrom: new Date(body.activeFrom),
        activeUntil: body.activeUntil
          ? new Date(body.activeUntil)
          : null,
      },
    });

    console.log("SYSTEM MESSAGE UPDATED:", {
      id,
      user: user.email,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Update mislukt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredMutationUser();
    if (!user) {
      return NextResponse.json(
        { error: "Geen rechten." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const updated = await prisma.systemMessage.update({
      where: { id },
      data: { active: false },
    });

    console.log("SYSTEM MESSAGE DEACTIVATED:", {
      id,
      user: user.email,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Deactiveren mislukt" },
      { status: 500 }
    );
  }
}          ? {
              targetDepot: {
                in: ["ALL", depot],
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sortedMessages = messages.sort((a, b) => {
      const severityDiff =
        severityRank[a.severity] - severityRank[b.severity];

      if (severityDiff !== 0) return severityDiff;

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: sortedMessages.length,
      messages: sortedMessages.map((message) => ({
        id: message.id,
        title: message.title,
        message: message.message,
        severity: message.severity,
        targetDepot: message.targetDepot,
        activeFrom: message.activeFrom,
        activeUntil: message.activeUntil,
      })),
    });
  } catch (error) {
    console.error("ACTIVE SYSTEM MESSAGES ERROR:", error);

    return NextResponse.json(
      { error: "SystemMessages konden niet worden geladen." },
      { status: 500 }
    );
  }
}
