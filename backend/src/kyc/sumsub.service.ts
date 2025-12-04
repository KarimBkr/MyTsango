import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface SumsubApplicant {
    id: string;
    inspectionId: string;
    externalUserId: string;
}

interface SumsubAccessToken {
    token: string;
    userId: string;
}

interface SumsubApplicantStatus {
    reviewStatus: string;
    reviewResult?: {
        reviewAnswer: string;
        rejectLabels?: string[];
    };
}

@Injectable()
export class SumsubService {
    private readonly logger = new Logger(SumsubService.name);
    private readonly axiosInstance: AxiosInstance;
    private readonly appToken: string;
    private readonly secretKey: string;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.appToken = this.configService.get('SUMSUB_APP_TOKEN') || '';
        this.secretKey = this.configService.get('SUMSUB_SECRET_KEY') || '';
        this.baseUrl = this.configService.get('SUMSUB_BASE_URL', 'https://api.sumsub.com');

        if (!this.appToken || !this.secretKey) {
            this.logger.warn('Sumsub credentials not configured, API calls will fail');
        }

        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            timeout: 15000,
        });
    }

    /**
     * Sign request with HMAC SHA256 according to Sumsub docs
     * https://developers.sumsub.com/api-reference/#app-tokens
     */
    private signRequest(method: string, url: string, timestamp: number, body?: string): string {
        const bodyStr = body || '';
        const message = `${timestamp}${method.toUpperCase()}${url}${bodyStr}`;

        this.logger.debug(`Signing request: ${message.substring(0, 100)}...`);

        return crypto
            .createHmac('sha256', this.secretKey)
            .update(message)
            .digest('hex');
    }

    /**
     * Make authenticated request to Sumsub API
     */
    private async makeRequest<T>(
        method: 'GET' | 'POST',
        path: string,
        body?: any,
    ): Promise<T> {
        const timestamp = Math.floor(Date.now() / 1000);
        const bodyStr = body ? JSON.stringify(body) : '';
        const signature = this.signRequest(method, path, timestamp, bodyStr);

        const config: AxiosRequestConfig = {
            method,
            url: path,
            headers: {
                'X-App-Token': this.appToken,
                'X-App-Access-Ts': timestamp.toString(),
                'X-App-Access-Sig': signature,
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            config.data = body;
        }

        try {
            this.logger.debug(`Sumsub ${method} ${path}`);
            const response = await this.axiosInstance.request<T>(config);
            this.logger.debug(`Sumsub response: ${JSON.stringify(response.data).substring(0, 200)}`);
            return response.data;
        } catch (error: any) {
            this.logger.error(
                `Sumsub API error: ${error.message}`,
                error.response?.data,
            );
            throw new Error(
                `Sumsub API error: ${error.response?.data?.description || error.message}`,
            );
        }
    }

    /**
     * Create a new applicant in Sumsub
     * https://developers.sumsub.com/api-reference/#creating-an-applicant
     */
    async createApplicant(externalUserId: string, levelName = 'basic-kyc-level'): Promise<SumsubApplicant> {
        this.logger.log(`Creating applicant for user: ${externalUserId}`);

        const payload = {
            externalUserId,
            levelName,
        };

        const response = await this.makeRequest<SumsubApplicant>(
            'POST',
            '/resources/applicants?levelName=' + levelName,
            payload,
        );

        this.logger.log(`Applicant created: ${response.id}`);
        return response;
    }

    /**
     * Generate SDK access token for applicant
     * https://developers.sumsub.com/api-reference/#access-tokens-for-sdks
     */
    async getSdkAccessToken(
        externalUserId: string,
        levelName = 'basic-kyc-level',
        ttlInSecs = 600,
    ): Promise<SumsubAccessToken> {
        this.logger.log(`Generating SDK token for user: ${externalUserId}`);

        const response = await this.makeRequest<SumsubAccessToken>(
            'POST',
            `/resources/accessTokens?userId=${externalUserId}&levelName=${levelName}&ttlInSecs=${ttlInSecs}`,
        );

        this.logger.log(`SDK token generated for user: ${response.userId}`);
        return response;
    }

    /**
     * Get applicant status from Sumsub
     * https://developers.sumsub.com/api-reference/#getting-applicant-status-sdk
     */
    async getApplicantStatus(applicantId: string): Promise<SumsubApplicantStatus> {
        this.logger.log(`Fetching status for applicant: ${applicantId}`);

        const response = await this.makeRequest<SumsubApplicantStatus>(
            'GET',
            `/resources/applicants/${applicantId}/status`,
        );

        this.logger.log(`Applicant status: ${response.reviewStatus}`);
        return response;
    }
}
