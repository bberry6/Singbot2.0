import { GuildMemberRoleManager, Interaction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';

export class Delete extends Command {

  constructor(){
    super({
      name: 'queuedelete',
      category: 'queues',
      description: 'Deletes a queue with the given name.  Queues are automatically deleted after 24 hours.',
      stringOptions: [{name: 'name', description: 'Name of the queue', isRequired: true, isAutocomplete: true}],
    });
    this.init();
  }
  async execute(client: EventBot, interaction: Interaction){

    const {db} = client;

    if (!interaction.isChatInputCommand()) return;

    if(!interaction.guild){
        return;
    }

    let proposedName = interaction.options.getString('name')
    try {
        let queue = await db.queues.getQueue(proposedName, interaction.guild.id);
        /** @ts-ignore */
        let userRoles:GuildMemberRoleManager = interaction.member.roles;
        if(queue.creatorid !== interaction.user.id && !userRoles.resolveId(client.config.overrideRoleId)){
          throw new Error(`Only the queues creator can use this command.`)
        }
        await db.queues.remove(queue);
    } catch(e){
      console.error(e.message);
      return interaction.reply({content:`❌ Error: ${e.message}`, ephemeral: true});
    }

    interaction.reply({content: `The queue with the name '${proposedName}' has been removed!`, ephemeral: true});
  }
  async autocomplete(client: EventBot, interaction: Interaction){

    const {db} = client;
    if (!interaction.isAutocomplete()) return;

    let userQueues = await db.queues.getByCreator(interaction.user.id, interaction.guild.id);
    let queueNames = userQueues.map(uq => uq.name);
    const focusedValue = interaction.options.getFocused();
		const filtered = queueNames.filter((choice:string) => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
  }
};