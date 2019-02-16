import 'reflect-metadata';
import 'dotenv/config';
import * as express from 'express';
import { createConnection } from 'typeorm';
import * as cors from 'cors';

import { getPagesAmount, scrapAndSaveStoriesFromPages } from './scrapper';

const startServer = async () => {
  try {
    await createConnection();
    console.log('Connected to DB.');
    const app = express();

    app.use('/api', cors());

    app.get('/api/scrap/:start/:stop', async (req, res) => {
      scrapAndSaveStoriesFromPages(parseInt(req.params.start), parseInt(req.params.stop));
      // res.json({ success: `All good on ${req.params.start} - ${req.params.stop}` });
    });

    app.get('/api/pages', async (req, res) => {
      const re = await getPagesAmount();
      res.json(re);
    });

    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  } catch (error) {
    throw new Error(error);
  }
};

startServer();
