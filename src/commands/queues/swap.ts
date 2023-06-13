import { Interaction } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';
import { QueueDoc } from '../../models';

export class Swap extends Command {

  constructor(){
    super({
      name: 'queueswap',
      category: 'queues',
      description: `Switches the position of two users within a queue. Can only be used by the owner of the queue.`,
      stringOptions: [{name: 'name', description: 'Name of the queue. This parameter is for mods only.', isAutocomplete: true}],
      userOptions: [{name: "firstperson", description: "First person to swap", isRequired: true},{name: "secondperson", description: "Second person to swap", isRequired: true}]
    });
    this.init();
  }
  async execute(client: EventBot, interaction: Interaction){
    const {db} = client;
    if (!interaction.isChatInputCommand()) return;
    if(!interaction.guild || !interaction.guild.id){
      return;
    }

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

      let first = interaction.options.getUser("firstperson");
      let second = interaction.options.getUser("secondperson");


      let retArr: number[] = [];
      retArr = q.enqueued.reduce((ret, curmem, idx)=>{
         if(curmem.userid == first.id || curmem.userid == second.id){
            ret = ret.concat([idx]);
         }
         return ret;
      }, retArr);

      if(retArr.length !== 2){
         throw new Error(`Developer error, contact bberry7#6211`);
      }

      let [idx1, idx2] = retArr;

      if(idx1 === undefined || idx2 === undefined){
         throw new Error(`One (or more) of the members you mentioned are not in the queue!`);
      }

      await db.queues.swapPeopleInQueue(q, idx1, idx2);

      let text = "";
      if(interaction.guild.members){
         const creator = await interaction.guild.members.fetch(q.creatorid);
         text = `Members swapped! Updated Queue:\n${q.locked ? ':lock:' : ':unlock:'} Made by **${creator.user.tag}**${creator.nickname ? ` (${creator.nickname})` : ''} | Locked: **${q.locked ? 'Yes' : 'No'}**.\n\n`;
      }

      let i = 0;
      let skipped = 0;
      for(let enq of q.enqueued){
         if(interaction.guild && interaction.guild.members){
            try {
               const next = await interaction.guild.members.fetch(enq.userid);
               if(i===0){
                  i++;
                  let tmpstr = `**${i}. ${next.nickname ? next.nickname : next.user.tag.slice(0,next.user.tag.indexOf('#'))}**.`;
                  if(q.enqueued[i]){
                     tmpstr += `\n\n`;
                  } else {
                     tmpstr += '\n No one else!'
                  }
                  text += tmpstr;
                  continue;
               }
               text +=`${i++}. ${next.nickname ? next.nickname : next.user.tag.slice(0,next.user.tag.indexOf('#'))}.\n`;
            } catch(e){
               skipped++;
            }
         }
      }
      if(skipped === q.enqueued.length){
         text += 'There is nothing in the queue.';
      }
      return interaction.reply(text);

    } catch(e){
      console.error(e.message);
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

