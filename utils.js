import 'dotenv/config';
import * as https from "node:https";

export async function DiscordRequest(endpoint, options) {
  const url = `https://discord.com/api/v10/${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const body = options.body && !isFormData
    ? JSON.stringify(options.body)
    : options.body;

  const headers = {
    Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    // FIXME: Would be nice to source this from package.json if we ever bother using versions.
    'User-Agent': 'BrickBot/1.0',
  };

  // fetch() automatically sorts this out for FormData.
  if (!isFormData) {
    headers['Content-Type'] = 'application/json; charset=UTF-8';
  }

  const res = await fetch(url, {
    // NB: options comes first, because it still has a `body` field that we want to be overridden.
    ...options,
    headers,
    body,
  });

  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }

  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  console.log(`Registering ${commands.length} commands...`);

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
    console.log(`Done!`);
  } catch (err) {
    console.error(err);
  }
}

export async function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", (error) => {
      reject(error);
    });
  })
}

export function sortObjectByKeys(unordered) {
  return Object.keys(unordered).sort().reduce(
    (obj, key) => {
      obj[key] = unordered[key];
      return obj;
    },
    {}
  );
}
