import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './routes/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //CORS config - allow requests from frontend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  // api config
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();

  // swagger config
  const config = new DocumentBuilder()
    .setTitle('Project API')
    .setDescription('API endpoints for my research and freelance projects')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // swagger ui definition
  SwaggerModule.setup('docs', app, documentFactory, {
    useGlobalPrefix: false,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:3000/api/v1`);
  console.log(`Swagger UI available at: http://localhost:3000/docs`);
}
bootstrap();
