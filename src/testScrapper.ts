#!/usr/bin/env node

import * as yargs from 'yargs';
import { Argv } from 'yargs';
import * as cheerio from 'cheerio';
import { In, createConnection } from 'typeorm';
import * as sugar from 'sugar';
import * as rp from 'request-promise';

import tagsMap = require('../secondExcludeTags.json');
import { IStory } from './scrapper';
import { Tag } from './models/Tag';
import { Story } from './models/Story';

// TODO: add timeout to all rp()
const TIMEOUT = 1999000;

let argv = yargs.command('scrap', 'Start scrapping', (yargs: Argv) => {
  return yargs
    .option('start', {
      describe: 'Start page',
      default: 1,
      alias: 's',
    })
    .option('end', {
      describe: 'End page',
      alias: 'e',
      default: 99999,
    })
    .option('from', {
      describe: 'From which story to start',
      default: false,
      alias: 'f',
    });
}).argv;

export interface IData {
  link: string;
  description: string;
  rating: number;
  date: Date;
  category: string;
}

export const checkIfStoryHasBadTags = (tags: string[]) => {
  return tagsMap.excludeTags.some(tag => tags.includes(tag));
};

export const checkIfStoryHasBadCategory = (category: string) => {
  return tagsMap.categories.includes(category);
};

export const uniqArray = (array: string[]) => {
  return Array.from(new Set(array));
};

export const mergeTags = (tags: string[]) => {
  let updatedTags = tags;
  tagsMap.similarTags.forEach(el => {
    if (el.similar.some(tag => tags.includes(tag))) {
      updatedTags = updatedTags.filter(val => !el.similar.includes(val));
      if (!updatedTags.includes(el.main)) {
        updatedTags = [...updatedTags, el.main];
      }
    }
  });
  return uniqArray(updatedTags);
};

export const normalizeCategory = (category: string) => {
  let newCatName = category;
  tagsMap.categoryNames.forEach(cat => {
    if (cat.original === category) {
      newCatName = cat.updated;
    }
  });
  return newCatName.toLowerCase();
};

export const getTags = async () => {
  try {
    return await Tag.find({ select: ['id', 'name', 'count'] });
  } catch (error) {
    console.log(`Cant fetch tags: ${error.message}`);
  }
};

export const saveTags = async (tags: string[]) => {
  const mappedTags = tags.map(tag => {
    return { name: tag };
  });
  return await Tag.insert(mappedTags);
};

export const fetchStoriesList = (html: string, from: number = 0) => {
  const $ = cheerio.load(html);
  let link: string;
  let description: string;
  let rating: number;
  let category: string;
  let date: Date;
  let data: IData[] = [];
  $('.StoryCardComponent__story___7dzmf').each((i, el) => {
    category = $($(el).children('div')[1])
      .children('a')
      .last()
      .children('span')
      .first()
      .text()
      .trim();
    rating = parseFloat(
      $(el)
        .children('div')
        .last()
        .children('div')
        .first()
        .text()
        .trim()
        .slice(0, 4)
    );
    if (rating > 5) rating = Math.floor(rating / 100);
    rating = parseFloat((rating * 20).toFixed(2));

    if (!checkIfStoryHasBadCategory(category) && !(rating <= 74)) {
      category = normalizeCategory(category);
      link = $(el)
        .children('div')
        .first()
        .children('a')[1].attribs.href;
      description = $(el)
        .children('div')
        .first()
        .children('div')
        .text()
        .trim();
      date = sugar.Date.create(
        $($(el).children('div')[1])
          .children('a')
          .last()
          .children('span')
          .last()
          .text()
          .trim()
      );
      data.push({ link, description, rating, date, category });
    } else {
      console.log('This story sucks.');
    }
  });
  if (from > 0) {
    return data.slice(from);
  }
  return data;
};

export const getPagesAmount = (html: string) => {
  const $ = cheerio.load(html);
  return parseInt(
    $('.Pagination__pagination___3RO7z')
      .children('a')
      .last()
      .text()
      .trim()
  );
};

export const scrapStoryPages = (html: string) => {
  const $ = cheerio.load(html);
  return parseInt(
    $('.b-pager-caption-t')
      .text()
      .trim()
  );
};

export const scrapStoryTags = (html: string) => {
  const $ = cheerio.load(html);
  // Getting tags
  let tags: string[] = [];
  $('.b-s-story-tag-list')
    .children('ul')
    .children('li')
    .each((i, el) => {
      tags.push(
        $(el)
          .children('a')
          .text()
          .trim()
      );
    });
  return tags;
};

export const scrapStoryBodyPerPage = (html: string) => {
  const $ = cheerio.load(html);
  return $('.b-story-body-x')
    .children('div')
    .children('p')
    .html()
    .trim();
};

export const scrapFirstInSeriesLink = ($: CheerioStatic) => {
  if ($('.t-4ut').html() !== null) {
    return $('.t-4ut')
      .children('.frame')
      .first()
      .children('ul')
      .children('li')
      .first()
      .children('h4')
      .children('a')[0].attribs.href;
  }
  return '';
};

