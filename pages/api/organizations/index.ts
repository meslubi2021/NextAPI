import type { NextApiRequest, NextApiResponse } from "next";
import z from "zod";
import { prisma } from "@/lib/prisma";
import { addOrganizationMember } from "@/lib/server/organization";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case "POST":
        return await handlePOST(req, res);
      default:
        res.setHeader("Allow", "POST");
        throw new Error(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    return res.status(400).json({
      data: null,
      error: {
        message: error.message,
      },
    });
  }
}

// Create a new organization
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const schema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    website: z.string().optional(),
    logo: z.string().optional(),
  });

  const response = schema.safeParse(req.body);

  if (!response.success) {
    return res.status(400).json({
      data: null,
      error: response.error.format(),
    });
  }

  const { name, slug, website, logo } = response.data;

  const existingOrganization = await prisma.organization.findUnique({
    where: {
      slug,
    },
  });

  if (existingOrganization) {
    return res.status(400).json({
      data: null,
      error: { message: "Organization already exists" },
    });
  }

  const newOrganization = await prisma.organization.create({
    data: {
      name,
      slug,
      website,
      logo,
    },
  });

  await addOrganizationMember({
    organizationId: newOrganization.id,
    userId: 1,
    role: "admin",
  });

  return res.status(201).json({
    data: newOrganization,
    error: null,
  });
};
