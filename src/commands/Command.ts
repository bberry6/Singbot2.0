import {SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Interaction, InteractionResponse} from 'discord.js'
import { EventBot } from '../EventBot';

declare type StringOption = {
   name: string;
   description: string;
   isRequired?: boolean;
   isAutocomplete?: boolean;
}

declare type UserOption = {
   name: string;
   description: string;
   isRequired?: boolean;
}

declare type TextInput = {
   label: string;
   style: TextInputStyle
   maxLength?: number;
   minLength?: number;
   placeholder?: string;
   defaultValue?: string;
   isRequired?: boolean;
}

declare type ModalOption = {
   title?: string
   textInputs: TextInput[]
}

export type CommandInfo = {
   category: string;
   secure?: boolean;
   name: string;
   stringOptions?: StringOption[]
   modalOption?: ModalOption
   userOptions?: UserOption[]
   description: string;
}

export class Command {
   info: CommandInfo
   data: SlashCommandBuilder
   constructor(config:CommandInfo){
      if (!config ) {
         throw new Error('You need to initialise this command with a info.');
      }
      this.info = config;
   }
   async execute(client: EventBot, interaction: Interaction):Promise<InteractionResponse<boolean>>{
      if (!interaction.isChatInputCommand()) return;
      interaction.reply("You should never see this.  This is an error.  Contact bberry7#6211");
   }
   async autocomplete(client: EventBot, interaction: Interaction){
      if (!interaction.isAutocomplete()) return;
      interaction.respond([]);
   }
   generateModal(modalOption: ModalOption){
      
		const modal = new ModalBuilder()
      .setCustomId('myModal')
      .setTitle(modalOption.title || "Command Prompt");

      // TBD: finish modals https://discordjs.guide/interactions/modals.html
   }
   init(){

      if(this.info.modalOption){
         this.generateModal(this.info.modalOption);
         return;
      }

      this.data = new SlashCommandBuilder()
      .setName(this.info.name)
      .setDescription(this.info.description);

      if(this.info.userOptions?.length){
         this.info.userOptions.forEach(uo =>
            this.data.addUserOption(option => {
               let tmp = option.setName(uo.name).setDescription(uo.description)
               if(uo.isRequired) tmp.setRequired(true);
               return tmp;
            })
         )
      }

      // TBD: expand this to work with discords options
      if(this.info.stringOptions?.length){
         this.info.stringOptions.forEach(so =>
            this.data.addStringOption(option => {
               let tmp = option.setName(so.name).setDescription(so.description)
               if(so.isRequired) tmp.setRequired(true);
               if(so.isAutocomplete) tmp.setAutocomplete(true);
               return tmp;
            })
         )
      }

   }
}
