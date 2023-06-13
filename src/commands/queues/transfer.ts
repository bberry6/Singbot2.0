import { Interaction } from 'discord.js';
import { Command } from '../Command';
import { EventBot } from '../../EventBot';
import { QueueDoc } from '../../models';

export class Transfer extends Command {

  constructor(){
    super({
      name: 'queuetransfer',
      category: 'queues',
      description: `Transfers a queue from one owner to another.  Can only be used by the owner of the queue.`,
      stringOptions: [{name: 'name', description: 'Name of the queue. This parameter is for mods only.',  isAutocomplete: true}],
      userOptions: [{name: 'transferee', description: 'Mentioned person to transfer the queue ownership to', isRequired: true}]
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

      
      let transferee = interaction.options.getUser("transferee");

      let creatorsQueues = await db.queues.getByCreator(transferee.id, interaction.guild.id);
      if(creatorsQueues.length >= 5){
        throw new Error(`That member owns a queue in this server already.  Have them run /queuedelete first.`);
      } 

      await db.queues.setCreator(q, transferee.id);
      await interaction.reply(`The queue has been reassigned to <@!${ transferee.id}>.  Hope you are up to the task! :)`);

    } catch(e){
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