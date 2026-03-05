# API Overview

## Introduction

The Speech Translation API can be used to translate audio/speech/voice from one language to another in real-time.
It is a real-time speech-to-speech translation service.

Requirements:

- [Socket.IO](https://socket.io/)

## Streaming vs. Non-streaming

The API supports two modes:

- [**Streaming:**](streaming.md) You pass in audio chunks of `~1s` duration continuously by capturing the microphone on the user's device and the API
calls you back periodically with results.
- [**Non-streaming:**](non_streaming.md) You segment (break) the audio stream on the client into clips covering utterances of sentences that you would like to be translated
and call the API giving it complete segments that might be few seconds long. E.g., a segment might cover a sentence like "My name is Sarah" that you want to be translated.

Technically, _the only difference between the two modes is whether VAD (Voice Activity Detection - the process that segments the audio stream) is performed client-side or server-side_. **Client-side VAD = Non-streaming mode. Server-side VAD = streaming mode.**

**Which one should you pick?** There is not a clear answer to this. Both are good and you can't go wrong with either.
Below are Pros and Cons of the two approaches:

| Streaming | Non-streaming |
| --- | --- |
| VAD processing happens on the server | VAD processing happens on the client |
| No client-side VAD dependency | Requires using a library to perform VAD on the client |
| VAD processing introduces some overhead (minimal) on the server | VAD processing introduces some overhead (minimal) on the client |
| You do not get to customize the VAD algorithm we use on the server | Advanced users can fine-tune the VAD algorithm if the library supports that |
| Good when preserving battery is important | Client-side VAD means increased battery consumption on mobile-devices |
| Continuous audio transmission (even silence blocks) | Only transmit segments containing speech |
| | You can correlate input -> output. Think of the API as applying a function to a finite (bounded) input. |

If you are unsure which one to use, we recommend you use client-side VAD a.k.a. non-streaming mode and switch to streaming mode if you are facing
difficulty integrating with a VAD library on the client or are running on very low energy device.

The API for the two-modes is different and thus described in separate docs.

## Get `socket.io`

In either case, the only dependency you need is [Socket.IO](https://socket.io/) client library (you do not need the server).
Install the `socket.io-client` package in your favorite programming language.
If using JavaScript (whether on browser or NodeJS) this means run [[1](https://www.npmjs.com/package/socket.io-client)]:

```
npm i socket.io-client
```

If using Python run [[2](https://pypi.org/project/python-socketio/)]:

```
pip install python-socketio
```

Tips:

- In case of JavaScript you would install version `4.x` of the package (`4.8.1` as of this writing) and in case of Python you would install version `5.x` of the package (`5.12.1` as of this writing). Although they have different version numbers both clients (JS and Python) are using same version of Socket.IO and Engine.IO protocols. If you are unfamiliar with Socket.IO, it wouldn't hurt to spend 15 to 30 minutes getting basic familiarity with it.
- Do not try to make a direct websocket connection to the API. It will not work. You need `socket.io` (client).

If you are using another programming language download the client by following the instructions given at [this](https://socket.io/docs/v4/) page.

## REST API

In both cases (streaming vs. non-streaming) there is also a REST API with some endpoints that you can call to get list of supported languages as example.
See [reference.md](reference.md) on details of the REST API. The main endpoint you would be using is `GET /languages` to retrieve the list of supported
target languages for translation.