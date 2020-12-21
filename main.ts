import {
  Client,
  Intents,
  Message,
  TextChannel,
} from "https://deno.land/x/harmony/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

interface NaverTranslateResponse {
  message: NaverTranlateMessage;
}

export interface NaverTranlateMessage {
  "@type": string;
  "@service": string;
  "@version": string;
  result: Result;
}

export interface Result {
  srcLangType: string;
  tarLangType: string;
  translatedText: string;
  engineType: string;
  pivot: null;
}

const {
  BOT_TOKEN,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  CH_KOREAN,
  CH_JAPANESE,
} = config();
if (
  !BOT_TOKEN || 
  !NAVER_CLIENT_ID || 
  !NAVER_CLIENT_SECRET || 
  !CH_KOREAN ||
  !CH_JAPANESE
) {
  throw new Error("environment BOT_TOKEN, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, CH_KOREAN, CH_JAPANESE needed! please add values on .env file");
}

const client = new Client({});

// Listen for event when client is ready (Identified through gateway / Resumed)
client.on("ready", async () => {
  console.log(`Ready! User: ${client.user?.tag}`);
});

// Listen for event whenever a Message is sent
client.on("messageCreate", async (msg: Message): Promise<void> => {
  if (msg.content === "!ping") {
    msg.channel.send(`Pong! WS Ping: ${client.ping}`);
  }

  if (!msg.member?.user.bot) {
    switch (msg.channelID) {
      case CH_KOREAN:
        const channelKO = await client.channels.get<TextChannel>(
          CH_JAPANESE,
        );
        const translatedJP = await translate(
          msg.content,
          Languages.KO,
          Languages.JP,
        );
        channelKO?.send(`${msg.member?.user.username}: ${translatedJP}`);
        break;
      case CH_JAPANESE:
        const channelJP = await client.channels.get<TextChannel>(
          CH_KOREAN,
        );
        const translatedKO = await translate(
          msg.content,
          Languages.JP,
          Languages.KO,
        );
        channelJP?.send(`${msg.member?.user.username}: ${translatedKO}`);
    }
  }
});

//#region Translate
const enum Languages {
  KO = "ko",
  EN = "en",
  JP = "ja",
}
const translate = async (msg: string, from: Languages, to: Languages) => {
  const api_url = "https://openapi.naver.com/v1/papago/n2mt";

  const options: RequestInit = {
    method: "POST",
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: `source=${from}&target=${to}&text=${msg}`,
  };

  const response = await fetch(api_url, options);

  if (response.ok) {
    const responseJson = await response.json() as NaverTranslateResponse;
    return responseJson?.message?.result?.translatedText;
  } else {
    throw new Error(await response.text());
  }
};

// Connect to gateway
// Replace with your bot's token and intents (Intents.All, Intents.None, Intents.Presence, Intents.GuildMembers)
client.connect(BOT_TOKEN, Intents.None);
//#endregion
