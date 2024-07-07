import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from './dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @MessagePattern('auth.register.user')
  registerUser(@Payload() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @MessagePattern('auth.verify.user')
  verifyUser(@Payload() accessToken: { accessToken: string }) {
    return this.authService.verifyUser(accessToken.accessToken);
  }
}
