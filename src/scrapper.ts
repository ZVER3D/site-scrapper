import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import * as sugar from 'sugar';
import { In, createConnection } from 'typeorm';

import { Tag } from './models/Tag';
import excludeTags = require('../excludeTags.json');
import { Story } from './models/Story';


interface IData {
  link: string;
  description: string;
}

export interface IStory {
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
  firstInSeriesLink?: string;
}

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

    let results: IData[] = [];
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
    throw new Error(error.message);
  }
};

export const getStoriesFromManyPages = async (start: number, end: number) => {
  try {
    if (start > end) throw new Error('Start cant be bigger than end.');
    let array: IData[] = [];
    let tmp: IData[];
    for (let i = start; i <= end; i++) {
      tmp = await getAllStoriesFromPage(i);
      console.log(`Fetched stories from page ${i}`);
      array.push(...tmp);
    }
    return array;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));

export const scrapAndSaveStoriesFromList = async (stories: IData[]) => {
  try {
    const tags = await getTags();
    let tmp: IStory;
    let story: Story;
    const length = stories.length;
    for (let i = 0; i < length; i++) {
      // await waitFor(Math.random() * 2000);
      tmp = await getStory(stories[i]);
      if (tmp) {
        story = await saveStory(tmp, tags);
        console.log(`#${i}: ${story.title}, id: ${story.id}`);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const scrapAndSaveStoriesFromPages = async (start: number, end: number) => {
  try {
    console.log(`Doing stories starting from page ${start} to ${end}`);
    const storiesList = await getStoriesFromManyPages(start, end);
    await scrapAndSaveStoriesFromList(storiesList);
  } catch (error) {
    // throw new Error(error.message);
    console.log(error.message);
  }
};

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
      console.log('This story sucks.');
      return;
    }
    storyObject.date = sugar.Date.create(
      $('.story_date')
        .html()
        .match(/(.*)<div id="report">/)[1]
        .replace('Posted', '')
        .replace('of ', '')
        .replace('st ', '')
        .replace('rd', '')
        .replace('nd ', '')
        .replace('th ', '')
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
    let body: string;
    // Check if introduction exists
    if ($($('.block_panel')[0]).html().includes('<h2>Introduction: </h2>')) {
      storyObject.introduction = $($('.block_panel')[0])
      .text()
      .replace('Introduction:', '')
      .trim();
      body = $($('.block_panel')[1]).html();
    } else {
      storyObject.introduction = '';
      body = $($('.block_panel')[0]).html();
    }
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
    if (storyObject.rating < 70) {
      console.log('This story is pretty bad');
      return;
    }
    return storyObject;
  } catch (error) {
    console.log(`%c ${error.message}`, 'color:red');
  }
};

export const getTags = async () => {
  return await Tag.find();
};

export const saveStory = async (storyObject: IStory, tags?: Tag[]) => {
  try {
    if (!tags) {
      tags = await getTags();
    }
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
    console.log(error.message);
  }
};

// 105
createConnection().then(async connection => {
  console.log('Connected');
  await scrapAndSaveStoriesFromPages(106, await getPagesAmount());
})
.catch(err => console.log(err));

// getStory({ link: '/story/57381/the_crack_of_dawn', description: '' }).then(story => {
//   const { title, views, votes, date, author, rating, tags, length, introduction } = story;
//   // console.log(`Title: ${title}`);
//   // console.log(`Views: ${views}`);
//   // console.log(`Votes: ${votes}`);
//   // console.log(`Date: ${date}`);
//   // console.log(`Author: ${author}`);
//   // console.log(`Rating: ${rating}`);
//   // console.log(`Tags: ${tags}`);
//   // console.log(`Length: ${length}`);
//   console.log(story.story);
// });
