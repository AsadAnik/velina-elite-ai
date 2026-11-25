import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from '../addresses.controller';
import { AddressesService } from '../addresses.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CanActivate, ExecutionContext } from '@nestjs/common';

// ---------- Mock Guard to bypass JwtAuthGuard ----------
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    return true;
  }
}

// Mock service with jest functions for each controller method
const serviceMock = {
  getUserAddresses: jest.fn(),
  createAddress: jest.fn(),
  updateAddress: jest.fn(),
  deleteAddress: jest.fn(),
  setDefaultAddress: jest.fn(),
};

describe('AddressesController (integration - other endpoints)', () => {
  let controller: AddressesController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [{ provide: AddressesService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    controller = module.get<AddressesController>(AddressesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /addresses returns user addresses', async () => {
    const mockReq = { user: { customerId: 7 } } as any;
    const mockResult = [{ id: 1, street: 'A St' }];
    serviceMock.getUserAddresses.mockResolvedValueOnce(mockResult);

    const result = await controller.getUserAddresses(mockReq);
    expect(serviceMock.getUserAddresses).toHaveBeenCalledWith(7);
    expect(result).toBe(mockResult);
  });

  it('POST /addresses creates an address', async () => {
    const mockReq = { user: { customerId: 8 } } as any;
    const dto = { street: 'B St', city: 'C' } as any;
    const created = { id: 2, ...dto };
    serviceMock.createAddress.mockResolvedValueOnce(created);

    const result = await controller.createAddress(mockReq, dto);
    expect(serviceMock.createAddress).toHaveBeenCalledWith(8, dto);
    expect(result).toBe(created);
  });

  it('PUT /addresses/:id updates an address', async () => {
    const mockReq = { user: { customerId: 9 } } as any;
    const dto = { street: 'Updated St' } as any;
    const updated = { id: 3, street: 'Updated St' };
    serviceMock.updateAddress.mockResolvedValueOnce(updated);

    const result = await controller.updateAddress(mockReq, '3', dto);
    expect(serviceMock.updateAddress).toHaveBeenCalledWith(9, 3, dto);
    expect(result).toBe(updated);
  });

  it('DELETE /addresses/:id deletes an address', async () => {
    const mockReq = { user: { customerId: 10 } } as any;
    const response = { message: 'Address deleted successfully' };
    serviceMock.deleteAddress.mockResolvedValueOnce(response);

    const result = await controller.deleteAddress(mockReq, '4');
    expect(serviceMock.deleteAddress).toHaveBeenCalledWith(10, 4);
    expect(result).toBe(response);
  });

  it('PUT /addresses/:id/default sets default address', async () => {
    const mockReq = { user: { customerId: 11 } } as any;
    const updated = { id: 5, is_default: true };
    serviceMock.setDefaultAddress.mockResolvedValueOnce(updated);

    const result = await controller.setDefaultAddress(mockReq, '5');
    expect(serviceMock.setDefaultAddress).toHaveBeenCalledWith(11, 5);
    expect(result).toBe(updated);
  });
});
