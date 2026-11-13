import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async login(username: string, pass: string) {
    const users = await this.dataSource.query(
      `
      SELECT u.id, u.username, u.password, r.nama_role AS role
      FROM "user" u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.username = $1
      LIMIT 1
      `,
      [username],
    );

    const user = users[0];
    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}

