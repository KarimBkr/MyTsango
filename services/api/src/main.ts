import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Importations pour config globale
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // 1. Sécurité de base
    app.use(helmet());  // Helmet aide à définir des en-têtes HTTP sécurisés (protection basique contre certaines attaques XSS/CSRF)
    app.enableCors();   // Active CORS (Cross-Origin Resource Sharing) pour accepter les requêtes du front (mobile) même si domaine différent.

    // 2. Validation des DTOs
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,    // Supprime les propriétés non attendues du DTO (sécurité)
        forbidNonWhitelisted: false, // (si true, rejetterait la requête en cas de props non attendues)
        transform: true     // Convertit les types primaires (ex: strings en numbers) selon les métadatas des DTOs
    }));

    // 3. Swagger (documentation API)
    const config = new DocumentBuilder()
        .setTitle('API Monorepo')
        .setDescription("Documentation de l'API (Swagger)")
        .setVersion('1.0')
        .addBearerAuth()  // on prévoit d'utiliser un token Bearer JWT pour auth
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    // Désormais, en lançant l'API, vous pourrez consulter http://localhost:3000/api-docs 
    // pour voir l'interface Swagger UI interactive.

    // 4. Endpoint de santé/métriques simplifié (en attendant une intégration prom-client)
    app.getHttpAdapter().get('/metrics', (_, res) => {
        res.type('text/plain');
        res.send('app_running 1');
    });
    // Ci-dessus, on crée une route '/metrics' renvoyant du texte. Ici on envoie juste 'app_running 1' 
    // qui est une métrique custom minimaliste. C'est pour s'assurer que Prometheus ait quelque chose 
    // à scraper sans erreur 404. Idéalement, on intégrera un vrai système de métriques plus tard.

    await app.listen(3000);
    console.log('API backend démarrée sur http://0.0.0.0:3000 (Swagger disponible sur /api-docs)');
}
bootstrap();
