import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
    imports: [PrismaModule, MetricsModule],
    controllers: [KycController],
    providers: [KycService],
    exports: [KycService],
})
export class KycModule { }
