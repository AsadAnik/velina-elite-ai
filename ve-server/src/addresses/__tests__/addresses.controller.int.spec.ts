import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from '../addresses.controller';
import { AddressesService } from '../addresses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CanActivate, ExecutionContext } from '@nestjs/common';

// ---------- Mock Guard to bypass JwtAuthGuard ----------
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // Simply allow every request
    return true;
  }
}

// Mock Prisma – same shape as unit test
const prismaMock = {
  address: {
    create: jest.fn().mockResolvedValue({
      id: 2,
      street: '456 Side Ave',
      city: 'Gotham',
    }),
    findMany: jest.fn().mockResolvedValue([]),
  },
};

describe('AddressesController (integration)', () => {
  let controller: AddressesController;
  let service: AddressesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: prismaMock },
        // Provide mock guard as a provider (optional, not needed for overrideGuard)
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    controller = module.get<AddressesController>(AddressesController);
    service = module.get<AddressesService>(AddressesService);
  });

  it('POST /addresses delegates to service and returns result', async () => {
    const customerId = 99;
    const dto = {
      street: '456 Side Ave',
      city: 'Gotham',
    } as any;

    const mockReq = { user: { customerId } } as any;

    const result = await controller.createAddress(mockReq, dto);

    expect(prismaMock.address.create).toHaveBeenCalledWith({
      data: {
        customer_id: customerId,
        ...dto,
        is_default: false,
      },
    });
    expect(result).toMatchObject({ id: 2, street: '456 Side Ave', city: 'Gotham' });
  });
});