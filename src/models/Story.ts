import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';

import { Tag } from './Tag';

@Entity('stories')
export class Story extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  title: string;

  @Column()
  link: string;

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

  @Column('real', { default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  views: number;

  @ManyToMany(type => Tag, tag => tag.stories)
  @JoinTable()
  tags: Tag[];
}
