import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToMany, Column, Index } from "typeorm";

import { Story } from "./Story";

@Entity('tags')
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Index()
  @Column()
  name: string;

  @Index()
  @Column("int", { default: 0 })
  count: number;

  @ManyToMany(type => Story, story => story.tags)
  stories: Story[];
}