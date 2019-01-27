import 'reflect-metadata';
import 'dotenv/config';
import * as express from 'express';
import { createConnection } from 'typeorm';
import { scrapTags, saveStory } from './scrapper';

const startServer = async () => {
  try {
    await createConnection();
    console.log('Connected to DB.');
    const app = express();
  
    app.get('/', async (req, res) => {
      const re = await saveStory({ tags: ['Anal', 'Slavery'] });
      res.json(re);
      // const re = await scrapTags();
      // res.send(re);
    });
  
    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  } catch (error) {
    throw new Error(error);
  }
  
};

startServer();
