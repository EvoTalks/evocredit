import { Request, Response } from 'express';
import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { GetUsersService } from '@/services/get-users-service';

export const getUsersController = async (_request: Request, response: Response) => {
  try {
    const userService = new GetUsersService(new UserPrismaRepository());
    const { users } = await userService.handler();

    return response.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
