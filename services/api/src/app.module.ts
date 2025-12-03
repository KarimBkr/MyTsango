import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { KycModule } from './kyc/kyc.module';

@Module({
    imports: [AuthModule, UsersModule, KycModule],
    controllers: [],   // on peut définir un AppController global plus tard si nécessaire
    providers: []     // AppService global éventuellement
})
export class AppModule { }
