import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('push-token')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Mettre à jour le token Expo push',
        description: 'Enregistre ou met à jour le token Expo push notification pour l\'utilisateur connecté. Requiert JWT.',
    })
    @ApiResponse({
        status: 200,
        description: 'Token mis à jour avec succès',
        schema: {
            example: {
                success: true,
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
    async updatePushToken(
        @Request() req: any,
        @Body() dto: UpdatePushTokenDto,
    ): Promise<{ success: boolean }> {
        const userId = req.user.id;
        await this.notificationsService.updatePushToken(userId, dto.pushToken);
        return { success: true };
    }
}

