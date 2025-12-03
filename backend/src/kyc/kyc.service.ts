import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { KycStatus } from '@prisma/client';
import { KycStartResponseDto, KycStatusResponseDto, SumsubWebhookDto } from './dto/kyc.dto';
import * as crypto from 'crypto';

@Injectable()
export class KycService {
    private readonly logger = new Logger(KycService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly metrics: MetricsService,
    ) { }

    /**
     * Phase 1: Start KYC verification (MOCKED)
     * Phase 2: Will call real Sumsub API
     */
    async startKycVerification(userId: string): Promise<KycStartResponseDto> {
        const timer = this.metrics.kycDurationSeconds.startTimer({ operation: 'start' });
        this.metrics.kycRequestsTotal.inc({ endpoint: 'start' });

        try {
            this.logger.log(`Starting KYC verification for user ${userId}`);

            // Check if KYC already exists
            let kycVerification = await this.prisma.kycVerification.findFirst({
                where: { userId },
            });

            // Phase 1: MOCK - Generate fake applicant ID and token
            const mockApplicantId = `mock-applicant-${Date.now()}`;
            const mockToken = `mock-sdk-token-${crypto.randomBytes(16).toString('hex')}`;

            if (!kycVerification) {
                // Create new KYC verification record
                kycVerification = await this.prisma.kycVerification.create({
                    data: {
                        userId,
                        applicantId: mockApplicantId,
                        status: KycStatus.PENDING,
                        reviewStatus: 'init',
                    },
                });

                // Audit log
                await this.prisma.auditLog.create({
                    data: {
                        userId,
                        action: 'kyc_started',
                        details: { applicantId: mockApplicantId },
                    },
                });
            }

            this.metrics.kycSuccessTotal.inc({ status: 'started' });
            this.logger.log(`KYC started successfully for user ${userId}, applicantId: ${mockApplicantId}`);

            return {
                token: mockToken,
                applicantId: mockApplicantId,
            };
        } catch (error) {
            this.metrics.kycFailureTotal.inc({ reason: 'start_error' });
            this.logger.error(`Failed to start KYC for user ${userId}`, error.stack);
            throw error;
        } finally {
            timer();
        }
    }

    /**
     * Get KYC status for a user
     */
    async getKycStatus(userId: string): Promise<KycStatusResponseDto> {
        this.metrics.kycRequestsTotal.inc({ endpoint: 'status' });

        const kycVerification = await this.prisma.kycVerification.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!kycVerification) {
            return {
                status: KycStatus.NONE,
                applicantId: null,
                updatedAt: new Date(),
            };
        }

        return {
            status: kycVerification.status,
            applicantId: kycVerification.applicantId,
            updatedAt: kycVerification.updatedAt,
        };
    }

    /**
     * Handle Sumsub webhook
     * Validates HMAC signature and updates KYC status
     */
    async handleWebhook(payload: SumsubWebhookDto, signature: string): Promise<void> {
        const timer = this.metrics.kycDurationSeconds.startTimer({ operation: 'webhook' });
        this.metrics.kycRequestsTotal.inc({ endpoint: 'webhook' });

        try {
            this.logger.log(`Received webhook for applicant ${payload.applicantId}`);

            // Phase 1: Basic signature validation (mocked)
            // Phase 2: Will implement real HMAC validation with SUMSUB_WEBHOOK_SECRET
            const isValidSignature = this.validateWebhookSignature(payload, signature);
            if (!isValidSignature) {
                this.logger.warn(`Invalid webhook signature for applicant ${payload.applicantId}`);
                this.metrics.kycFailureTotal.inc({ reason: 'invalid_signature' });
                throw new BadRequestException('Invalid webhook signature');
            }

            // Find KYC verification by applicantId
            const kycVerification = await this.prisma.kycVerification.findUnique({
                where: { applicantId: payload.applicantId },
            });

            if (!kycVerification) {
                this.logger.warn(`KYC verification not found for applicant ${payload.applicantId}`);
                return;
            }

            // Idempotency check
            if (payload.correlationId && kycVerification.webhookEventId === payload.correlationId) {
                this.logger.log(`Webhook already processed: ${payload.correlationId}`);
                return;
            }

            // Determine new status based on review result
            let newStatus = kycVerification.status;
            const reviewAnswer = payload.reviewResult?.reviewAnswer;

            if (reviewAnswer === 'GREEN') {
                newStatus = KycStatus.APPROVED;
            } else if (reviewAnswer === 'RED') {
                newStatus = KycStatus.REJECTED;
            } else if (payload.reviewStatus === 'pending') {
                newStatus = KycStatus.PENDING;
            }

            // Update KYC verification
            await this.prisma.kycVerification.update({
                where: { id: kycVerification.id },
                data: {
                    status: newStatus,
                    reviewStatus: payload.reviewStatus,
                    reviewResult: payload.reviewResult as any,
                    rejectReason: payload.reviewResult?.rejectLabels?.join(', '),
                    webhookEventId: payload.correlationId,
                    approvedAt: newStatus === KycStatus.APPROVED ? new Date() : undefined,
                    rejectedAt: newStatus === KycStatus.REJECTED ? new Date() : undefined,
                },
            });

            // Audit log
            await this.prisma.auditLog.create({
                data: {
                    userId: kycVerification.userId,
                    action: newStatus === KycStatus.APPROVED ? 'kyc_approved' :
                        newStatus === KycStatus.REJECTED ? 'kyc_rejected' : 'kyc_updated',
                    details: payload as any,
                },
            });

            this.metrics.kycSuccessTotal.inc({ status: newStatus.toLowerCase() });
            this.logger.log(`KYC status updated to ${newStatus} for applicant ${payload.applicantId}`);

            // Phase 2: Update user role to ORGANIZER if approved
            // await this.updateUserRole(kycVerification.userId, newStatus);

        } catch (error) {
            this.metrics.kycFailureTotal.inc({ reason: 'webhook_error' });
            this.logger.error(`Webhook processing failed for applicant ${payload.applicantId}`, error.stack);
            throw error;
        } finally {
            timer();
        }
    }

    /**
     * Validate webhook HMAC signature
     * Phase 1: Basic validation (always returns true for testing)
     * Phase 2: Real HMAC-SHA256 validation
     */
    private validateWebhookSignature(payload: SumsubWebhookDto, signature: string): boolean {
        // Phase 1: Mock validation
        if (process.env.NODE_ENV === 'development') {
            return true; // Accept all signatures in development
        }

        // Phase 2: Real validation
        // const secret = process.env.SUMSUB_WEBHOOK_SECRET;
        // const hmac = crypto.createHmac('sha256', secret);
        // hmac.update(JSON.stringify(payload));
        // const expectedSignature = hmac.digest('hex');
        // return signature === expectedSignature;

        return true;
    }
}
