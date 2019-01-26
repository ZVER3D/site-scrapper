import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';

import { Tag } from "./Tag";

@Entity()
export class Story extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  title: string;

  @Column()
  link: string;

  @Column()
  author: string;

  @Column('tinytext')
  description: string;

  @Column('text')
  introduction: string;

  @Column('longtext')
  text: string;

  @Column('date', { default: new Date() })
  date: Date;

  @Column('double', { default: 0 })
  rating: number;

  @Column('integer', { default: 0 })
  views: number;

  @ManyToMany(type => Tag, tag => tag.stories)
  @JoinTable()
  tags: Tag[];
}
