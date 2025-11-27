const BASE_URL = "http://api.nuvoice.ai:8000";
const { io } = require("socket.io-client");
const fs = require("fs");
const decoder = require("wav-decoder");
const encoder = require('wav-encoder');
// copy the wav file to this folder before running the sample
const file = "LJ_eng.wav";
const output = "test.wav";
let client;
let channelData;
let sampleRate;
let targetLanguage = "hin";

class SpeechTranslationClient {

  constructor({ speechCallback, textCallback, initCallback }) {
    this.socket = io(BASE_URL)
    let socket = this.socket
    // this is a callback that receives the result of a translation request from the server
    socket.on("speech", (speechSamples, args) => speechCallback && speechCallback(this.adapter(speechSamples), args))
    // this callback receives the text in the target language
    socket.on("text", arg => textCallback && textCallback(arg))
    socket.on("connect", () => {
      initCallback && initCallback()
    });
    socket.on("connect_error", (error) => {
      if (socket.active) {
        // temporary failure, the socket will automatically try to reconnect
      } else {
        // the connection was denied by the server
        // in that case, `socket.connect()` must be manually called in order to reconnect            
      }
    });
    socket.on("disconnect", (reason, details) => {
      console.log(`disconnected ${reason} ${details}`)
    });
    socket.on("runtime_error", console.error);
  }

  sendRequest({ audioData, targetLanguage, sampleRate, state }) {
    // here we are sending a translation request to the server
    this.socket.emit("translate", { audioData, targetLanguage, sampleRate, state })
  }

  shutdown() {
    this.socket.disconnect()
  }

  adapter(speechSamples) {
    let float32;

    if (Buffer.isBuffer(speechSamples)) {
      // Interpret the Buffer's bytes as float32 samples
      float32 = new Float32Array(
        speechSamples.buffer,
        speechSamples.byteOffset,
        speechSamples.byteLength / 4
      );
    } else if (speechSamples instanceof ArrayBuffer) {
      // In case socket.io gives you an ArrayBuffer
      float32 = new Float32Array(speechSamples);
    } else if (Array.isArray(speechSamples)) {
      // Fallback if it somehow became a plain JS array
      float32 = Float32Array.from(speechSamples);
    } else {
      throw new Error(`Unexpected speechSamples type: ${typeof speechSamples}`);
    }

    return float32;
  }
}

function speechCallback(data, args) {
  const audioData = {
    sampleRate: 16000,
    channelData: [data]
  };
  console.log("received translated audio");
  encoder.encode(audioData).then(buffer => fs.writeFileSync(output, new Buffer(buffer))).catch(console.error);
}

function textCallback(text) {
  console.log(text);
}

function initCallback() {
  console.log("connected");
  console.log("sending ", channelData[0].length, " samples to the API");
  client.sendRequest({ audioData: channelData[0], targetLanguage, sampleRate, state: "some state" });
}

function main() {
  // Read file into a Node.js Buffer
  const fileBuffer = fs.readFileSync(file);
  console.log("start offset = ", fileBuffer.byteOffset);
  console.log("length = ", fileBuffer.byteLength);

  // Decode WAV
  const audioData = decoder.decode.sync(fileBuffer);
  ({ sampleRate, channelData } = audioData);

  // channelData is an array of Float32Array, one per channel
  // e.g. mono: [ Float32Array ], stereo: [ Float32Array (L), Float32Array (R) ]

  console.log('Sample rate:', sampleRate);
  console.log('Number of channels:', channelData.length);
  console.log('Samples in first channel:', channelData[0].length);

  client = new SpeechTranslationClient({ speechCallback, textCallback, initCallback });
}

main();
