import * as mongoose from 'mongoose';
import { GuildMember } from 'discord.js';

const distance = require('jaro-winkler');


interface IQueue {
   name: string;
   creatorid: string;
   guildid: string;
   enqueued: {
      userid: string;
      text: string;
   }[];
   current?: {
      userid: string;
      text: string;
   }
   locked: boolean;
}

//{ createdAt: { type: Date, expires: 3600, default: Date.now }}

interface queueModelInterface extends mongoose.Model<QueueDoc> {
   build(attr: IQueue): QueueDoc
}

export interface QueueDoc extends mongoose.Document {
   name: string;
   creatorid: string;
   guildid: string;
   enqueued: {
      userid: string;
      text: string;
   }[];
   current?: {
      userid: string;
      text: string;
   };
   locked: boolean;
   createdAt: number
}

const queueSchema = new mongoose.Schema({
   name: String,
   creatorid: String,
   guildid: String,
   enqueued: [{
      userid: String,
      text: String
   }],
   current: {
      userid: String,
      text: String,
   },
   locked: Boolean,
   createdAt: { type: Date, expires: 86400, default: Date.now }
});

queueSchema.statics.build =  (attr: IQueue) => {
   return new QueueModel(attr);
}

const QueueModel = mongoose.model<QueueDoc, queueModelInterface>('queues', queueSchema);

export class Queue {

   constructor(){}
   
   create(name: string, creatorid: string, guildid: string) {
      let queue = QueueModel.build({
         name: name.toLowerCase(),
         creatorid,
         guildid,
         locked: false,
         enqueued:[],
      });

      queue.save();
      return queue;
   }

   async addToQueue(queue: QueueDoc, userid: string, text: string) {
      if (!queue || !userid) {
         throw new Error(`Error with parameters in Queues.addToQueue: ${queue}, ${userid}`);
      }

      const newPerson = { userid, text };
      if(queue.enqueued){
         queue.enqueued = queue.enqueued.concat([newPerson]);
      }

      try {
         await queue.save();
      } catch (err) {
         return `An error occured while updating: ${err.message}`;
      }
   }

   async removeFromQueue(queue: QueueDoc, userid: string) {
      let index;
      if(!queue.enqueued || !queue.enqueued.length){
         throw new Error('No members in queue');
      }

      for(let i = 0; i < queue.enqueued.length; i++){
         if (queue.enqueued[i].userid === userid) {
            index = i;
         }
      }

      if (!index && index !== 0) {
         throw new Error('Cannot be found in queue.');
      }

      queue.enqueued.splice(index, 1);
      await queue.save();
   }
   
   getByGuild(guildid: string) {
      return QueueModel.find({
         guildid
      });
   }

   getByCreator(creatorid: string, guildid: string){
      return QueueModel.find({ creatorid, guildid });
   }
   
   async checkQueueName(name: string, guildid: string) {
      return await QueueModel.findOne({
         name: name.toLowerCase(),
         guildid
      }) && true;
   }
   
   async remove(queue: QueueDoc) {
      const result = await queue.deleteOne();
      return !result ? 'A queue with this name could not be found.' : null;
   }
   
   async swapPeopleInQueue(queue: QueueDoc, idx1: number, idx2: number){
      [queue.enqueued[idx1], queue.enqueued[idx2]] = [queue.enqueued[idx2], queue.enqueued[idx1]];

      try {
         await QueueModel.replaceOne({name: queue.name.toLowerCase(), guildid: queue.guildid}, queue)
      } catch (err) {
         return `An error occured while updating: ${err.message}`;
      }
   }

   async lockQueue(queue: QueueDoc, lock: boolean) {
      if (typeof lock !== 'boolean') {
         throw new Error('Lock needs to be a boolean.');
      }
      queue.locked = lock;
      await queue.save();
   }

   async setCreator(queue: QueueDoc, newId: string) {
      queue.creatorid = newId;
      await queue.save();
   }

   async setName(queue: QueueDoc, name: string){

      queue.name = name.toLowerCase();
      await queue.save();
   }

   async getQueue(name: string, guildid: string): Promise<QueueDoc>{
      const queues = await this.getByGuild(guildid);
      if (queues.length === 0) {
         throw new Error("This guild has no queues");
      }

      let queue, highest = 0;
      for (const q of queues) {
         const dist = distance(name.toLowerCase(), q.name.toLowerCase());
         if (dist >= highest) {
            queue   = q;
            highest = dist;

            if (dist == 1) {
               break;
            }
         }
      }

      if(!queue){
         throw new Error(`Could not find a queue with name ${name}`);
      }
      if (highest !== 1 || !queue) {
         throw new Error(`Could not find a queue with that name. Did you mean: '${queue && queue.name}'?`);
      }
      return queue;
   }
   
   async removeMemberFromAll(member: GuildMember) {
      let queues = await QueueModel.find({
         guildid: member.guild.id
      });

      for (const queue of queues) {
         queue.enqueued = queue.enqueued.filter(x => x.userid !== member.id);
         queue.save();
      }
   }
}