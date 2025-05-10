require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");
const cors = require("cors");
const multer = require("multer");  // Requerir multer para manejar archivos

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

// Configurar multer para almacenar archivos
const storage = multer.memoryStorage(); // Usamos memoria para manejar el archivo
const upload = multer({ storage: storage }); // Configuramos multer

app.use(cors());
app.use(express.json());

// 🌐 Web API para recibir mensajes desde el frontend
app.post("/send-message", upload.single("file"), async (req, res) => {
  const { channelId, message } = req.body;
  const file = req.file;  // Recibimos el archivo de la petición

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return res.status(404).json({ error: "Canal no encontrado" });

    // Si hay un archivo, lo enviamos junto al mensaje
    if (file) {
      await channel.send({
        content: message,
        files: [{ attachment: file.buffer, name: file.originalname }],
      });
    } else {
      await channel.send({ content: message });
    }
    res.json({ status: "Mensaje enviado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});

// ✉️ Enviar mensaje privado a un usuario
app.post("/send-dm", upload.single("file"), async (req, res) => {
  const { userId, message } = req.body;
  const file = req.file;

  try {
    const user = await client.users.fetch(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Si hay un archivo, lo enviamos junto al mensaje
    if (file) {
      await user.send({
        content: message,
        files: [{ attachment: file.buffer, name: file.originalname }],
      });
    } else {
      await user.send({ content: message });
    }
    res.json({ status: "DM enviado" });
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
