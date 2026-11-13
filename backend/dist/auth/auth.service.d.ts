import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private dataSource;
    private jwtService;
    constructor(dataSource: DataSource, jwtService: JwtService);
    login(username: string, pass: string): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            role: any;
        };
    }>;
}
