import { Interaction } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';

export class List extends Command {

  constructor(){
    super({
      name: 'queuelist',
      category: 'queues',
      description: `Prints out the owner, list of members, and lock status for the given queue.`,
      stringOptions: [{name: 'name', description: 'Name of the queue', isRequired: true, isAutocomplete: true}],
    });
    this.init();
  }
  async execute(client: EventBot, interaction: Interaction){

    const {db} = client;
    if (!interaction.isChatInputCommand()) return;
    if(!interaction.guild || !interaction.guild.id){
       return;
    }

    let selectedQueue = interaction.options.getString('name');
    try {

       let queue = await db.queues.getQueue(selectedQueue, interaction.guild.id);

       const creator = await interaction.guild.members.fetch(queue.creatorid);
       let text = `${queue.locked ? ':lock:' : ':unlock:'} Queue **${selectedQueue} \n Owned by **${creator.user.tag}${creator.nickname ? ` (${creator.nickname})` : ''} \n\n`;

       if (queue.enqueued.length === 0) {
          text += 'There is nobody in the queue.';
       } else {

        let i = 0;
        let skipped = 0;
        for(let enq of queue.enqueued){
            if(interaction.guild && interaction.guild.members){
              try {
                  const next = await interaction.guild.members.fetch(enq.userid);
                  if(i===0){
                    let tmpstr = `**${++i}. ${next.nickname ? next.nickname : next.user.tag.slice(0,next.user.tag.indexOf('#'))}**.`;
                    if(queue.enqueued[i]){
                        tmpstr += `\n\n`;
                    }
                    text += tmpstr;
                    continue;
                  }
                  text +=`${++i}. ${next.nickname ? next.nickname : next.user.tag.slice(0,next.user.tag.indexOf('#'))}.\n`;
              } catch(e){
                  skipped++;
              }
            }
        }
        if(skipped === queue.enqueued.length){
            text += 'There is nothing in the queue.';
        }
      }
       return interaction.reply(text);

    } catch(e){
      console.error(e.message);
       return interaction.reply(`❌ Error: ${e.message}`);
    }

  }
  async autocomplete(client: EventBot, interaction: Interaction){
    const {db} = client;
    if (!interaction.isAutocomplete()) return;

    let guildQueues = await db.queues.getByGuild(interaction.guild.id);
    let queueNames = guildQueues.map(uq => uq.name);
    const focusedValue = interaction.options.getFocused();
		const filtered = queueNames.filter((choice:string) => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
  }
}
