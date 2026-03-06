# API Reference

This document provides comprehensive API reference documentation for the Speech Translation API service.

## Table of Contents

- [Overview](#overview)
- [HTTP REST Endpoints](#http-rest-endpoints)
- [WebSocket/Socket.IO Events (non-streaming API)](#websocketsocketio-events-non-streaming-api)
- [WebSocket/Socket.IO Events (streaming API)](#websocketsocketio-events-streaming-api)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Configuration](#configuration)

## Overview

The Speech Translation API is a real-time speech-to-speech translation service.

The API supports both HTTP REST endpoints for configuration and health checks, and WebSocket connections for real-time audio streaming and translation.

### Base URL

- HTTP: `http://translation-api.nuvoice.ai:8000` (replace with your PrivateLink VPC Endpoint DNS name)
- WebSocket: `ws://translation-api.nuvoice.ai:8000` (replace with your PrivateLink VPC Endpoint DNS name)

> **Note on security:** No API keys or authentication tokens are required. Access is controlled entirely at the network level by AWS PrivateLink. Only clients inside the authorized VPC can reach the endpoint.

---

## HTTP REST Endpoints

### Health Check

#### `GET /healthz`

Check if the server is running and healthy.

**Response:**
- **Status Code**: `204 No Content`
- **Body**: None

**Example:**
```bash
curl http://translation-api.nuvoice.ai:8000/healthz
```

---

### Get Supported Languages

#### `GET /languages`

Retrieve the list of supported target languages for translation.

**Response:**
- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

**Response Body:**
```json
{
  "languages": [
    "eng", "arb", "ben", "cat", "ces", "cmn", "cym", "dan",
    "deu", "est", "fin", "fra", "hin", "ind", "ita",
    "jpn", "kor", "mlt", "nld", "pes", "pol", "por",
    "ron", "rus", "slk", "spa", "swe", "swh", "tel",
    "tgl", "tha", "tur", "ukr", "urd", "uzn", "vie"
  ]
}
```

**Example:**
```bash
curl http://translation-api.nuvoice.ai:8000/languages
```

**Language Code Reference:**

| Code | Language | Code | Language |
|------|----------|------|----------|
| `arb` | Arabic (Modern Standard) | `jpn` | Japanese |
| `ben` | Bengali | `kor` | Korean |
| `cat` | Catalan | `mlt` | Maltese |
| `ces` | Czech | `nld` | Dutch |
| `cmn` | Mandarin Chinese | `pes` | Persian |
| `cym` | Welsh | `pol` | Polish |
| `dan` | Danish | `por` | Portuguese |
| `deu` | German | `ron` | Romanian |
| `eng` | English | `rus` | Russian |
| `est` | Estonian | `slk` | Slovak |
| `fin` | Finnish | `spa` | Spanish |
| `fra` | French | `swe` | Swedish |
| `hin` | Hindi | `swh` | Swahili |
| `ind` | Indonesian | `tel` | Telugu |
| `ita` | Italian | `tgl` | Tagalog |
| | | `tha` | Thai |
| | | `tur` | Turkish |
| | | `ukr` | Ukrainian |
| | | `urd` | Urdu |
| | | `uzn` | Uzbek (Northern) |
| | | `vie` | Vietnamese |

---

### Get Version

#### `GET /version`

Retrieve the build version and branch information.

**Response:**
- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

**Response Body:**
```json
{
  "version": "<git_sha>",
  "branch": "<git_branch>"
}
```

**Example:**
```bash
curl http://translation-api.nuvoice.ai:8000/version
```

**Example Response:**
```json
{
  "version": "90e2b57ac4d82fa2bfaa25caeffe39ceb8b2ebec",
  "branch": "main"
}
```

---

## WebSocket/Socket.IO Events (non-streaming API)

The API uses Socket.IO for real-time bidirectional communication. Clients connect via WebSocket and can send/receive events.

### Connection

#### Client → Server: `connect`

Automatically emitted when a client connects to the server.

**Server Response:**
- Logs connection with session ID (`sid`)
- No explicit response event

#### Server → Client: `disconnect`

Emitted when a client disconnects.

**Event Data:**
- `reason`: Disconnection reason string

---

### Translation

#### Client → Server: `translate`

Send audio data for translation. The server processes the audio and returns both text and speech outputs.

**Event Name**: `translate`

**Event Data:**
```typescript
{
  audioData: Float32Array | bytes,  // See description below
  targetLanguage: string,           // Target language code (e.g., "eng", "fra")
  sampleRate: number,               // Audio sample rate in Hz (e.g., 16000)
  state?: any                       // Optional state for request correlation
}
```

**Parameters:**
- `audioData` (required): Float32 audio samples with values in the range **[-1, +1]**, sent as binary. The exact type depends on the language:
  - **JavaScript**: pass a `Float32Array` directly. Socket.IO serializes it as binary automatically.
  - **Python**: call `.tobytes()` on a `numpy` float32 array and pass the resulting `bytes`. `python-socketio` requires `bytes` for binary payloads.
  - In both cases the wire format is identical: 32-bit IEEE 754 little-endian floats.
- `targetLanguage` (required): ISO 639-3 language code for the target language. Must be one of the supported languages from the `/languages` endpoint.
- `sampleRate` (required): Sample rate of the input audio in Hz (16000 recommended).
- `state` (optional): Any JSON-serializable data to correlate requests with responses (e.g., a request ID).

**Server Responses:**

The server emits two separate events in response:

1. **`text` event** - Contains the translated text
2. **`speech` event** - Contains the translated speech audio

#### Server → Client: `text`

Emitted with the translated text output.

**Event Data:**
```json
{
  "text": "Translated text here",
  "targetLanguage": "fra",
  "state": <original_state_value>
}
```

#### Server → Client: `speech`

Emitted with the translated speech audio and metadata.

**Event Data:**
- **Binary**: Audio data as bytes (first argument)
- **JSON**: Metadata object (second argument)
  ```json
  {
    "targetLanguage": "fra",
    "speechSampleRate": 16000,
    "state": <original_state_value>
  }
  ```

**Error Handling:**

If an error occurs during translation, the server emits:

#### Server → Client: `runtime_error`

Emitted when a runtime error occurs during translation.

**Event Data:**
- String containing the error message

---

### Session Management

#### Client → Server: `set_name`

Set a name for the current session (stored in session data).

**Event Name**: `set_name`

**Event Data:**
- `name` (string): Name to associate with the session

**Server Behavior:**
- Stores the name in the session data
- No explicit response event

**Example:**
```javascript
socket.emit('set_name', 'my-client-name');
```

---

### Error Events

#### Server → Client: `server_exception`

Emitted when an unhandled exception occurs in any Socket.IO event handler.

**Event Data:**
```json
{
  "message": "Exception message and details",
  "timeEpochMs": 1234567890123,
  "clientID": "<optional_client_id>"
}
```

---

---

## WebSocket/Socket.IO Events (streaming API)

The streaming API is hosted under the `/streaming` namespace. Connect with:

```javascript
const socket = io(BASE_URL + "/streaming");
```

### Session Lifecycle

#### Client → Server: `start_stream`

Start a translation session. Must be sent before any `audio_chunk` events.

**Event Data:**
```typescript
{
  targetLanguage: string,  // ISO 639-3 language code (e.g., "fra")
  sampleRate: number       // Audio sample rate in Hz (e.g., 16000)
}
```

**Server Response:** `stream_started`

---

#### Server → Client: `stream_started`

Emitted by the server after a successful `start_stream`. Begin sending `audio_chunk` events after receiving this.

---

#### Client → Server: `stop_stream`

End the translation session (e.g., when the user hangs up). No event data.

**Server Response:** `stream_stopped`

---

#### Server → Client: `stream_stopped`

Emitted by the server after the session is cleanly stopped. You may disconnect the socket after receiving this.

---

### Audio

#### Client → Server: `audio_chunk`

Send a chunk of audio (~1 second) to the server. Must be called after `stream_started` is received.

**Event Data:**
- `Float32Array` — audio samples in the range **[-1, +1]**, captured at `sampleRate` Hz.

**Server Response:** `speech` and/or `text` events (same shape as non-streaming API, but without the `state` field).

---

## Data Models

### TextOutput

Represents translated text output.

**Properties:**
- `text` (string): The translated text
- `targetLanguage` (string): ISO 639-3 language code of the target language
- `state` (any): Optional state data passed from the request

**JSON Format:**
```json
{
  "text": "Hello, world",
  "targetLanguage": "fra",
  "state": null
}
```

### SpeechOutput

Represents translated speech output metadata.

**Properties:**
- `targetLanguage` (string): ISO 639-3 language code of the target language
- `speechSampleRate` (number): Sample rate of the output audio (typically 16000 Hz)
- `state` (any): Optional state data passed from the request

**JSON Format:**
```json
{
  "targetLanguage": "fra",
  "speechSampleRate": 16000,
  "state": null
}
```

**Note:** The actual audio data is sent as binary (bytes) separately from this metadata.

---

## Error Handling

### HTTP Errors

| Status Code | Description |
|------------|-------------|
| `204` | Success (No Content) |
| `200` | Success (with JSON body) |
| `400` | Bad Request (invalid input) |
| `404` | Not Found (endpoint or IP restriction) |
| `500` | Internal Server Error |

### Socket.IO Errors

- **`runtime_error`**: Emitted when translation fails
- **`server_exception`**: Emitted when an unhandled exception occurs
- All Socket.IO event handlers are wrapped with exception logging

### Error Response Format

HTTP error responses follow this format:
```json
{
  "error": "<error_message>",
  "details": "<detailed_error_information>"
}
```

---

## Examples

### [JavaScript](javascript/index.js)

### [Python](python/main.py)

---

## Notes

- The API uses Socket.IO for real-time communication, not raw WebSockets
- Audio data must be sent as bytes (not base64 encoded)
- The model sample rate is fixed at **16000 Hz**
