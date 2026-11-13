import { MasterEntity } from './master-entity.entity';
import { User } from './user.entity';
export declare enum StatusKunjungan {
    VISITED = "VISITED",
    NOT_VISITED = "NOT-VISITED"
}
export declare enum SegmenKunjungan {
    B2B = "B2B",
    B2G = "B2G"
}
export declare class RencanaKunjungan {
    id: number;
    entity: number;
    user_id: number;
    status: StatusKunjungan;
    segmen: SegmenKunjungan;
    tanggal_kunjungan: Date;
    masterEntity: MasterEntity;
    user: User;
}
