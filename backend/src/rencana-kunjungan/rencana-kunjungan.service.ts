import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  StatusKunjungan,
  SegmenKunjungan,
} from '../entities/rencana-kunjungan.entity';

@Injectable()
export class RencanaKunjunganService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getAllEntities() {
    return this.dataSource.query(
      'SELECT id, nama, region FROM entity ORDER BY nama ASC',
    );
  }

  async getRencanaKunjungan(
    user: { id: number; username: string; role: string },
    filters?: {
      search?: string;
      startDate?: string;
      endDate?: string;
      segmen?: string;
      status?: string;
    },
  ) {
    const conditions: string[] = [];
    const params: any[] = [];

    // Jika role adalah sales, wajib filter hanya milik user tersebut
    if (user.role !== 'admin') {
      params.push(user.id);
      conditions.push(`rk.user_id = $${params.length}`);
    }

    // Search berdasarkan nama entity (case-insensitive menggunakan ILIKE)
    if (filters?.search && filters.search.trim() !== '') {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(`e.nama ILIKE $${params.length}`);
    }

    // Filter Segmen (B2B / B2G)
    if (filters?.segmen) {
      params.push(filters.segmen);
      conditions.push(`rk.segmen = $${params.length}`);
    }

    // Filter Status (VISITED / NOT-VISITED)
    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`rk.status = $${params.length}`);
    }

    // Filter Tanggal Mulai (startDate)
    if (filters?.startDate) {
      params.push(`${filters.startDate} 00:00:00`);
      conditions.push(`rk.tanggal_kunjungan >= $${params.length}`);
    }

    // Filter Tanggal Akhir (endDate)
    if (filters?.endDate) {
      params.push(`${filters.endDate} 23:59:59.999`);
      conditions.push(`rk.tanggal_kunjungan <= $${params.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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

  async createRencanaKunjungan(
    userId: number,
    payload: {
      entity: number;
      status: string;
      segmen: string;
      tanggal_kunjungan: string;
    },
  ) {
    const validStatuses = Object.values(StatusKunjungan) as string[];
    const validSegmens = Object.values(SegmenKunjungan) as string[];

    if (!payload.entity) {
      throw new BadRequestException('Entity wajib dipilih');
    }

    if (!validStatuses.includes(payload.status)) {
      throw new BadRequestException(
        'Status harus bernilai VISITED atau NOT-VISITED',
      );
    }

    if (!validSegmens.includes(payload.segmen)) {
      throw new BadRequestException('Segmen harus bernilai B2B atau B2G');
    }

    if (!payload.tanggal_kunjungan) {
      throw new BadRequestException('Tanggal kunjungan wajib diisi');
    }

    const result = await this.dataSource.query(
      `
      INSERT INTO rencana_kunjungan (entity, user_id, status, segmen, tanggal_kunjungan)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        Number(payload.entity),
        userId,
        payload.status,
        payload.segmen,
        new Date(payload.tanggal_kunjungan),
      ],
    );

    return result[0];
  }

  async updateStatusKunjungan(
    id: number,
    status: string,
    user: { id: number; username: string; role: string },
  ) {
    const validStatuses = Object.values(StatusKunjungan) as string[];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        'Status harus bernilai VISITED atau NOT-VISITED',
      );
    }

    let result: any[];

    if (user.role === 'admin') {
      result = await this.dataSource.query(
        `
        UPDATE rencana_kunjungan
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [status, id],
      );
    } else {
      result = await this.dataSource.query(
        `
        UPDATE rencana_kunjungan
        SET status = $1
        WHERE id = $2 AND user_id = $3
        RETURNING *
        `,
        [status, id, user.id],
      );
    }

    if (!result || result.length === 0) {
      throw new NotFoundException(
        'Data rencana kunjungan tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya',
      );
    }

    return result[0];
  }
}

