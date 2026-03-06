# API Overview

## Introduction

The Speech Translation API can be used to translate audio/speech/voice from one language to another in real-time.
It is a real-time speech-to-speech translation service.

Requirements:

- [Socket.IO](https://socket.io/)

Audio Data Format:

- `float32` samples between `[-1, +1]`

Sample Rate:

- 16 kHz

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
| You do not get to customize the VAD algorithm we use on the server | You can choose the VAD algorithm and even fine-tune it if you wish so |
| Good when preserving battery is important | Client-side VAD means increased battery consumption on mobile-devices |
| Continuous audio transmission (even silence blocks) | Only transmit segments containing speech |
| | You can correlate input -> output (request -> response). Think of the API as applying a function to a finite (bounded) input. |
| Easier to implement as no integration with a third-party library is required | Think of this as bring your own VAD |

If you are unsure which one to use, we recommend non-streaming mode (client-side VAD) and switching to streaming mode if you are having difficulty integrating a VAD library on your platform
or running on very low-power devices where minimizing power consumption is very important.

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

- In case of JavaScript you would install the latest `4.x` release of the package and in case of Python you would install the latest `5.x` release. Although they have different version numbers both clients (JS and Python) are using same version of Socket.IO and Engine.IO protocols. If you are unfamiliar with Socket.IO, it is worth spending 15–30 minutes getting basic familiarity with it.
- Do not try to make a direct websocket connection to the API. It will not work. You need `socket.io` (client).

If you are using another programming language download the client by following the instructions given at [this](https://socket.io/docs/v4/) page.

## REST API

In both cases (streaming vs. non-streaming) there is also a REST API with some endpoints that you can call to get list of supported languages as example.
See [reference.md](reference.md) on details of the REST API. The main endpoint you would be using is `GET /languages` to retrieve the list of supported
target languages for translation.