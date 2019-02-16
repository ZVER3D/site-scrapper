import { createConnection, In, Like, Not, LessThan } from 'typeorm';
import { Tag } from './models/Tag';
import * as he from 'he';
import { Story } from './models/Story';
import { toTitleCase } from './toTitleCase';

const refreshTagsCount = async () => {
  const tags = await Tag.createQueryBuilder('tag')
    .loadRelationCountAndMap('tag.storyCount', 'tag.stories')
    .orderBy('id', 'ASC')
    .getMany();
  await tags.forEach(async tag => {
    tag.count = tag['storyCount'];
    await tag.save();
  });
  console.log('Tags counts are refreshed.');
};

const makeRegEx = (tag: string) => {
  return (
    tag
      .split(/(\s|-|\/|,|\||&)/)
      .filter(
        str =>
          !str.includes(' ') &&
          !str.includes('/') &&
          !str.includes('-') &&
          !str.includes(',') &&
          !str.includes('|') &&
          !str.includes('&')
      )
      .reduce((res, val, i) => {
        if (i === 0 && (val === 'male' || val === 'man')) return res + val;
        if (i === 0) return res + '%' + val;
        return res + '( |-|/|,|||&)' + val;
      }, '') + '%'
  );
};

const getSimilarTagsStoriesIds = async (regEx: string, id: number): Promise<number[]> => {
  try {
    const tags = await Tag.createQueryBuilder('tags')
      .select()
      .where('tags.name SIMILAR TO :name', { name: regEx })
      .andWhere('tags.id != :tagId', { tagId: id })
      .orderBy('tags.count', 'DESC')
      .loadRelationIdAndMap('tags.storyIds', 'tags.stories')
      .getMany();
    return tags
      .map(tag => tag['storyIds'])
      .reduce((acc, val) => acc.concat(val), [])
      .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i);
  } catch (error) {
    throw new Error(`Something isn't right at getting stories ids for similar tags of ${id}`);
  }
};

const checkIfStoryAlreadyHasTag = async (id: number, tagId: number): Promise<boolean> => {
  try {
    const story = await Story.createQueryBuilder('stories')
      .select('stories.id')
      .where('stories.id = :id', { id })
      .loadRelationIdAndMap('stories.tagIds', 'stories.tags')
      .getOne();
    return story['tagIds'].includes(tagId);
  } catch (error) {
    throw new Error(`Something isn't right at checking if story already has tag ${id}`);
  }
};

const addTagToStory = async (storyId: number, tagId: number) => {
  try {
    await Story.createQueryBuilder()
      .relation('tags')
      .of(storyId)
      .add(tagId);
  } catch (error) {
    throw new Error(`Something isn't right at adding tag to story ${storyId}`);
  }
};

(async () => {
  try {
    await createConnection();
    console.log('Connected to DB.');
    
    
  } catch (error) {
    console.log(error.message);
  }
})();
