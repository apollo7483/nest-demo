import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
const AWS = require('aws-sdk');
const OpenAI = require('openai');

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

const secretsManager = new AWS.SecretsManager({ region: process.env.region });
const MAX_ROLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 2000;

@Controller('/')
@UseGuards(JwtAuthGuard)
export class OpenaiController {
  @Post()
  async handleOpenAIRequest(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const userRole = req.body.role;
    const userMessage = req.body.message;

    if (!userRole) {
      throw new HttpException('Role is required', HttpStatus.BAD_REQUEST);
    }

    if (userRole.length > MAX_ROLE_LENGTH) {
      throw new HttpException(
        'Role exceeds maximum length',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!userMessage || userMessage.length > MAX_MESSAGE_LENGTH) {
      throw new HttpException(
        'Message is either missing or exceeds maximum length',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const apiKey = await this.getApiKeyFromSecretsManager(
        process.env.SECRET_NAME,
      );
      const openai = new OpenAI({ apiKey });

      const messages = [
        { role: 'system', content: userRole },
        { role: 'user', content: req.body.message },
      ];

      const completion = await openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
        max_tokens: 300,
      });

      const responseMessage = completion.choices[0].message.content;
      return res.json({ message: responseMessage });
    } catch (error) {
      console.error('Error:', error.message);
      throw new HttpException(
        'An error occurred. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getApiKeyFromSecretsManager(name: string): Promise<string> {
    try {
      const secret = await secretsManager
        .getSecretValue({ SecretId: name })
        .promise();
      if ('SecretString' in secret) {
        return JSON.parse(secret.SecretString).key;
      }
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Error fetching API Key from Secrets Manager',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
