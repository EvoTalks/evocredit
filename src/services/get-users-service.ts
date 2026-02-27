import { User } from '@/generated/prisma/browser';
import { UserRepository } from '@/repositories/user-repository';

interface GetUsersServiceResponse {
  users: User[];
}

export class GetUsersService {
  constructor(private userRepository: UserRepository) {}

  async handler(): Promise<GetUsersServiceResponse> {
    const users = await this.userRepository.findAll();

    return { users };
  }
}
