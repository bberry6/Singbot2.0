import { Interaction } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';

export class Leave extends Command {

  constructor(){
    super({
      name: 'queueleave',
      category: 'queues',
      description: 'Removes yourself from the specified queue',
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

    let queues = await db.queues.getByGuild(interaction.guild.id);
    if (queues.length === 0) {
        throw new Error('This guild has no queues.');
    }

    try {
        let queue = await db.queues.getQueue(selectedQueue, interaction.guild.id);
        let found = queue.enqueued.some(eq => eq.userid === interaction.user.id);
        if (!found) {
          throw new Error(`You aren\'t in this queue.`);
        }

        await db.queues.removeFromQueue(queue, interaction.user.id);
    } catch(e){
      console.error(e.message);
      return interaction.reply({content:`❌ Error: ${e.message}`, ephemeral: true});
    }

    const creator = await interaction.guild.members.fetch(interaction.user.id);
    return interaction.reply({content: `${creator} has left the queue: '${selectedQueue}'.`});

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



