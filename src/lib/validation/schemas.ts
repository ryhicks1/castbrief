import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  role: z.enum(["agent", "client", "talent"], { message: "Please select a role" }),
  fullName: z.string().min(1, "Full name is required"),
  agencyName: z.string().optional(),
});

export const packageRequestSchema = z.object({
  agentEmails: z.array(z.string().email()).min(1, "At least one agent is required"),
  roleIds: z.array(z.string().uuid()).optional(),
  brief: z.string().max(2000).optional(),
});

export const sendPackageSchema = z.object({
  packageId: z.string().uuid("Invalid package ID"),
  recipientEmail: z.string().email("Please enter a valid recipient email"),
  recipientName: z.string().optional(),
});

export const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  brief: z.string().max(500).optional(),
});

export const talentSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  age: z.number().int().min(0).max(120).optional().nullable(),
  location: z.string().optional().nullable(),
  cultural_background: z.string().optional().nullable(),
  height_cm: z.number().min(0).max(300).optional().nullable(),
  weight_kg: z.number().min(0).max(500).optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
});
