import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly verifier;

  constructor() {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.PoolID,
      tokenUse: 'id',
      clientId: process.env.ClientID,
    });
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    console.log(token);

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.validateToken(token);
  }

  async validateToken(token: string) {
    try {
      const claims = await this.verifier.verify(token);
      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
