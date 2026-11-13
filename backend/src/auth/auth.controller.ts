import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username?: string; password?: string }) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Username dan password wajib diisi');
    }
    return this.authService.login(body.username, body.password);
  }
}

