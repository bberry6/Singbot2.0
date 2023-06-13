import { Interaction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';

export class Create extends Command {

  constructor(){
    super({
      name: 'queuecreate',
      category: 'queues',
      description: 'Creates a queue with a *unique* name.  Queues are automatically deleted after 24 hours.',
      stringOptions: [{name: 'name', description: 'Name of the queue', isRequired: true}]
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
      let creatorsQueues = await db.queues.getByCreator(interaction.user.id, interaction.guild.id);
      if(creatorsQueues.length >= 1){
          throw new Error(`You cannot own more than 1 queue`);
      }

      let proposedName = interaction.options.getString('name')
      let doesExist = await db.queues.checkQueueName(proposedName, interaction.guild.id);
      if (doesExist) {
          throw new Error(`A queue with name ${proposedName} already exists in this server. Try a unique name!`);
      }

      let result = await db.queues.create(proposedName, interaction.user.id, interaction.guild.id);
      if (typeof result === 'string') {
          throw new Error(`${result}`);
      }

      interaction.reply({content:`A queue with the name '${proposedName}' has been created! Use /queuejoin to join the queue!`});
    } catch(e){
      console.error(e.message);
      return interaction.reply({content:`❌ Error: ${e.message}`, ephemeral: true});
    }
  }
}
