import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModuleWrapper } from './jwt.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
