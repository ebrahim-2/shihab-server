import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'skip-this-in-production',
      signOptions: { expiresIn: '30d' },
    }),
  ],
})
export class JwtModuleWrapper {}
