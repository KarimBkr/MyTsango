import { Controller, Post, Get, Body, Headers, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiBody } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { KycStartResponseDto, KycStatusResponseDto, SumsubWebhookDto } from './dto/kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
    constructor(private readonly kycService: KycService) { }

    /**
     * Phase 2: Start KYC verification (protected with JWT)
     */
    @UseGuards(JwtAuthGuard)
    @Post('start')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Start KYC verification process',
        description: 'Initiates a KYC verification for the authenticated user. Creates a Sumsub applicant and returns an SDK token for the mobile WebView. Requires JWT authentication.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'KYC verification started successfully', 
        type: KycStartResponseDto,
        schema: {
            example: {
                token: 'mock-sdk-token-abc123',
                applicantId: 'mock-applicant-456'
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
    async startKyc(@Request() req: any): Promise<KycStartResponseDto> {
        const userId = req.user.id;
        return this.kycService.startKycVerification(userId);
    }

    /**
     * Phase 2: Get KYC status (protected with JWT)
     */
    @UseGuards(JwtAuthGuard)
    @Get('status')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get KYC verification status',
        description: 'Retrieves the current KYC verification status for the authenticated user. Returns NONE if no KYC has been started. Requires JWT authentication.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'KYC status retrieved successfully', 
        type: KycStatusResponseDto,
        schema: {
            example: {
                status: 'PENDING',
                applicantId: 'mock-applicant-456',
                updatedAt: '2025-12-03T12:00:00Z'
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
    async getKycStatus(@Request() req: any): Promise<KycStatusResponseDto> {
        const userId = req.user.id;
        return this.kycService.getKycStatus(userId);
    }

    /**
     * Sumsub webhook endpoint (public, no auth)
     */
    @Post('/webhooks/sumsub')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Sumsub webhook handler',
        description: 'Public endpoint to receive webhooks from Sumsub when a KYC review is completed. Validates HMAC signature and updates user KYC status. Handles idempotency via correlationId.'
    })
    @ApiHeader({ 
        name: 'x-payload-digest', 
        description: 'HMAC-SHA256 signature of the payload',
        required: true,
        example: 'sha256=abc123...'
    })
    @ApiBody({ 
        type: SumsubWebhookDto,
        description: 'Webhook payload from Sumsub',
        examples: {
            approved: {
                summary: 'Approved KYC',
                value: {
                    applicantId: 'applicant-123',
                    correlationId: 'event-456',
                    reviewStatus: 'completed',
                    reviewResult: {
                        reviewAnswer: 'GREEN'
                    }
                }
            },
            rejected: {
                summary: 'Rejected KYC',
                value: {
                    applicantId: 'applicant-123',
                    correlationId: 'event-789',
                    reviewStatus: 'completed',
                    reviewResult: {
                        reviewAnswer: 'RED',
                        rejectLabels: ['DOCUMENT_MISSING', 'LOW_QUALITY']
                    }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Webhook processed successfully',
        schema: {
            example: {
                success: true
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
    @ApiResponse({ status: 403, description: 'Invalid HMAC signature' })
    async handleSumsubWebhook(
        @Body() payload: SumsubWebhookDto,
        @Headers('x-payload-digest') signature: string,
    ): Promise<{ success: boolean }> {
        await this.kycService.handleWebhook(payload, signature);
        return { success: true };
    }
}
