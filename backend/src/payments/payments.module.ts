import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe/stripe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, MetricsModule, NotificationsModule],
    controllers: [PaymentsController],
    providers: [PaymentsService, StripeService],
    exports: [PaymentsService],
})
export class PaymentsModule {}

