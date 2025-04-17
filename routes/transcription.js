const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const sql = require('../db');
const authGuard = require('../middleware/authGuard');
require('dotenv').config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

router.post('/text-to-speech', authGuard, upload.none(), async (req, res) => {
  const {
    input_text,
    model = "tts-1",
    voice = 'nova',
    instructions,
    response_format = 'mp3',
    speed = '1.0'
  } = req.body;

  if (!input_text) {
    return res.status(400).json({ msg: 'input_text is required' });
  }

  try {
    const filename = `${uuidv4()}.${response_format}`;
    const outputPath = path.join(__dirname, '../output', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const response = await openai.audio.speech.create({
      model,
      voice,
      input: input_text,
      ...(instructions && { instructions }),
      response_format,
      speed: parseFloat(speed)
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

    await sql`
      INSERT INTO transcription_history (user_id, request_type, input_text, audio_data)
      VALUES (${req.user.id.toString()}, 'tts', ${input_text}, ${buffer})
    `;

    res.sendFile(outputPath, () => {
      setTimeout(() => fs.unlinkSync(outputPath), 30000);
    });

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ msg: 'Error generating speech', error: error.message });
  }
});

router.post('/speech-to-text', authGuard, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No audio file uploaded' });
  }

  const {
    model = 'whisper-1',
    prompt,
    response_format = 'json',
    temperature = '0',
    language,
    timestamp_granularities
  } = req.body;

  const tempFilename = `${uuidv4()}_${req.file.originalname}`;
  const tempFilePath = path.join(__dirname, '../temp', tempFilename);

  try {
    fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const options = {
      file: fs.createReadStream(tempFilePath),
      model,
      response_format,
      temperature: parseFloat(temperature),
    };

    if (prompt) options.prompt = prompt;
    if (language) options.language = language;

    if (
      model === 'whisper-1' &&
      response_format === 'verbose_json' &&
      timestamp_granularities
    ) {
      try {
        options.timestamp_granularities = JSON.parse(timestamp_granularities);
      } catch (err) {
        return res.status(400).json({ msg: 'Invalid JSON in timestamp_granularities' });
      }
    }

    const transcription = await openai.audio.transcriptions.create(options);

    fs.unlinkSync(tempFilePath);

    await sql`
      INSERT INTO transcription_history (user_id, request_type, transcript_text)
      VALUES (${req.user.id.toString()}, 'stt', ${transcription.text})
    `;

    if (response_format === 'json' || response_format === 'verbose_json') {
      res.json(transcription);
    } else {
      res.type(response_format).send(transcription);
    }

  } catch (error) {
    console.error('STT Error:', error);
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {}
    res.status(500).json({ msg: 'Error transcribing audio', error: error.message });
  }
});

router.get('/:id', authGuard, async (req, res) => {
  const { id } = req.params;

  try {
    const [entry] = await sql`
      SELECT * FROM transcription_history WHERE id = ${id} AND user_id = ${req.user.id.toString()}
    `;

    if (!entry) {
      return res.status(404).json({ msg: 'Entry not found' });
    }

    if (entry.request_type === 'tts' && entry.audio_data) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
      return res.send(entry.audio_data);
    }

    if (entry.request_type === 'stt' && entry.transcript_text) {
      return res.json({ transcript: entry.transcript_text });
    }

    res.status(400).json({ msg: 'Invalid entry data' });
  } catch (error) {
    console.error('GET /transcription/:id error:', error);
    res.status(500).json({ msg: 'Error retrieving transcription entry', error: error.message });
  }
});

module.exports = router;
