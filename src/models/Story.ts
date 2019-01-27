import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Index } from 'typeorm';

import { Tag } from './Tag';

@Entity('stories')
export class Story extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Index()
  @Column()
  title: string;

  @Column()
  link: string;

  @Index()
  @Column()
  author: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  introduction: string;

  @Column('text')
  text: string;

  @Column('date', { default: new Date() })
  date: Date;

  @Index()
  @Column('real', { default: 0 })
  rating: number;

  @Index()
  @Column('int', { default: 0 })
  votes: number;

  @Index()
  @Column('int', { default: 0 })
  views: number;

  @Index()
  @Column('int', { default: 0 })
  length: number;

  @ManyToMany(type => Tag, tag => tag.stories)
  @JoinTable()
  tags: Tag[];
}
