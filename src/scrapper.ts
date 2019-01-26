import * as rp from 'request-promise';
import * as cheerio from 'cheerio';

import { Tag } from './models/Tag';
import badTags = require('../excludeTags.json');

export const scrapTags = async () => {
  try {
    const res = await rp('http://sexstories.com');
    const $ = cheerio.load(res);
    let tags: object[] = [];
    $('h2')
      .eq(3)
      .next('ul')
      .children('li')
      .children('a')
      .each((i, el) => {
        const tag = $(el).text();
        if (!badTags.includes(tag)) {
          tags.push({ name: tag });
        }
      });
    const re = await Tag.createQueryBuilder()
      .insert()
      .values(tags)
      .execute();
    return re;
  } catch (error) {
    throw new Error(error);
  }
};
