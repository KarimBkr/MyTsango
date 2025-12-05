import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Envoie une notification push Expo
     */
    private async sendExpoPushNotification(
        pushToken: string,
        title: string,
        body: string,
        data?: Record<string, any>,
    ): Promise<void> {
        try {
            const response = await axios.post(this.expoApiUrl, {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data: data || {},
                priority: 'high',
            });

            if (response.data.data?.status === 'error') {
                this.logger.error(`Failed to send push notification: ${response.data.data.message}`);
                throw new Error(response.data.data.message);
            }

            this.logger.log(`Push notification sent successfully to ${pushToken}`);
        } catch (error: any) {
            this.logger.error(`Error sending push notification: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Envoie une notification d'invitation à un cercle
     * ⚠️ DÉPENDANCE JIHAD: Circle model
     */
    async sendInvitationNotification(memberId: string, circleId: string): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: memberId },
            });

            if (!user || !user.expoPushToken) {
                this.logger.warn(`User ${memberId} has no push token, skipping notification`);
                return;
            }

            // TODO: Récupérer le nom du cercle après modèle Circle de Jihad
            // const circle = await this.prisma.circle.findUnique({ where: { id: circleId } });
            const circleName = 'Votre cercle'; // Temporaire

            await this.sendExpoPushNotification(
                user.expoPushToken,
                'Nouvelle invitation',
                `Vous avez été invité à rejoindre "${circleName}"`,
                {
                    type: 'INVITATION',
                    circleId,
                },
            );

            this.logger.log(`Invitation notification sent to user ${memberId} for circle ${circleId}`);
        } catch (error: any) {
            this.logger.error(`Failed to send invitation notification: ${error.message}`, error.stack);
            // Ne pas throw pour ne pas bloquer le flux principal
        }
    }

    /**
     * Envoie une notification de paiement dû
     */
    async sendPaymentDueNotification(
        userId: string,
        circleId: string,
        dueDate: Date,
    ): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user || !user.expoPushToken) {
                this.logger.warn(`User ${userId} has no push token, skipping notification`);
                return;
            }

            const dueDateStr = dueDate.toLocaleDateString('fr-FR');

            await this.sendExpoPushNotification(
                user.expoPushToken,
                'Paiement à effectuer',
                `Votre cotisation est due le ${dueDateStr}`,
                {
                    type: 'PAYMENT_DUE',
                    circleId,
                    dueDate: dueDate.toISOString(),
                },
            );

            this.logger.log(`Payment due notification sent to user ${userId} for circle ${circleId}`);
        } catch (error: any) {
            this.logger.error(`Failed to send payment due notification: ${error.message}`, error.stack);
        }
    }

    /**
     * Envoie une notification de paiement réussi
     */
    async sendPaymentSuccessNotification(userId: string, paymentId: string): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user || !user.expoPushToken) {
                this.logger.warn(`User ${userId} has no push token, skipping notification`);
                return;
            }

            await this.sendExpoPushNotification(
                user.expoPushToken,
                'Paiement confirmé',
                'Votre paiement a été traité avec succès',
                {
                    type: 'PAYMENT_SUCCESS',
                    paymentId,
                },
            );

            this.logger.log(`Payment success notification sent to user ${userId} for payment ${paymentId}`);
        } catch (error: any) {
            this.logger.error(`Failed to send payment success notification: ${error.message}`, error.stack);
        }
    }

    /**
     * Met à jour le token Expo push d'un utilisateur
     */
    async updatePushToken(userId: string, pushToken: string): Promise<void> {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { expoPushToken: pushToken },
            });

            this.logger.log(`Push token updated for user ${userId}`);
        } catch (error: any) {
            this.logger.error(`Failed to update push token: ${error.message}`, error.stack);
            throw error;
        }
    }
}

