import { DataSource } from 'typeorm';
export declare class RencanaKunjunganService {
    private dataSource;
    constructor(dataSource: DataSource);
    getAllEntities(): Promise<any>;
    getRencanaKunjungan(user: {
        id: number;
        username: string;
        role: string;
    }, filters?: {
        search?: string;
        startDate?: string;
        endDate?: string;
        segmen?: string;
        status?: string;
    }): Promise<any>;
    createRencanaKunjungan(userId: number, payload: {
        entity: number;
        status: string;
        segmen: string;
        tanggal_kunjungan: string;
    }): Promise<any>;
    updateStatusKunjungan(id: number, status: string, user: {
        id: number;
        username: string;
        role: string;
    }): Promise<any>;
}
