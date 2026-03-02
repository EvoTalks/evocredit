import { describe, expect, it, vi } from 'vitest';
import { UserService } from './user-service';
import { UserPrismaRepository } from '../repositories/prisma/user-prisma-repository';
import { AsaasClient } from '../lib/asaas-client';

describe('UserService', () => {
  it('creates a user with Asaas customer id and default balance', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'user-1' });
    const userRepository = { create } as unknown as UserPrismaRepository;

    const findOrCreateCustomer = vi.fn().mockResolvedValue({ id: 'cus-1' });
    const asaasClient = { findOrCreateCustomer } as unknown as AsaasClient;

    const service = new UserService(userRepository, asaasClient);

    const result = await service.handler({
      name: 'Matheus',
      email: 'matheus@example.com',
      whatsappId: '5511999999999',
      cpfCnpj: '12345678901',
    });

    expect(findOrCreateCustomer).toHaveBeenCalledWith({
      name: 'Matheus',
      cpfCnpj: '12345678901',
    });

    expect(create).toHaveBeenCalledWith({
      name: 'Matheus',
      email: 'matheus@example.com',
      whatsappId: '5511999999999',
      cpfCnpj: '12345678901',
      asaasCustomerId: 'cus-1',
      balance: 0,
    });

    expect(result).toEqual({ user: { id: 'user-1' } });
  });

  it('throws an error when cpfCnpj is provided without name and Asaas client is enabled', async () => {
    const create = vi.fn();
    const userRepository = { create } as unknown as UserPrismaRepository;

    const findOrCreateCustomer = vi.fn();
    const asaasClient = { findOrCreateCustomer } as unknown as AsaasClient;

    const service = new UserService(userRepository, asaasClient);

    await expect(
      service.handler({
        whatsappId: '5511999999999',
        cpfCnpj: '12345678901',
      })
    ).rejects.toThrow('Name is required when creating Asaas customer');

    expect(findOrCreateCustomer).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a user without calling Asaas when asaasCustomerId is already provided', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'user-2' });
    const userRepository = { create } as unknown as UserPrismaRepository;

    const findOrCreateCustomer = vi.fn();
    const asaasClient = { findOrCreateCustomer } as unknown as AsaasClient;

    const service = new UserService(userRepository, asaasClient);

    const result = await service.handler({
      name: 'Matheus',
      email: 'matheus@example.com',
      whatsappId: '5511999999999',
      cpfCnpj: '12345678901',
      asaasCustomerId: 'cus-existing',
    });

    expect(findOrCreateCustomer).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      name: 'Matheus',
      email: 'matheus@example.com',
      whatsappId: '5511999999999',
      cpfCnpj: '12345678901',
      asaasCustomerId: 'cus-existing',
      balance: 0,
    });
    expect(result).toEqual({ user: { id: 'user-2' } });
  });
});
