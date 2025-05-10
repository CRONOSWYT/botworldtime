require("dotenv").config();
const { Client, GatewayIntentBits, Partials, AttachmentBuilder } = require("discord.js");
const express = require("express");
const multer = require("multer"); // Para manejar archivos subidos
const cors = require("cors");

const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// Configuración de multer para manejar las cargas de archivos
const storage = multer.memoryStorage(); // Usamos memoria para los archivos temporales
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// 🌐 Web API para recibir mensajes y archivos desde el frontend
app.post("/send-message", upload.array("files"), async (req, res) => {
  const { channelId, message } = req.body;
  const files = req.files;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return res.status(404).json({ error: "Canal no encontrado" });

    const attachments = files.map(file => {
      return new AttachmentBuilder(file.buffer, { name: file.originalname });
    });

    await channel.send({ content: message, files: attachments });
    res.json({ status: "Mensaje con archivos enviado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});

// ✉️ Enviar mensaje privado a un usuario con archivos adjuntos
app.post("/send-dm", upload.array("files"), async (req, res) => {
  const { userId, message } = req.body;
  const files = req.files;

  try {
    const user = await client.users.fetch(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const attachments = files.map(file => {
      return new AttachmentBuilder(file.buffer, { name: file.originalname });
    });

    await user.send({ content: message, files: attachments });
    res.json({ status: "DM con archivos enviado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar DM" });
  }
});

// 👋 Bienvenida y despedida
client.on("guildMemberAdd", async (member) => {
  const mensaje = `👋 ¡Bienvenido a **World Time**, ${member.user.username}!
  
Estamos felices de tenerte aquí. Usa los comandos y explora el contenido disponible.`;
  try {
    await member.send(mensaje);
  } catch (err) {
    console.error("No se pudo enviar el DM de bienvenida.", err);
  }
});

client.on("guildMemberRemove", async (member) => {
  try {
    await member.send(`👋 ¡Hasta luego, ${member.user.username}! Esperamos verte pronto.`);
  } catch (err) {
    console.error("No se pudo enviar el DM de despedida.", err);
  }
});

// 🌍 Arranque del bot y servidor
client.once("ready", () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Servidor Express activo en el puerto ${PORT}`));
