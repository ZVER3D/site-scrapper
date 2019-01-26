import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToMany, Column } from "typeorm";

import { Story } from "./Story";

@Entity()
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  name: string;

  @Column("integer", { default: 0 })
  count: number;

  @ManyToMany(type => Story, story => story.tags)
  stories: Story[];
}