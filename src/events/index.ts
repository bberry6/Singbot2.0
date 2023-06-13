import {EventBot} from '../EventBot';
import {Message, Guild, Interaction} from 'discord.js'
import { Command } from '../commands/Command';

export function ready(EventBot: EventBot){
   console.log(`Logged in as ${EventBot.user.tag}!`);
   if(EventBot.user){
      EventBot.user.setPresence({activities: [{name: `infinite servers! ${EventBot.config.prefix}help`}], status: 'online'});
   }

   if(EventBot.config.runMode === 'dev'){
      return;
   }
}


// placeholder for future functionality
export async function message(EventBot: EventBot, msg: Message){
   return;
   // if(!msg.guild) return;

   // const [cmd, ...args] = msg.content.substring(EventBot.prefixes[msg.guild.id]?.length).split(' ');

   // try {
   //    //await EventBot.runCommand(cmd, args, msg);
   // } catch(err){
   //    console.error("Unhandled error running command: ", err);
   //    await msg.channel.send(`Error running command ${cmd}.
   //       ❌ Error: \`${err.message}\`
   //       If this keeps happening, contact bberry7#6211.`);
   // }
}


export async function guildCreate(EventBot: EventBot, guild: Guild){
   await guild.systemChannel?.send(`Thanks for adding me, EventBot! Type \`/help\` and select this bot to see my commands list. Enjoy!`);
}


export async function interactionCreate(client: EventBot, interaction:Interaction){
   if (interaction.isChatInputCommand()){

      const command = client.commands.get(interaction.commandName);
      if(!command){
         console.error(`No command matching ${interaction.commandName} found.`);
         return;
      }
   
      try{
         await command.execute(client, interaction);
      }catch(error){
         console.error(error);
         if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
         } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
         }
      }

   } else if(interaction.isAutocomplete()){
      const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(client, interaction);
		} catch (error) {
			console.error(error);
		}
   }

 }
