# Streaming API

Below is minimal code example illustrating the streaming API. The streaming API is hosted under `/streaming` namespace:

```javascript
import { io } from "socket.io-client";
const socket = io(BASE_URL + "/streaming")
socket.on("speech", (speechSamples, args) => /* do something with the audio e.g., playing it back */)
socket.on("text", arg => /* do something with the text e.g., displaying it to the user */)
socket.on("connect", () => {
    // ...
    console.log('connected')
    // start the stream
    socket.emit("start_stream", { targetLanguage, sampleRate });
});
socket.on("connect_error", (error) => {
    if (socket.active) {
        // temporary failure, the socket will automatically try to reconnect
    } else {
        // the connection was denied by the server
        // in that case, `socket.connect()` must be manually called in order to reconnect
        console.error(error.message);
    }
});
socket.on("disconnect", (reason, details) => {
    // ...
    console.log(`disconnected ${reason} ${details}`)
});
socket.on("stream_started", () => console.log("stream started"));
socket.on("stream_stopped", () => {
    console.log("stream stopped");
    socket.disconnect();
});

while (audioStream.hasNext()) {
    const audio = await audioStream.next();
	socket.emit("audio_chunk", audio);
};

socket.emit("stop_stream");
```

Here are the differences between this code and the code for the non-streaming API:

- **no `translate` event**: Streaming API has no `translate` event.
- `audio_chunk` event is used to send short audio clips `~1s` to the server _continuously_. Please use a sampling rate of **16 kHz** to avoid any surprises.
- Before calling `audio_chunk` you must start the stream by sending `start_stream` event. The server will respond by sending a `stream_started` event.
- When the call is terminated (user hangs up) call `stop_stream` to end the session on the server. The server will respond by sending a `stream_stopped` event.

`audioStream` is an object exposing a Java style iterator interface that provides two methods:

- `hasNext`: tells whether we have reached the end of the stream
- `next`: gives us the next element (audio clip) in the stream

The `speech` and `text` events have the same shape as the non-streaming API except for the `state` parameter which is not present in the streaming API.

On the browser you can use below code to capture the audio from the computer's microphone:

```javascript
audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
});

audioContext = new AudioContext({ sampleRate: 16000 });
sourceNode = audioContext.createMediaStreamSource(audioStream);

if (audioContext.createScriptProcessor) {
    processor = audioContext.createScriptProcessor(16384, 1, 1); // ~1s chunk
    processor.onaudioprocess = (e) => {        
        const data = e.inputBuffer.getChannelData(0); // Float32Array
        audioCaptureCallback(data);
    };
    sourceNode.connect(processor);
    processor.connect(audioContext.destination);
}
```

Wrapping this into a Java style iterator is left as an exercise for the reader or you could just replace:

```javascript
audioCaptureCallback(data);
```

in above with:

```javascript
socket.emit("audio_chunk", data);
```

for same result. See [streaming.js](javascript/streaming.js) for a complete example.