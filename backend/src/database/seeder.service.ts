import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    this.logger.log('Menjalankan Database Seeder (Raw SQL)...');

    // 1. Seed Roles ('admin' dan 'sales')
    await this.dataSource.query(
      `INSERT INTO roles (nama_role) VALUES ($1), ($2) ON CONFLICT (nama_role) DO NOTHING`,
      ['admin', 'sales'],
    );

    // 2. Seed Users ('admin1', 'sales1', 'sales2') dengan password hash bcrypt
    const defaultPassword = await bcrypt.hash('password123', 10);

    await this.dataSource.query(
      `INSERT INTO "user" (username, password) VALUES ($1, $2), ($3, $2), ($4, $2) ON CONFLICT (username) DO NOTHING`,
      ['admin1', defaultPassword, 'sales1', 'sales2'],
    );

    // 3. Seed Relasi user_role secara idempotent menggunakan Raw SQL
    await this.dataSource.query(
      `
      INSERT INTO user_role (user_id, role_id)
      SELECT u.id, r.id
      FROM "user" u
      JOIN roles r ON (
        (u.username = 'admin1' AND r.nama_role = 'admin') OR
        (u.username = 'sales1' AND r.nama_role = 'sales') OR
        (u.username = 'sales2' AND r.nama_role = 'sales')
      )
      WHERE NOT EXISTS (
        SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id
      )
      `,
    );

    // 4. Seed 3 Data Entity awal jika tabel entity masih kosong
    const existingEntities = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count FROM entity`,
    );

    if (existingEntities[0].count === 0) {
      await this.dataSource.query(
        `INSERT INTO entity (nama, region) VALUES ($1, $2), ($3, $4), ($5, $6) ON CONFLICT DO NOTHING`,
        [
          'PT Maju Jaya',
          'Jakarta',
          'Kementerian Kominfo',
          'Jakarta',
          'CV Berkah Abadi',
          'Surabaya',
        ],
      );
    } else {
      // Backfill region untuk data entity lama yang belum memiliki region
      await this.dataSource.query(
        `
        UPDATE entity
        SET region = CASE
          WHEN nama = 'PT Maju Jaya' THEN 'Jakarta'
          WHEN nama = 'Kementerian Kominfo' THEN 'Jakarta'
          WHEN nama = 'CV Berkah Abadi' THEN 'Surabaya'
          ELSE 'Jakarta'
        END
        WHERE region IS NULL
        `,
      );
    }

    this.logger.log(
      'Seeding selesai! Akun siap digunakan: admin1, sales1, sales2 (password: password123)',
    );
  }
}

