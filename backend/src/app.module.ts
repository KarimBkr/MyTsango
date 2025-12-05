import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MetricsModule } from './metrics/metrics.module';
import { KycModule } from './kyc/kyc.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module'; // Sprint 2
import { NotificationsModule } from './notifications/notifications.module'; // Sprint 2

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        MetricsModule,
        KycModule,
        AuthModule,  // Phase 2: Authentication module
        PaymentsModule, // Sprint 2: Payments module
        NotificationsModule, // Sprint 2: Notifications module
    ],
})
export class AppModule { }

