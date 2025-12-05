import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
    let controller: NotificationsController;
    let service: NotificationsService;

    const mockNotificationsService = {
        updatePushToken: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        controller = module.get<NotificationsController>(NotificationsController);
        service = module.get<NotificationsService>(NotificationsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updatePushToken', () => {
        it('should call service and return success', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const dto = { pushToken: 'ExponentPushToken[test123]' };

            mockNotificationsService.updatePushToken.mockResolvedValue(undefined);

            const result = await controller.updatePushToken(mockRequest, dto);

            expect(service.updatePushToken).toHaveBeenCalledWith('test-user-123', dto.pushToken);
            expect(result).toEqual({ success: true });
        });

        it('should throw error if service fails', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const dto = { pushToken: 'ExponentPushToken[test123]' };

            mockNotificationsService.updatePushToken.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(controller.updatePushToken(mockRequest, dto)).rejects.toThrow(
                'Database error',
            );
        });
    });
});

