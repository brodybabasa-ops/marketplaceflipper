import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { customerProfile: true, mechanicProfile: true },
  });
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        status: "ACTIVE",
      },
    });

    if (input.role === "CUSTOMER") {
      await tx.customerProfile.create({ data: { userId: user.id } });
    }

    if (input.role === "MECHANIC") {
      const base = slugify(`${input.firstName} ${input.lastName} auto`) || "mechanic";
      let slug = base;
      let i = 1;
      while (await tx.mechanicProfile.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
      }
      await tx.mechanicProfile.create({
        data: {
          userId: user.id,
          slug,
          businessName: `${input.firstName}'s Auto`,
          bio: "Tell customers about your experience, the vehicles you work on, and how you show up.",
          latitude: 40.7608,
          longitude: -111.891,
          shopCity: "Salt Lake City",
          shopState: "UT",
          shopZip: "84101",
          onboardingStep: 1,
          profileCompletePct: 15,
        },
      });
    }

    return user;
  });
}
