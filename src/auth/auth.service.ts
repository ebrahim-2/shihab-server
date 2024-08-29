import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password } = createUserDto;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
      });

      const token = this.jwtService.sign({
        userId: user.id,
      });

      user.token = token;
      await user.save();

      return user;
    } catch (error) {
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    try {
      const { email, password } = loginUserDto;

      const user = await this.userModel.findOne({ where: { email } });

      if (user === null) {
        new UnauthorizedException('User not found');
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        new UnauthorizedException('Incorrect password');
      }

      const token = this.jwtService.sign({
        userId: user.id,
      });

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async findUserById(id: number): Promise<User> {
    try {
      const user = await this.userModel.findOne({
        where: { id },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }
}
