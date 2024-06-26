import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { decompressUUID } from "../util/decompress-uuid";
import { get_icon, z_pull_request, z_task } from "../notion_types";
import { Client as NotionClient } from "@notionhq/client";
import { EmbedBuilder } from "discord.js";
import crypto from "crypto";

const notionClient = new NotionClient({ auth: process.env.NOTION_TOKEN });

@Discord()
export class Example {
  @On()
  messageDelete([message]: ArgsOf<"messageDelete">, client: Client): void {
    console.log("Message Deleted", client.user?.username, message.content);
  }

  @On()
  async messageCreate(
    [message]: ArgsOf<"messageCreate">,
    client: Client,
  ): Promise<void> {
    const request_id = crypto.randomUUID();
    if (message.author.id === client.user?.id) {
      return;
    }

    console.log(
      "Message Created:",
      "Author:",
      message.author.username,
      "Content:",
      message.content,
    );
    const url_regex = /(https?:\/\/\S+)/g;
    const urls =
      message.content.match(url_regex)?.map((url) => new URL(url)) ?? [];
    if (urls.length === 0) {
      return;
    }

    const notion_url = urls.find((url) => url.hostname === "www.notion.so");

    if (!notion_url) {
      return;
    }

    const squished =
      notion_url.searchParams.get("p") || notion_url.pathname.split("-").at(-1);
    if (!squished) {
      throw new Error("Invalid URL");
    }
    const page_id = decompressUUID(squished);

    const page_ = await notionClient.pages
      .retrieve({ page_id })
      .catch((error) => {
        console.error({ error, request_id });
        return null;
      });

    if (!page_) {
      await message.reply("Page not found; request ID: " + request_id);
      return;
    }

    const page = z_task.parse(page_);

    const author_id = page.properties["Author"].people?.[0]?.id;
    const title = page.properties["Task name"].title[0].plain_text;
    const status = page.properties["Status"].status.name;
    const assignee_id = page.properties["Assignee"]?.people?.[0]?.id;
    const pr_relation_id =
      page.properties["GitHub Pull Requests"].relation?.[0]?.id;
    const id =
      page.properties["ID"].unique_id.prefix +
      "-" +
      page.properties["ID"].unique_id.number;
    if (!page.icon) {
      throw new Error("No icon");
    }
    const icon = page.icon ? get_icon(page.icon) : null;

    const author = author_id
      ? await notionClient.users.retrieve({ user_id: author_id })
      : null;
    const assignee = assignee_id
      ? await notionClient.users.retrieve({ user_id: assignee_id })
      : null;
    const pr_notion_page = pr_relation_id
      ? await notionClient.pages.retrieve({ page_id: pr_relation_id })
      : null;
    const pr_page = pr_relation_id
      ? z_pull_request.parse(pr_notion_page)
      : null;

    const fields = [
      { name: "Status", value: status, inline: true },
      { name: "ID", value: id, inline: true },
    ];

    if (assignee) {
      fields.push({ name: "Assignee", value: assignee.name!, inline: true });
    }

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(title)
      .setURL(page.url);

    if (icon) {
      embed.setThumbnail(icon);
    }
    if (author) {
      embed.setAuthor({ name: author.name!, iconURL: author.avatar_url! });
    }
    if (pr_page) {
      const description =
        pr_page.properties.Description.rich_text?.[0]?.plain_text?.replace(
          /\\(.)/g,
          "$1",
        );

      embed.setDescription(description || null);
      const pr_number = pr_page.properties["PR Number"].number;
      const pr_url = `https://github.com/${process.env.GITHUB_REPO}/pull/${pr_number}`;
      fields.push({
        name: "PR",
        value: `[EduBeyond/EduBeyond#${pr_number}](${pr_url})`,
        inline: true,
      });
    }

    embed.addFields(fields);
    await message.reply({ embeds: [embed] });
  }
}
