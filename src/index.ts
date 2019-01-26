import 'reflect-metadata';
import 'dotenv/config';
import * as express from 'express';
import { createConnection } from 'typeorm';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const startServer = async () => {
  await createConnection({
    type: 'postgres',
    host: DB_HOST,
    port: parseInt(DB_PORT),
    username: DB_USER,
    password: DB_PASSWORD,
    name: DB_NAME,
    entities: [__dirname + './models/*.ts'],
  });

  const app = express();

  app.set("view engine", "pug");
  app.set("views", "../views");

  app.get('/', (req, res) => {
    res.render("index");
  });

  app.listen(4000, () => {
    console.log('Server is running on port 4000');
  });
};

startServer();
