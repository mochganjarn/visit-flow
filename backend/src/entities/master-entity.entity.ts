import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('entity')
export class MasterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nama: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;
}

