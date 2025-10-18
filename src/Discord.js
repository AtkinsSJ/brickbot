// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
import {InteractionResponseType} from "discord-interactions";
import {DiscordRequest} from "../utils.js";

export const CommandType = {
  ChatInput: 1,
  User: 2,
  Message: 3,
  PrimaryEntryPoint: 4,
};

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
export const OptionType = {
  SubCommand: 1,
  SubCommandGroup: 2,
  String: 3,
  Integer: 4,
  Booleen: 5,
  User: 6,
  Channel: 7,
  Role: 8,
  Mentionable: 9,
  Number: 10,
  Attachment: 11,
};

// https://discord.com/developers/docs/components/reference#component-object-component-types
export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  File: 13,
  Separator: 14,
  Container: 17,
};

// https://discord.com/developers/docs/resources/message#message-object-message-flags
export const MessageFlag = {
  Crossposted: 1 << 0,
  IsCrosspost: 1 << 1,
  SuppressEmbeds: 1 << 2,
  SourceMessageDeleted: 1 << 3,
  Urgent: 1 << 4,
  HasThread: 1 << 5,
  Ephemeral: 1 << 6,
  Loading: 1 << 7,
  FailedToMentionSomeRolesInThread: 1 << 8,
  SuppressNotifications: 1 << 12,
  IsVoiceMessage: 1 << 13,
  HasSnapshot: 1 << 14,
  IsComponentsV2: 1 << 15,
};

export function generateInfoBox(accentColor, text, thumbnailURL) {
  return {
    flags: MessageFlag.IsComponentsV2,
    components: [{
      type: ComponentType.Container,
      accent_color: accentColor,
      components: [{
        type: ComponentType.Section,
        components: [{
          type: ComponentType.TextDisplay,
          content: text,
        }],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: thumbnailURL || "https://rebrickable.com/static/img/nil.png",
          }
        },
      }]
    }]
  };
}

export async function sendLoadingMessage(response, text) {
  return response.send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: text,
    }
  });
}

export async function replaceLoadingMessage(request, text) {
  const LOADING_MESSAGE_URL = `webhooks/${process.env.APP_ID}/${request.body.token}/messages/@original`;
  return DiscordRequest(LOADING_MESSAGE_URL, {
    method: "PATCH",
    body: {
      content: text,
    },
  }).catch((error) => {
    console.error(`Failed to replace loading message with "${text}":\n\n${error}`);
    DiscordRequest(`webhooks/${process.env.APP_ID}/${request.body.token}`, {
      method: "POST",
      body: {
        content: ":boom: Error when trying to patch discord message. Contact AtkinsSJ!",
      }
    });
  });
}

export async function sendResultMessage(request, messageBody) {
  return DiscordRequest(`webhooks/${process.env.APP_ID}/${request.body.token}`, {
    method: "POST",
    body: messageBody,
  }).catch((error) => {
    console.error(`Failed to send result message "${JSON.stringify(messageBody)}":\n\n${error}`);
    DiscordRequest(`webhooks/${process.env.APP_ID}/${request.body.token}`, {
      method: "POST",
      body: {
        content: ":boom: Error when trying to send a discord message. Contact AtkinsSJ!",
      }
    });
  });
}