export const scrapTitle = ($: CheerioStatic) => {
  return $('.b-story-header')
    .first()
    .children('h1')
    .text()
    .trim();
};

export const scrapAuthor = ($: CheerioStatic) => {
  return $('.b-story-user-y')
    .first()
    .children('a')
    .text()
    .trim();
};

export const scrapViews = ($: CheerioStatic) => {
  return parseInt(
    $('.b-story-stats')
      .text()
      .trim()
      .replace(/\d+ comments\//i, '')
      .trim()
  );
};

export const fillStoryObject = (storyData: IData) => {
  return {
    date: storyData.date,
    description: storyData.description,
    rating: storyData.rating,
    link: storyData.link,
  };
};

export const scrapFullStory = async (storyData: IData) => {
  try {
    let storyObject: IStory = fillStoryObject(storyData);
    let html = await rp(storyData.link);
    const pages = scrapStoryPages(html);
    let fullStory: string = '';
    fullStory = fullStory + scrapStoryBodyPerPage(html);
    // Go to the last page if more than 1 page is present
    if (pages > 1) {
      html = await rp(storyData.link);
    }
    storyObject.tags = scrapStoryTags(html);
    if (!checkIfStoryHasBadTags(storyObject.tags)) {
      storyObject.tags = [...storyObject.tags, storyData.category];
      storyObject.tags = mergeTags(storyObject.tags);
      const $ = cheerio.load(html);
      storyObject.firstInSeriesLink = scrapFirstInSeriesLink($);
      storyObject.title = scrapTitle($);
      storyObject.author = scrapAuthor($);
      storyObject.views = scrapViews($);

      // Concat story if more than one page
      if (pages === 2) {
        fullStory = fullStory + scrapStoryBodyPerPage(html);
      } else if (pages > 2) {
        const lastPageStoryPart = scrapStoryBodyPerPage(html);
        for (let i = 2; i < pages; i++) {
          html = await rp(storyData.link);
          fullStory = fullStory + scrapStoryBodyPerPage(html);
        }
        fullStory = fullStory + lastPageStoryPart;
      }
      storyObject.story = fullStory;
      storyObject.length = fullStory.length;
      return storyObject;
    } else {
      // Dont do anything with this story
      console.log('This story sucks.');
      return;
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const saveStory = async (storyObject: IStory) => {
  try {
    const tags = await getTags();
    // Increment count of existing tags used in story
    await Tag.getRepository().increment({ name: In(storyObject.tags) }, 'count', 1);
    // Create new once if any
    let newTags: string[] = [];
    let usedTags: Tag[] = [];
    const tgLen = tags.length;
    let tmp: number;
    storyObject.tags.forEach(storyTag => {
      tmp = -1;
      for (let i = 0; i < tgLen; i++) {
        if (storyTag === tags[i].name) {
          tmp = i;
          break;
        }
      }
      if (tmp !== -1) {
        usedTags.push(tags[tmp]);
      } else {
        newTags.push(storyTag);
        console.log(`--- New tag "${storyTag}" has been added`);
      }
    });
    // Insert new tags
    let insertedTagsPromise: Promise<Tag>[] = [];
    let insertedTags: Tag[];
    newTags.forEach(newTag => {
      insertedTagsPromise.push(Tag.create({ name: newTag, count: 1 }).save());
    });
    insertedTags = await Promise.all(insertedTagsPromise);
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
    story.votes = 0;
    story.views = storyObject.views;
    story.tags = [...usedTags, ...insertedTags];
    story.seriesLink = storyObject.firstInSeriesLink;
    return await story.save();
  } catch (error) {
    console.log(error.message);
  }
};

export const doStoriesOnPages = async (start: number, end?: number, from: number = 0) => {
  try {
    if (!end) {
      const html = await rp(`https://search.literotica.com/?query=`);
      end = getPagesAmount(html);
    }
    let html: string;
    let list: IData[];
    let tmpNum: number;
    let storyObject: IStory;
    let story: Story;
    // MAIN PAGES CYCLE
    for (let i = start; i <= end; i++) {
      console.log(`###--- Start fetching page ${i} out of ${end} ---###`);
      html = await rp(`https://search.literotica.com/?query=&page=${i}`);
      console.log('Page has been fetched.');
      if (i === start && from > 0) {
        list = fetchStoriesList(html, from);
      } else {
        list = fetchStoriesList(html);
      }
      tmpNum = list.length;
      for (let j = 0; j < tmpNum; j++) {
        storyObject = await scrapFullStory(list[j]);
        if (storyObject) {
          story = await saveStory(storyObject);
          console.log(
            `#${i} - ${j} "${story.title}" has been saved: (id: ${story.id}, length: ${
              story.length
            })`
          );
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

(async () => {
  try {
    await createConnection();
    console.log('Connected to DB.');
    // // 12, 1012
    if (argv.start && typeof argv.start === 'number' && argv.end && typeof argv.end === 'number') {
      if (argv.from && typeof argv.from === 'number') {
        await doStoriesOnPages(argv.start, argv.end, argv.from);
      } else {
        await doStoriesOnPages(argv.start, argv.end);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
})();
