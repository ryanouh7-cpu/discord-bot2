const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});

const prefix = "!";

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "bc") {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ You need Administrator permission.");
    }

    const msg = args.join(" ");
    if (!msg) return message.reply("❌ Write a message.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bc_all")
        .setLabel("Everyone")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("bc_online")
        .setLabel("Online Only")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("bc_offline")
        .setLabel("Offline Only")
        .setStyle(ButtonStyle.Secondary)
    );

    const sent = await message.reply({
      content: "📢 Choose broadcast type:",
      components: [row]
    });

    const collector = sent.createMessageComponentCollector({ time: 30000 });

    collector.on("collect", async (interaction) => {

      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: "❌ Not for you.", ephemeral: true });
      }

      await interaction.update({ content: "📢 Broadcasting...", components: [] });

      const members = await message.guild.members.fetch();

      let success = 0;
      let failed = 0;

      for (const member of members.values()) {
        if (member.user.bot) continue;

        if (interaction.customId === "bc_online") {
          if (!member.presence || member.presence.status === "offline") continue;
        }

        if (interaction.customId === "bc_offline") {
          if (member.presence && member.presence.status !== "offline") continue;
        }

        try {
          await member.send(`📢 **Broadcast Message:**\n\n${msg}`);
          success++;
        } catch {
          failed++;
        }
      }

      message.channel.send(`✅ Done\nSent: ${success}\nFailed: ${failed}`);
    });
  }
});

client.login(process.env.TOKEN);
