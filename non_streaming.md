# Non-streaming API

Below is minimal code example illustrating the use of the non-streaming API:

```javascript
const BASE_URL = "http://translation-api.nuvoice.ai";
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

The `translate` event is used to send an audio clip to the server that needs to be translated into a target language.
Please use a sample rate of **16 kHz** to avoid any surprises. 
The `sampleRate` tells the server the sampling rate at which the `audioData` has been captured.
The server replies back _asynchronously_ via the `speech` and `text` events that contain the translated speech and text respectively.
The `state` variable can be used to track which reply is associated with which request (correlation).