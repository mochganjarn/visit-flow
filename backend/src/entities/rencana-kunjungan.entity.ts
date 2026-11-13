import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MasterEntity } from './master-entity.entity';
import { User } from './user.entity';

export enum StatusKunjungan {
  VISITED = 'VISITED',
  NOT_VISITED = 'NOT-VISITED',
}

export enum SegmenKunjungan {
  B2B = 'B2B',
  B2G = 'B2G',
}

@Entity('rencana_kunjungan')
export class RencanaKunjungan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entity: number;

  @Column()
  user_id: number;

  @Column({
    type: 'enum',
    enum: StatusKunjungan,
    default: StatusKunjungan.NOT_VISITED,
  })
  status: StatusKunjungan;

  @Column({
    type: 'enum',
    enum: SegmenKunjungan,
  })
  segmen: SegmenKunjungan;

  @Column({ type: 'timestamp' })
  tanggal_kunjungan: Date;

  @ManyToOne(() => MasterEntity)
  @JoinColumn({ name: 'entity' })
  masterEntity: MasterEntity;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

