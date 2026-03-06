# Non-streaming API

Below is minimal code example illustrating the use of the non-streaming API:

```javascript
// BASE_URL is the DNS name of your PrivateLink VPC Endpoint.
// Replace this with the endpoint DNS name from your AWS setup.
const BASE_URL = "http://translation-api.nuvoice.ai:8000";
import { io } from "socket.io-client";

export class SpeechTranslationClient {

    constructor({ speechCallback, textCallback, initCallback }) {
        this.socket = io(BASE_URL)
        let socket = this.socket
        socket.on("speech", (speechSamples, args) => speechCallback && speechCallback(new Float32Array(speechSamples), args))
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
    }

    sendRequest({ audioData, targetLanguage, sampleRate, state }) {
        this.socket.emit("translate", { audioData: audioData, targetLanguage: targetLanguage, sampleRate: sampleRate, state: state })
    }

    shutdown() {
        this.socket.disconnect()
    }
}
```

**Usage example:**

```javascript
const client = new SpeechTranslationClient({
    speechCallback: (samples, args) => playAudio(samples, args.speechSampleRate),
    textCallback: (arg) => console.log(arg.text),
    initCallback: () => console.log("connected"),
});

// audioData must be a Float32Array with values in the range [-1, +1],
// captured at sampleRate Hz (16000 recommended).
client.sendRequest({ audioData, targetLanguage: "fra", sampleRate: 16000, state: "req-1" });
```

The `translate` event is used to send an audio clip to the server that needs to be translated into a target language.
`audioData` must contain `float32` samples in the range **[-1, +1]**, sent as binary. How you pass this depends on the language: in JavaScript, pass a `Float32Array` directly; in Python, call `.tobytes()` on a `numpy` float32 array and pass the resulting `bytes`. The wire format is the same in both cases (32-bit IEEE 754 little-endian floats).
Please use a sample rate of **16 kHz** to avoid any surprises.
The `sampleRate` tells the server the sampling rate at which the `audioData` has been captured.
The server replies back _asynchronously_ via the `speech` and `text` events that contain the translated speech and text respectively.
The `state` variable can be used to track which reply is associated with which request (correlation).

> **Note on security:** No API keys or authentication tokens are required. Access is controlled entirely at the network level by AWS PrivateLink — only clients inside the authorized VPC can reach the endpoint.