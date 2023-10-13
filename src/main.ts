import { NestFactory } from '@nestjs/core';
import { OpenaiModule } from './openai.module';

async function bootstrap() {
  const app = await NestFactory.create(OpenaiModule);
  await app.listen(3001);
}
bootstrap();
