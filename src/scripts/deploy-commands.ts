import {REST, Routes, Collection, RESTPostAPIChatInputApplicationCommandsJSONBody} from 'discord.js'
import * as fs from 'node:fs';
import * as path from 'node:path'
import * as commands from '../commands'
import * as util from 'node:util'
import {Command} from '../commands/Command'

let configPath = path.join(__dirname, '../../config.json')
const { clientId, guildId, token } = require(configPath);

let commandsToSendToDiscord:RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

let createdCommands = Object.values(commands).map((command) => {
  let cmd = new command();
  return cmd;
});

for(let cmd of createdCommands){
  if('data' in cmd){
    commandsToSendToDiscord.push(cmd.data.toJSON());
  } else {
    // @ts-ignore
    console.log(`[WARNING] The command ${cmd.info.name} is missing a required "data" or "execute" property.`);
  }
};

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commandsToSendToDiscord.length} application (/) commands.`);

    if(process.argv[2] === '--dev'){
      //The put method is used to fully refresh all commands in the guild with the current set
      const data = await rest.put(
      	Routes.applicationGuildCommands(clientId, guildId),
      	{ body: commandsToSendToDiscord },
      );
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsToSendToDiscord },
      );
    }

		console.log(`Successfully reloaded ${commandsToSendToDiscord.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();