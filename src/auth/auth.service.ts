/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, OnModuleInit, Logger, HttpStatus } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from './dto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/confing';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('AuthService');
  constructor(private readonly jwtService: JwtService) {
    super();
  }
  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
  }
  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          username,
        },
      });

      if (!user) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid credentials',
          code: 'NOT_FOUND',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid credentials',
          code: 'INVALID_PASSWORD',
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: ___, ...rest } = user;

      const accessToken = await this.signJWT({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      return {
        user: rest,
        accessToken: accessToken,
      };
    } catch (error) {}
  }

  async register(createUserDto: CreateUserDto) {
    const { username, password, email } = createUserDto;
    console.log('Unhashed password: ', password);

    try {
      const user = await this.user.findUnique({
        where: {
          username,
        },
      });

      if (user) {
        throw new RpcException('User already exists');
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      const newUser = await this.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: ___, ...rest } = newUser;

      // generate new access token
      const accessToken = await this.signJWT({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      });

      return {
        user: rest,
        accessToken: accessToken,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException('Error creating user');
    }
  }

  async verifyUser(accessToken: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify<any>(
        accessToken,
        {
          secret: envs.jwtSecret,
        },
      );

      const newAccessToken = await this.signJWT(user);

      return {
        user: user,
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
  }

  async signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
}
