import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, register } from 'prom-client';

@Injectable()
export class MetricsService {
    private readonly registry: Registry;

    // KYC Metrics
    public readonly kycRequestsTotal: Counter;
    public readonly kycSuccessTotal: Counter;
    public readonly kycFailureTotal: Counter;
    public readonly kycDurationSeconds: Histogram;

    // Payments Metrics (Sprint 2)
    public readonly paymentsTotal: Counter;
    public readonly paymentsSuccessTotal: Counter;
    public readonly paymentsFailureTotal: Counter;
    public readonly paymentsDurationSeconds: Histogram;

    constructor() {
        this.registry = register;

        // Counter: Total KYC requests
        this.kycRequestsTotal = new Counter({
            name: 'kyc_requests_total',
            help: 'Total number of KYC verification requests',
            labelNames: ['endpoint'],
            registers: [this.registry],
        });

        // Counter: Successful KYC verifications
        this.kycSuccessTotal = new Counter({
            name: 'kyc_success_total',
            help: 'Total number of successful KYC verifications',
            labelNames: ['status'],
            registers: [this.registry],
        });

        // Counter: Failed KYC verifications
        this.kycFailureTotal = new Counter({
            name: 'kyc_failure_total',
            help: 'Total number of failed KYC verifications',
            labelNames: ['reason'],
            registers: [this.registry],
        });

        // Histogram: KYC operation duration
        this.kycDurationSeconds = new Histogram({
            name: 'kyc_duration_seconds',
            help: 'Duration of KYC operations in seconds',
            labelNames: ['operation'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.registry],
        });

        // Counter: Total payment requests (Sprint 2)
        this.paymentsTotal = new Counter({
            name: 'payments_total',
            help: 'Total number of payment requests',
            labelNames: ['status'],
            registers: [this.registry],
        });

        // Counter: Successful payments
        this.paymentsSuccessTotal = new Counter({
            name: 'payments_success_total',
            help: 'Total number of successful payments',
            labelNames: ['status'],
            registers: [this.registry],
        });

        // Counter: Failed payments
        this.paymentsFailureTotal = new Counter({
            name: 'payments_failure_total',
            help: 'Total number of failed payments',
            labelNames: ['reason'],
            registers: [this.registry],
        });

        // Histogram: Payment operation duration
        this.paymentsDurationSeconds = new Histogram({
            name: 'payments_duration_seconds',
            help: 'Duration of payment operations in seconds',
            labelNames: ['operation'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.registry],
        });
    }

    getMetrics(): Promise<string> {
        return this.registry.metrics();
    }
}
