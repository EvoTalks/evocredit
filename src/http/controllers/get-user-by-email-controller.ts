import { Request, Response } from 'express';
import z from 'zod';
import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { GetUserByEmailService } from '@/services/get-user-by-email-service';

const querySchema = z.object({
  email: z.string().email(),
});

export const getUserByEmailController = async (request: Request, response: Response) => {
  try {
    const { email } = querySchema.parse(request.query);

    const userService = new GetUserByEmailService(new UserPrismaRepository());
    const { user } = await userService.handler({ email });

    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    return response.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
