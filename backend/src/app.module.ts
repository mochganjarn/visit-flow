import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { MasterEntity } from './entities/master-entity.entity';
import { RencanaKunjungan } from './entities/rencana-kunjungan.entity';
import { SeederService } from './database/seeder.service';
import { AuthModule } from './auth/auth.module';
import { RencanaKunjunganModule } from './rencana-kunjungan/rencana-kunjungan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'visitflow_db',
      entities: [User, Role, UserRole, MasterEntity, RencanaKunjungan],
      synchronize: true,
    }),
    AuthModule,
    RencanaKunjunganModule,
  ],
  providers: [SeederService],
})
export class AppModule {}

