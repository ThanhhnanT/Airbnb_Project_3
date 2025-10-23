import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService  = app.get(ConfigService)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  const port = configService.get('PORT')

  const config = new DocumentBuilder()
    .setTitle('AirBnB api')
    .setDescription('API Documentation for AirBnB simple version')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app,config)

  SwaggerModule.setup('api', app, document)
  await app.listen(port ?? 3000);
}
bootstrap();
