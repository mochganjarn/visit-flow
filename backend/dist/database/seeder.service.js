"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
let SeederService = SeederService_1 = class SeederService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(SeederService_1.name);
    }
    async onModuleInit() {
        this.logger.log('Menjalankan Database Seeder (Raw SQL)...');
        await this.dataSource.query(`INSERT INTO roles (nama_role) VALUES ($1), ($2) ON CONFLICT (nama_role) DO NOTHING`, ['admin', 'sales']);
        const defaultPassword = await bcrypt.hash('password123', 10);
        await this.dataSource.query(`INSERT INTO "user" (username, password) VALUES ($1, $2), ($3, $2), ($4, $2) ON CONFLICT (username) DO NOTHING`, ['admin1', defaultPassword, 'sales1', 'sales2']);
        await this.dataSource.query(`
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
      `);
        const existingEntities = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM entity`);
        if (existingEntities[0].count === 0) {
            await this.dataSource.query(`INSERT INTO entity (nama, region) VALUES ($1, $2), ($3, $4), ($5, $6) ON CONFLICT DO NOTHING`, [
                'PT Maju Jaya',
                'Jakarta',
                'Kementerian Kominfo',
                'Jakarta',
                'CV Berkah Abadi',
                'Surabaya',
            ]);
        }
        else {
            await this.dataSource.query(`
        UPDATE entity
        SET region = CASE
          WHEN nama = 'PT Maju Jaya' THEN 'Jakarta'
          WHEN nama = 'Kementerian Kominfo' THEN 'Jakarta'
          WHEN nama = 'CV Berkah Abadi' THEN 'Surabaya'
          ELSE 'Jakarta'
        END
        WHERE region IS NULL
        `);
        }
        this.logger.log('Seeding selesai! Akun siap digunakan: admin1, sales1, sales2 (password: password123)');
    }
};
exports.SeederService = SeederService;
exports.SeederService = SeederService = SeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], SeederService);
//# sourceMappingURL=seeder.service.js.map