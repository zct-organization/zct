const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { Readable } = require('stream');
const path = require('path');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');
const sql = require('../db');
const authGuard = require('../middleware/authGuard');
require('dotenv').config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer();

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
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: input_text,
      ...(instructions && { instructions }),
      response_format,
      speed: parseFloat(speed)
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    await sql`
      INSERT INTO transcription_history (user_id, request_type, input_text, audio_data)
      VALUES (${req.user.id}, 'tts', ${input_text}, ${buffer})
    `;

    res.setHeader('Content-Type', `audio/${response_format}`);
    res.send(buffer);

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

  try {
    const fileStream = Readable.from(req.file.buffer);
    fileStream.path = req.file.originalname; 

    const options = {
      file: fileStream,
      model,
      response_format,
      temperature: parseFloat(temperature),
    };

    if (prompt) options.prompt = prompt;
    if (language) options.language = language;

    if (model === 'whisper-1' && response_format === 'verbose_json' && timestamp_granularities) {
      try {
        options.timestamp_granularities = JSON.parse(timestamp_granularities);
      } catch (err) {
        return res.status(400).json({ msg: 'Invalid JSON in timestamp_granularities' });
      }
    }

    const transcription = await openai.audio.transcriptions.create(options);

    await sql`
      INSERT INTO transcription_history (user_id, request_type, transcript_text)
      VALUES (${req.user.id}, 'stt', ${transcription.text})
    `;

    if (response_format === 'json' || response_format === 'verbose_json') {
      res.json(transcription);
    } else {
      res.type(response_format).send(transcription);
    }

  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ msg: 'Error transcribing audio', error: error.message });
  }
});

module.exports = router;
