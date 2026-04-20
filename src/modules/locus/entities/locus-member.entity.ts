import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MembershipStatus } from '../enums/membership-status.enum';
import { Locus } from './locus.entity';

@Entity('rnc_locus_members')
export class LocusMember {
    @PrimaryColumn({name: 'id', type: 'bigint'})
    locusMemberId: string;

    @Column({type: 'text'})
    ursTaxid: string;

    @Column({type: 'int'})
    regionId: number;

    @Column({type: 'bigint'})
    locusId: string;

    @Column({type: 'text', enum: MembershipStatus})
    membershipStatus: MembershipStatus;

    @ManyToOne(() => Locus, (locus) => locus.locusMembers)
    @JoinColumn({name: 'locus_id'})
    locus: Locus;
}