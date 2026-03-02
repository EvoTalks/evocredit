import { ConsultationLog } from '@/generated/prisma/browser';
import { env } from '@/env';
import { NeocrediClient } from '@/lib/neocredi-client';
import { ConsultationLogRepository } from '@/repositories/consultation-log-repository';
import { TransactionRepository } from '@/repositories/transaction-repository';
import { UserRepository } from '@/repositories/user-repository';

interface CreateConsultationRequest {
  whatsappId: string;
  type: 'cpf' | 'cnpj';
  document: string;
  emailSolicitante: string;
}

interface CreateConsultationResponse {
  consultationLog: ConsultationLog;
}

export class CreateConsultationService {
  constructor(
    private userRepository: UserRepository,
    private consultationLogRepository: ConsultationLogRepository,
    private transactionRepository: TransactionRepository,
    private neocrediClient: NeocrediClient
  ) {}

  async handler({ whatsappId, type, document, emailSolicitante }: CreateConsultationRequest): Promise<CreateConsultationResponse> {
    const user = await this.userRepository.findByWhatsappId(whatsappId);

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const cost = env.CONSULTATION_COST;

    if (Number(user.balance) < cost) {
      throw Object.assign(new Error('Insufficient balance'), { statusCode: 422 });
    }

    const analiseMotorId = env.NEOCREDI_ANALISE_MOTOR_ID;

    const endpoint = `/empresa-esteira-solicitacao/${analiseMotorId}/integracao`;

    const neocrediResponse = await this.neocrediClient.initiate(analiseMotorId, document, emailSolicitante);

    const consultationLog = await this.consultationLogRepository.create({
      provider: 'NEOCREDI',
      endpoint,
      inputData: { documento: document, type, id_analise_motor: analiseMotorId },
      outputData: neocrediResponse,
      cost,
      status: 'PENDING',
      user: { connect: { id: user.id } },
    });

    await this.userRepository.decrementBalance(user.id, cost);

    await this.transactionRepository.create({
      amount: -cost,
      type: 'CONSUMPTION',
      description: `Consulta ${type.toUpperCase()} - ${document}`,
      user: { connect: { id: user.id } },
      consultation: { connect: { id: consultationLog.id } },
    });

    return { consultationLog };
  }
}
