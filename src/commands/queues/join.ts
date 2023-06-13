import { Interaction } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';

export class Join extends Command {

  constructor(){
    super({
      name: 'queuejoin',
      category: 'queues',
      description: `Joins a queue if not locked.  You'll be added to the bottom of the list. Max length: 100 people.`,
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
       const queue = await db.queues.getQueue(selectedQueue, interaction.guild.id);

       if (queue.locked) {
          throw new Error('This queue is locked. No one can enter until the queue is unlocked..');
       }

       if(queue.enqueued.length >= 100){
          throw new Error('The maximum number of people have entered the queue')
       }

       for (const enqueued of queue.enqueued) {
          if (enqueued.userid === interaction.user.id) {
             throw new Error('You are already in this queue. Leave the queue first to rejoin. **Warning: Your position will be forgotten.**');
          }
       }

       await db.queues.addToQueue(queue, interaction.user.id, '');

    } catch(e) {
      console.error(e.message);
       return interaction.reply({content: `❌ Error: ${e.message}`, ephemeral: true});
    }
    
    const creator = await interaction.guild.members.fetch(interaction.user.id);
    return interaction.reply({content: `${creator} has joined the queue: '${selectedQueue}'.`});
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
};