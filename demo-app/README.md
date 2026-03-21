# README

[Demo](https://www.youtube.com/watch?v=PUtKjp2NtR4)

This folder contains an application that can be used to test the Real-time Speech Translation API interactively from a web browser. Please follow the steps below to install and run the application.

## Pre-requisites

- **Node.js**

## Steps

1. Unzip [`speech-translation-demo-app.zip`](speech-translation-demo-app.zip):

```
unzip speech-translation-demo-app.zip
```

`cd` to the `build` subdirectory. You should see following directory structure:

```
build
├── client
├── env.js
├── handler.js
├── index.js
├── node_modules
├── package-lock.json
├── package.json
├── server
└── shims.js
```

2. Create a `.env` file inside the `build` directory and set the URL where the translation API is running. E.g.,:

```
echo "SPEECH_TRANSLATION_API_URL=http://translation-api.nuvoice.ai:8000" > .env
```

3. Install runtime dependencies (from `build` directory):

```
npm i
```

4. Run (from `build` directory):

```
node index.js
```

5. Open browser and goto `http://localhost:3000` to access the application.

You should see a UI similar to [this](https://www.youtube.com/watch?v=PUtKjp2NtR4). Follow the instructions to speak something and see it translated into another language in real-time.

## Comparing client to server-side VAD (Non-streaming vs. streaming API)

You can also use the application to compare client vs. server-side VAD.

- Client-side VAD (non-streaming API): `http://localhost:3000`
- Server-side VAD (streaming API): `http://localhost:3000/streaming`

## [License and Disclaimer](../LICENSE)
