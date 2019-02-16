import { Router } from 'express';

import { Story } from './models/Story';
import { Tag } from './models/Tag';

const router = Router();

router.get('/api/stories/:page/:amount/:sortBy/:order', async (req, res) => {
  try {
    const { page, amount, sortBy, order } = req.params;
    const stories = await Story.find({
      select: [
        'id',
        'title',
        'rating',
        'length',
        'votes',
        'views',
        'tags',
        'description',
        'date',
        'introduction',
      ],
      relations: ['tags'],
      order: { [sortBy]: order },
      skip: page * amount,
      take: amount,
    });
    res.json(stories);
  } catch (error) {
    res.json({ error: error.message }).status(400);
  }
});

router.get('/api/tags', async (req, res) => {
  try {
    const tags = await Tag.findAndCount({
      select: ['id', 'name', 'count'],
      order: { count: 'DESC' },
      take: 500, // NOTE: might not be needed
    });
    res.json(tags);
  } catch (error) {
    res.json({ error: error.message }).status(400);
  }
});

router.get('/api/stories/:tagId/:page/:amount/:sortBy/:order', async (req, res) => {
  try {
    const { page, amount, sortBy, order } = req.params;
    Story.createQueryBuilder('story').select([
      'id',
      'title',
      'rating',
      'length',
      'votes',
      'tags',
      'description',
      'date',
      'introduction'
    ]) // TODO: add the rest (inner join for one tag)
  } catch (error) {
    res.json({ error: error.message }).status(400);
  }
});

router.get('/api/stories/tags/:page/:amount/:sortBy/:order', async (req, res) => {
  try {
    // /api/stories/tags/:page/:amount/:sortBy/:order?tags=Test&tags=Tag1&tags=Tag2
    const tagsArray = req.query.tags;
    const { page, amount, sortBy, order } = req.params;
    const stories = await Story.createQueryBuilder('story')
      .select([
        'id',
        'title',
        'rating',
        'length',
        'votes',
        'views',
        'tags',
        'description',
        'date',
        'introduction',
      ])
      .innerJoinAndSelect('story.tags', 'tag')
      .where('tag.name IN :tags', { tags: tagsArray })
      .orderBy(sortBy, order)
      .skip(page * amount)
      .take(amount)
      .getMany();
    res.json(stories);
  } catch (error) {
    res.json({ error: error.message }).status(400);
  }
});
