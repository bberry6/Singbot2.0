import {Client, Collection, GatewayIntentBits, Interaction, SlashCommandBuilder, Events} from 'discord.js';
import * as commands from './commands'
import {ready, message, guildCreate, interactionCreate} from './events'
import { AppConfig } from './config/config';
import {Db} from './Db/Db'

import { Command } from './commands/Command';

export class EventBot extends Client {
   config: AppConfig
   commands: Collection<string,Command>
   db: Db
   constructor(config: AppConfig) {
      super({intents:[
         GatewayIntentBits.GuildMessages,
         GatewayIntentBits.MessageContent,
         GatewayIntentBits.GuildMembers
      ]});

      this.config = config;
      this.commands = new Collection();

      console.log("Setting up commands...");

      Object.values(commands).forEach((cmd) => {
         let command = new cmd();
         this.commands.set(command.info.name, command);
      });

      this.db = new Db();
      console.log("Command setup complete");
   }

   async start(){
      console.log("Starting bot...");
      await this.login(this.config.token);

      await this.db.connect();

      this.once(Events.ClientReady, ready.bind(null, this));
      this.on(Events.GuildCreate, guildCreate.bind(null, this));
      this.on(Events.InteractionCreate, interactionCreate.bind(null, this));

   }

   //async runCommand(interaction: Interaction){

      //let passthrough: Passthrough = {client: this, message, args};

      // if(middlewareMapping.has(command.info.simplename)){
      //    let mwToUse = middlewareMapping.get(command.info.simplename);
      //    if(mwToUse && mwToUse.length){
      //       for(let mwStr of mwToUse){
      //          let mw = Object.entries(middleware).find(([k,v]) => k === mwStr);
      //          if(mw){
      //             passthrough = await mw[1](passthrough);
      //          }
      //       }
      //    }
      // } else {
      //    for(let middlewareFn of Object.values(middleware)){
      //       passthrough = await middlewareFn(passthrough);
      //    }
      // }

      //await command.run(passthrough.client, passthrough.message, passthrough.args);



   //}

   // getCommandFromString(cmd: string){
   //    for(let k of this.commands){
   //       if(k.info.executeRegex.test(cmd.toLowerCase())){
   //          return k;
   //       }
   //    }
   // }
}