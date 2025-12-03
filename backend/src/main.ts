import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS configuration for mobile app
    app.enableCors({
        origin: true, // Allow all origins in development (restrict in production)
        credentials: true,
    });

    // Swagger API documentation
    const config = new DocumentBuilder()
        .setTitle('MyTsango API')
        .setDescription('MyTsango Backend API - KYC & Tontine Management')
        .setVersion('1.0')
        .addBearerAuth() // For Phase 2 JWT
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 MyTsango API running on http://localhost:${port}`);
    console.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
    console.log(`📊 Metrics available at http://localhost:${port}/metrics`);
}
bootstrap();
