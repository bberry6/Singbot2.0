
import {Queue} from "../models"
import mongoose from 'mongoose';
import { MongoMemoryServer } from "mongodb-memory-server";


export class Db {
  connection: mongoose.Connection
  queues: Queue
  constructor(){
    this.connection = mongoose.connection;
    this.connection.on('error', err => console.error(`Mongoose connection error: ${err.message}.`));
    this.connection.once('open', () => console.log('Connected to database.'));
    this.queues = new Queue();
 }

 async connect(url?: string) {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: "EventBot" })
    console.log('Loaded models.');
 }
}
