import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { SumsubService } from './sumsub.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [KycController],
    providers: [KycService, SumsubService],
    exports: [KycService],
})
export class KycModule { }
