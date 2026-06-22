import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Application entry point. Bootstraps the NestJS app, enables CORS for the
 * frontend, installs a strict global validation pipe, and starts the HTTP
 * server on the configured port.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Allow the Next.js frontend (separate origin) to call this API.
  app.enableCors();

  // Validate and sanitise all incoming DTOs globally.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in the DTO
      forbidNonWhitelisted: true, // reject unexpected properties
      transform: true, // coerce payloads to DTO types
    }),
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Build interactive API documentation (Swagger UI) served at /docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blockchain Delivery API')
    .setDescription(
      'REST API for the blockchain-based delivery management system. ' +
        'All delivery state transitions are recorded on-chain via the backend.',
    )
    .setVersion('1.0')
    .addServer(`/${globalPrefix}`) 
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT') ?? 3001);
  await app.listen(port);

  // Print the running server URLs so they're easy to open from the terminal.
  const logger = new Logger('Bootstrap');
  logger.log(`API base URL       http://localhost:${port}/${globalPrefix}`);
  logger.log(`API docs (Swagger) http://localhost:${port}/docs`);
}

// Start the application; surface any fatal bootstrap error.
void bootstrap();
