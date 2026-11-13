import { RencanaKunjunganService } from './rencana-kunjungan.service';
export declare class RencanaKunjunganController {
    private readonly rencanaKunjunganService;
    constructor(rencanaKunjunganService: RencanaKunjunganService);
    getEntities(): Promise<any>;
    getRencanaKunjungan(req: any, search?: string, startDate?: string, endDate?: string, segmen?: string, status?: string): Promise<any>;
    createRencanaKunjungan(req: any, body: {
        entity: number;
        status: string;
        segmen: string;
        tanggal_kunjungan: string;
    }): Promise<any>;
    updateStatusKunjungan(id: string, body: {
        status: string;
    }, req: any): Promise<any>;
}
