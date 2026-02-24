import { User } from '@/generated/prisma/browser';
import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { AsaasClient } from '@/lib/asaas-client';

interface UserServiceRequest {
  name?: string;
  whatsappId: string;
  cpfCnpj?: string;
  asaasCustomerId?: string;
  balance: number;
}

interface UserServiceResponse {
  user: User;
}

export class UserService {
  constructor(
    private userRepository: UserPrismaRepository,
    private asaasClient?: AsaasClient
  ) {}

  async handler(request: UserServiceRequest): Promise<UserServiceResponse> {
    let asaasCustomerId = request.asaasCustomerId;

    // Se temos um Asaas client e CPF/CNPJ, buscar ou criar o cliente no Asaas
    if (this.asaasClient && request.cpfCnpj && !asaasCustomerId) {
      if (!request.name) {
        throw new Error('Name is required when creating Asaas customer');
      }

      const asaasCustomer = await this.asaasClient.findOrCreateCustomer({
        name: request.name,
        cpfCnpj: request.cpfCnpj,
      });

      asaasCustomerId = asaasCustomer.id;
    }

    const user = await this.userRepository.create({
      ...request,
      asaasCustomerId,
    });

    return { user };
  }
}
