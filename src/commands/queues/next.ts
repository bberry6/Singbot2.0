import { Interaction } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';
import { QueueDoc } from '../../models';
import * as util from 'node:util'
export class Next extends Command {

  constructor(){
    super({
      name: 'queuenext',
      category: 'queues',
      description: `Removes the first person and tags the next person in the queue.`,
      stringOptions: [{name: 'name', description: 'Name of the queue. This parameter is for mods only.', isAutocomplete: true}],
    });
    this.init();
  }
  async execute(client: EventBot, interaction: Interaction){
    const {db} = client;
    if (!interaction.isChatInputCommand()) return;
    if(!interaction.guild || !interaction.guild.id){
      return;
    }

    let removed = false;


    let channel = await interaction.client.channels.fetch(interaction.channelId);
    try {
      let selectedQueue: string = '';

      let qs = await db.queues.getByCreator(interaction.user.id, interaction.guild.id);
      if(!qs.length && !interaction.options.getString('name')) throw new Error(`You have no queues to lock`);
      if(qs.length > 1) throw new Error(`IDK how you did it but you have multiple queues.  Ask bberry7#6211 how to fix. Sorry!`);
      let q = qs[0];

      /** @ts-ignore */
      let userRoles:GuildMemberRoleManager = interaction.member.roles;
      if(userRoles.resolveId(client.config.overrideRoleId)){
        selectedQueue = interaction.options.getString('name');
        if(!selectedQueue?.length){ 
          selectedQueue = q.name;
        } else {
          let qs = await db.queues.getByGuild(interaction.guild.id);
          q = qs.find(q => q.name === selectedQueue);
          if(!q) throw new Error(`Could not find selected queue with name ${selectedQueue}.  Something is probably wrong... contact bberry7#6211`);
        }
      } else if(interaction.options.getString('name') !== q.name){
        throw new Error(`You entered a name of a queue that you do not own.`);
      }

      if (q.enqueued.length === 0) {
        throw new Error(`There is no one left in the queue.`);
      }

      await db.queues.removeFromQueue(q, q.enqueued[0].userid);
      for(let i = 0; i < q.enqueued.length; i++){
        let enq = q.enqueued[i];
        if(!enq){break}
        try {
           const next = await interaction.guild.members.fetch(enq.userid);
           if (!next) {
              throw new Error(`Could not find next person in queue. This usually shows up when a user leaves the server while in queue. They've been removed. Run /queuenext again!`);
           }

           if(channel.isTextBased()){
             await channel.send(`Next up is: **${next}**!`);
           }
        } catch(e){
          console.log(e);
           await db.queues.removeFromQueue(q, enq.userid);
           removed = true;
        }
        
        if(removed){
          return interaction.reply(`Queue is finished! There is no one left in the queue.`);
        }
     }

     interaction.reply({content: `Successfully nexted the queue.${q.enqueued.length === 0 ? ' Queue is finished.' : ""}`, ephemeral: true})
    } catch(e){
      console.error(e.message);
      console.error(e);
      return interaction.reply({content:`❌ Error: ${e.message}`, ephemeral: true});
    }
  }
  async autocomplete(client: EventBot, interaction: Interaction){

    const {db} = client;
    if (!interaction.isAutocomplete()) return;

    let queues:QueueDoc[];
    
    /** @ts-ignore */
    let userRoles:GuildMemberRoleManager = interaction.member.roles;
    if(userRoles.resolveId(client.config.overrideRoleId)){
      queues = await db.queues.getByGuild(interaction.guild.id);
    } else {
      queues = await db.queues.getByCreator(interaction.user.id, interaction.guild.id)
    }

    let queueNames = queues.map(uq => uq.name);
    const focusedValue = interaction.options.getFocused();
		const filtered = queueNames.filter((choice:string) => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
  }
}
