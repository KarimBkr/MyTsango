import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { SumsubService } from './sumsub.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
    imports: [PrismaModule, MetricsModule],
    controllers: [KycController],
    providers: [KycService, SumsubService],
    exports: [KycService],
})
export class KycModule { }
