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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RencanaKunjunganService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rencana_kunjungan_entity_1 = require("../entities/rencana-kunjungan.entity");
let RencanaKunjunganService = class RencanaKunjunganService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getAllEntities() {
        return this.dataSource.query('SELECT id, nama, region FROM entity ORDER BY nama ASC');
    }
    async getRencanaKunjungan(user, filters) {
        const conditions = [];
        const params = [];
        if (user.role !== 'admin') {
            params.push(user.id);
            conditions.push(`rk.user_id = $${params.length}`);
        }
        if (filters?.search && filters.search.trim() !== '') {
            params.push(`%${filters.search.trim()}%`);
            conditions.push(`e.nama ILIKE $${params.length}`);
        }
        if (filters?.segmen) {
            params.push(filters.segmen);
            conditions.push(`rk.segmen = $${params.length}`);
        }
        if (filters?.status) {
            params.push(filters.status);
            conditions.push(`rk.status = $${params.length}`);
        }
        if (filters?.startDate) {
            params.push(`${filters.startDate} 00:00:00`);
            conditions.push(`rk.tanggal_kunjungan >= $${params.length}`);
        }
        if (filters?.endDate) {
            params.push(`${filters.endDate} 23:59:59.999`);
            conditions.push(`rk.tanggal_kunjungan <= $${params.length}`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `
      SELECT rk.id, rk.entity AS entity_id, e.nama AS nama_entity, e.region, rk.segmen, rk.status, rk.tanggal_kunjungan, u.username AS dibuat_oleh
      FROM rencana_kunjungan rk
      JOIN entity e ON rk.entity = e.id
      JOIN "user" u ON rk.user_id = u.id
      ${whereClause}
      ORDER BY rk.tanggal_kunjungan DESC
    `;
        return this.dataSource.query(sql, params);
    }
    async createRencanaKunjungan(userId, payload) {
        const validStatuses = Object.values(rencana_kunjungan_entity_1.StatusKunjungan);
        const validSegmens = Object.values(rencana_kunjungan_entity_1.SegmenKunjungan);
        if (!payload.entity) {
            throw new common_1.BadRequestException('Entity wajib dipilih');
        }
        if (!validStatuses.includes(payload.status)) {
            throw new common_1.BadRequestException('Status harus bernilai VISITED atau NOT-VISITED');
        }
        if (!validSegmens.includes(payload.segmen)) {
            throw new common_1.BadRequestException('Segmen harus bernilai B2B atau B2G');
        }
        if (!payload.tanggal_kunjungan) {
            throw new common_1.BadRequestException('Tanggal kunjungan wajib diisi');
        }
        const result = await this.dataSource.query(`
      INSERT INTO rencana_kunjungan (entity, user_id, status, segmen, tanggal_kunjungan)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `, [
            Number(payload.entity),
            userId,
            payload.status,
            payload.segmen,
            new Date(payload.tanggal_kunjungan),
        ]);
        return result[0];
    }
    async updateStatusKunjungan(id, status, user) {
        const validStatuses = Object.values(rencana_kunjungan_entity_1.StatusKunjungan);
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException('Status harus bernilai VISITED atau NOT-VISITED');
        }
        let result;
        if (user.role === 'admin') {
            result = await this.dataSource.query(`
        UPDATE rencana_kunjungan
        SET status = $1
        WHERE id = $2
        RETURNING *
        `, [status, id]);
        }
        else {
            result = await this.dataSource.query(`
        UPDATE rencana_kunjungan
        SET status = $1
        WHERE id = $2 AND user_id = $3
        RETURNING *
        `, [status, id, user.id]);
        }
        if (!result || result.length === 0) {
            throw new common_1.NotFoundException('Data rencana kunjungan tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya');
        }
        return result[0];
    }
};
exports.RencanaKunjunganService = RencanaKunjunganService;
exports.RencanaKunjunganService = RencanaKunjunganService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], RencanaKunjunganService);
//# sourceMappingURL=rencana-kunjungan.service.js.map