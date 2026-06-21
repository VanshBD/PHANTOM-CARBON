import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';

/** Safe user fields returned after successful credential validation. */
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Validate email/password credentials against the database.
 * Returns safe user fields only — passwordHash is never exposed.
 *
 * @param credentials - Raw credentials object from the login form
 * @returns Authenticated user or null when validation fails
 */
export async function validateUserCredentials(
  credentials: unknown
): Promise<AuthenticatedUser | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user) return null;

  const passwordValid = await bcryptjs.compare(password, user.passwordHash);
  if (!passwordValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
