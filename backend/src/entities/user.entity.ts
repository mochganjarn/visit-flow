import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;
}

