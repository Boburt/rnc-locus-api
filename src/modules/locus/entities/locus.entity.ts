import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { LocusMember } from './locus-member.entity';

@Entity('rnc_locus')
export class Locus {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'text' })
  assemblyId: string;

  @Column({ type: 'text' })
  locusName: string;

  @Column({ type: 'text' })
  publicLocusName: string;

  @Column({ type: 'text' })
  chromosome: string;

  @Column({ type: 'text' })
  strand: string;

  @Column({ type: 'int' })
  locusStart: number;

  @Column({ type: 'int' })
  locusStop: number;

  @Column({ type: 'int' })
  memberCount: number;

  @OneToMany(() => LocusMember, (member) => member.locus)
  locusMembers: LocusMember[];
}