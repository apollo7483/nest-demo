import { Module } from '@nestjs/common';
import { OpenaiController } from './openai.controller';

@Module({
  controllers: [OpenaiController]
})
export class OpenaiModule {}
