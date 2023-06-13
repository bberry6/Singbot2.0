import  {EventBot} from './EventBot';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from './config/config';

let config: AppConfig = require('../config.json');

console.log("loaded config: ", config);

const eventBot = new EventBot(config);

process.on('unhandledRejection', (err: Error) => console.error('Uncaught Promise Error:', `${err && err.stack || err}`));

eventBot.start()
.catch(e => {
   console.error("Error in main: ", e);
   process.exit(1);
})