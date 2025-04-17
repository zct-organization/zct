const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer();

router.post('/text-to-speech', upload.none(), async (req, res) => {
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

    res.sendFile(outputPath, () => {
      setTimeout(() => fs.unlinkSync(outputPath), 30000);
    });

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ msg: 'Error generating speech', error: error.message });
  }
});


router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No audio file uploaded' });
  }

  const {
    model = 'whisper-1',                         // whisper-1 | gpt-4o-transcribe | gpt-4o-mini-transcribe
    prompt,                                      // optional
    response_format = 'json',                    // json, text, srt, verbose_json, vtt
    temperature = '0',                           // optional, float
    language,                                    // optional (e.g. "en", "sk", "de")
    timestamp_granularities                      // optional JSON array string: '["word","segment"]'
  } = req.body;

  try {
    const options = {
      file: fs.createReadStream(req.file.path),
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

    fs.unlinkSync(req.file.path); 

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
