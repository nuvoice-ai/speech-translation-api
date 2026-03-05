/**
 * This code sample illustrates how to use the Speech Translation API in **streaming** mode.
 * Pre-requisites: Download test LJ_eng.wav file or substitute with another .wav file that you would like to test.
 */
const BASE_URL = "http://translation-api.nuvoice.ai:8000";
const { io } = require("socket.io-client");
const fs = require("fs");
const decoder = require("wav-decoder");
const encoder = require("wav-encoder");
// wget https://nuvoice-ai-public.s3.us-west-2.amazonaws.com/LJ_eng.wav
const file = "LJ_eng.wav";
const output = "streaming.wav";
const targetLanguage = "hin";
const CHUNK_DURATION_MS = 1000;

function adapter(speechSamples) {
  if (Buffer.isBuffer(speechSamples)) {
    return new Float32Array(
      speechSamples.buffer,
      speechSamples.byteOffset,
      speechSamples.byteLength / 4
    );
  } else if (speechSamples instanceof ArrayBuffer) {
    return new Float32Array(speechSamples);
  } else if (Array.isArray(speechSamples)) {
    return Float32Array.from(speechSamples);
  }
  throw new Error(`Unexpected speechSamples type: ${typeof speechSamples}`);
}

// ------------------------------------------------------------------ //
//  Streaming client — connects to the /streaming namespace
// ------------------------------------------------------------------ //

class StreamingSpeechTranslationClient {
  constructor({ speechCallback, textCallback, connectCallback, errorCallback, disconnectCallback }) {
    this.socket = io(BASE_URL + "/streaming", {
          transports: ['websocket'],    // Use WebSocket only, skip HTTP polling (more reliable for audio))
    });
    this.socket.on("speech", (samples, meta) =>
      speechCallback && speechCallback(adapter(samples), meta)
    );
    this.socket.on("text", (data) => textCallback && textCallback(data));
    this.socket.on("stream_started", () => console.log("stream started"));
    this.socket.on("stream_stopped", () => {
      console.log("stream stopped");
      this.socket.disconnect();      
    });
    this.socket.on("error", (msg) =>
      errorCallback ? errorCallback(msg) : console.error("server error:", msg)
    );
    this.socket.on("connect", () => connectCallback && connectCallback());
    this.socket.on("disconnect", (reason) => {
      console.log("disconnected:", reason);
      disconnectCallback && disconnectCallback();
    });
  }

  startStream({ targetLanguage, sampleRate }) {
    this.socket.emit("start_stream", { targetLanguage, sampleRate });
  }

  sendChunk(audioBuffer) {
    this.socket.emit("audio_chunk", audioBuffer);
  }

  stopStream() {
    this.socket.emit("stop_stream");
  }
}

// ------------------------------------------------------------------ //
//  Demo: read a WAV file, stream it in 1-second chunks
// ------------------------------------------------------------------ //

function main() {
  const fileBuffer = fs.readFileSync(file);
  const audioData = decoder.decode.sync(fileBuffer);
  const { sampleRate, channelData } = audioData;
  const samples = channelData[0];

  console.log(
    `Sample rate: ${sampleRate}, Samples: ${samples.length}, ` +
      `Duration: ${(samples.length / sampleRate).toFixed(1)}s`
  );

  const chunkSize = Math.floor((sampleRate * CHUNK_DURATION_MS) / 1000);
  const receivedSpeech = [];

  process.on("SIGINT", () => {
    console.log(`\nSIGINT received, writing output to ${output}...`);
    writeSpeech(receivedSpeech).finally(() => process.exit(0));    
  });

  const client = new StreamingSpeechTranslationClient({
    speechCallback: (data, meta) => {
      console.log(`received translated audio (seq=${meta.state})`);
      receivedSpeech.push(data);
    },    
    textCallback: (data) => console.log("text:", JSON.stringify(data)),
    errorCallback: (msg) => console.error("error:", msg),
    connectCallback: () => {
      console.log("connected to /streaming namespace");
      client.startStream({ targetLanguage, sampleRate });

      let offset = 0;
      const interval = setInterval(() => {
        if (offset >= samples.length) {
          clearInterval(interval);
          console.log("all chunks sent, stopping stream");
          client.stopStream();
          return;
        }

        const end = Math.min(offset + chunkSize, samples.length);
        const chunk = samples.slice(offset, end);
        client.sendChunk(
          Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        );
        offset = end;
        console.log(`sent chunk: ${offset}/${samples.length} samples`);
      }, CHUNK_DURATION_MS);
    },
    disconnectCallback: () => {
      writeSpeech(receivedSpeech).finally(() => process.exit(0));
    },
  });
}

async function writeSpeech(receivedSpeech) {
  if (receivedSpeech.length === 0) {
    console.log("no audio received, nothing to write");
    return;
  }
  const totalLength = receivedSpeech.reduce((sum, a) => sum + a.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of receivedSpeech) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const audioData = { sampleRate: 16000, channelData: [merged] };
  const buffer = await encoder.encode(audioData)
  fs.writeFileSync(output, Buffer.from(buffer));
  console.log(`wrote ${output}`);  
}

main();