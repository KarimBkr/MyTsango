import { Controller, Post, Get, Body, Headers, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
    @ApiOperation({ summary: 'Start KYC verification process' })
    @ApiResponse({ status: 201, description: 'KYC verification started', type: KycStartResponseDto })
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
    @ApiOperation({ summary: 'Get KYC verification status' })
    @ApiResponse({ status: 200, description: 'KYC status retrieved', type: KycStatusResponseDto })
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
    @ApiOperation({ summary: 'Sumsub webhook handler' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    async handleSumsubWebhook(
        @Body() payload: SumsubWebhookDto,
        @Headers('x-payload-digest') signature: string,
    ): Promise<{ success: boolean }> {
        await this.kycService.handleWebhook(payload, signature);
        return { success: true };
    }
}
