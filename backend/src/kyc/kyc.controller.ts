import { Controller, Get, Post, Query, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { KycStartResponseDto, KycStatusResponseDto, SumsubWebhookDto } from './dto/kyc.dto';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
    constructor(private readonly kycService: KycService) { }

    /**
     * Phase 1: Start KYC verification (no JWT guard)
     * Phase 2: Add @UseGuards(JwtAuthGuard) and get userId from req.user
     */
    @Post('start')
    @ApiOperation({ summary: 'Start KYC verification process' })
    @ApiQuery({ name: 'userId', description: 'User ID (temporary for Phase 1)', required: true })
    @ApiResponse({ status: 200, description: 'KYC verification started', type: KycStartResponseDto })
    async startKyc(@Query('userId') userId: string): Promise<KycStartResponseDto> {
        return this.kycService.startKycVerification(userId);
    }

    /**
     * Phase 1: Get KYC status (no JWT guard)
     * Phase 2: Add @UseGuards(JwtAuthGuard) and get userId from req.user
     */
    @Get('status')
    @ApiOperation({ summary: 'Get KYC verification status' })
    @ApiQuery({ name: 'userId', description: 'User ID (temporary for Phase 1)', required: true })
    @ApiResponse({ status: 200, description: 'KYC status retrieved', type: KycStatusResponseDto })
    async getKycStatus(@Query('userId') userId: string): Promise<KycStatusResponseDto> {
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
