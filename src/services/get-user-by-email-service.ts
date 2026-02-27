import { User } from '@/generated/prisma/browser';
import { UserRepository } from '@/repositories/user-repository';

interface GetUserByEmailServiceRequest {
  email: string;
}

interface GetUserByEmailServiceResponse {
  user: User | null;
}

export class GetUserByEmailService {
  constructor(private userRepository: UserRepository) {}

  async handler(request: GetUserByEmailServiceRequest): Promise<GetUserByEmailServiceResponse> {
    const user = await this.userRepository.findByEmail(request.email);

    return { user };
  }
}
