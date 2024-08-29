import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private authService: AuthService;

  constructor(
    private readonly jwtService: JwtService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.authService = this.moduleRef.get(AuthService, { strict: false });
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      const decodedToken = this.jwtService.verify(token);
      const payload = decodedToken;

      let user = await this.authService.findUserById(payload.userId);

      if (!user) {
        return false;
      }

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Error authenticating user: ${error}, ${error.stack}`);
      return false;
    }
  }
}
