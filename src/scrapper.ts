import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import * as sugar from 'sugar';

import { Tag } from './models/Tag';
import excludeTags = require('../excludeTags.json');
import { Story } from './models/Story';
import { In } from 'typeorm';

export const scrapTags = async () => {
  try {
    const html = await rp('http://sexstories.com');
    const $ = cheerio.load(html);
    let tags: object[] = [];
    $('h2')
      .eq(3)
      .next('ul')
      .children('li')
      .children('a')
      .each((i, el) => {
        const tag = $(el).text();
        if (!excludeTags.includes(tag)) {
          tags.push({ name: tag });
        }
      });
    const re = await Tag.createQueryBuilder()
      .insert()
      .values(tags)
      .execute();
    return re;
  } catch (error) {
    throw new Error('Something went wrong');
  }
};

export const getPagesAmount = async () => {
  try {
    const html = await rp('https://www.sexstories.com/updates/');
    const $ = cheerio.load(html);
    return parseInt(
      $('.pager')
        .children('a')
        .last()
        .attr('href')
        .replace(/\D/g, '')
    );
  } catch (error) {
    throw new Error('Something went wrong');
  }
};

export const getAllStoriesFromPage = async (page: number) => {
  try {
    const html = await rp(`https://www.sexstories.com/updates/${page}`);
    const $ = cheerio.load(html);
    interface Istories {
      link: string;
      description: string;
    }
    let results: Istories[] = [];
    $('.stories_list')
      .children('li')
      .each((i, el) => {
        const link = $(el)
          .children('h4')
          .children('a')[0].attribs.href;
        const description = $($(el).children('p')[0])
          .text()
          .replace('«', '')
          .replace('»', '');
        results.push({ link, description });
      });
    return results;
  } catch (error) {
    throw new Error('Something went wrong');
  }
};

interface IData {
  link: string;
  description: string;
}

interface IStory {
  link?: string;
  description?: string;
  tags?: string[];
  title?: string;
  author?: string;
  introduction?: string;
  story?: string;
  length?: number;
  views?: number;
  rating?: number;
  votes?: number;
  date?: Date;
}

export const getStory = async (data: IData) => {
  try {
    let storyObject: IStory = { link: data.link, description: data.description };
    const html = await rp(`https://www.sexstories.com${data.link}`);
    let $ = cheerio.load(html);
    let header = $($('.story_info')[0]);
    storyObject.tags = $(header.children('.top_info')[0])
      .text()
      .split(',')
      .map(tag => tag.trim());
    // Check if story contains bad tags
    if (storyObject.tags.some(tag => excludeTags.includes(tag))) {
      throw new Error('This story sucks.');
    }
    storyObject.date = sugar.Date.create(
      $('.story_date')
        .html()
        .match(/(.*)<div id="report">/)[1]
        .replace('Posted', '')
        .trim()
    );
    storyObject.title = header
      .children('h2')
      .html()
      .match(/(.*)<span class="title_link">/)[1]
      .trim();
    storyObject.author = header
      .children('h2')
      .children('span')
      .children('a')
      .text()
      .trim();
    storyObject.introduction = $($('.block_panel')[0])
      .text()
      .replace('Introduction:', '')
      .trim();
    let body = $($('.block_panel')[1]).html();
    storyObject.story = body.slice(0, body.search('<!-- VOTES -->'));
    storyObject.length = storyObject.story.length;
    body = body.slice(body.search('<!-- VOTES -->'));
    $ = cheerio.load(body);
    storyObject.views = parseInt(
      $($('.color2')[0])
        .text()
        .trim()
    );
    storyObject.rating = parseFloat(
      $($('.color2')[1])
        .text()
        .trim()
    );
    storyObject.votes = parseInt(
      $($('.color2')[2])
        .text()
        .trim()
        .replace(/\D/g, '')
    );
    return storyObject;
  } catch (error) {
    throw new Error('Something went wrong');
  }
};

export const getTags = async () => {
  return await Tag.find();
};

export const saveStory = async (storyObject: IStory, tags?: Tag[]) => {
  try {
    // Deal with tags
    const usedTags = tags.filter(tag => storyObject.tags.includes(tag.name));
    await Tag.getRepository().increment({ name: In(storyObject.tags) }, 'count', 1);
    // Build story
    const story = new Story();
    story.title = storyObject.title;
    story.author = storyObject.author;
    story.date = storyObject.date;
    story.description = storyObject.description;
    story.introduction = storyObject.introduction;
    story.length = storyObject.length;
    story.link = storyObject.link;
    story.text = storyObject.story;
    story.rating = storyObject.rating;
    story.votes = storyObject.votes;
    story.views = storyObject.views;
    story.tags = usedTags;
    return await story.save();
  } catch (error) {
    throw new Error('Something went wrong');
  }
};

// getStory({ link: '/story/89780/the_case_of_the_sensuous_refueling_attendant', description: '' });
