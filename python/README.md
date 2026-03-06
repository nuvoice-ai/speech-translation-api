# README

setup and install dependencies:

```
$ python3 -m venv .env
$ source .env/bin/activate
$ pip install -r requirements.txt
```

Download test file:

```
wget https://nuvoice-public.s3.us-west-2.amazonaws.com/LJ_eng.wav
```

copy the `LJ_eng.wav` file to the directory.

edit `main.py` replacing the `BASE_URL` as appropriate:

```
BASE_URL = "http://translation-api.nuvoice.ai:8000"
```

You can find the domain part of the URL from `VPC -> Endpoints` in AWS dashboard. Select the endpoint you created in the Setup section.

Also change the `targetLanguage` to whatever you like:

```
target_language = "hin"
```

This is the language to which you want to translate.

You can get list of supported languages by running:

```
curl http://api.nuvoice.ai:8000/languages
```

from the command line.

run:

```
$ python main.py
```

This should translate the given audio clip in English to the `targetLanguage` and save it as `test.wav`.

sample output:

```
Sample rate: 16000
Number of channels: 1
Samples in first channel: 121343
connected
sending 121343 samples to the API
{'text': 'विशेषज्ञों की जांच और गवाही ने आयोग को यह निष्कर्ष निकालने में सक्षम बनाया कि पांच गोलीबारी की गई हो सकती है।', 'target_language': 'hin', 'state': 'some state'}
received translated audio
wrote test.wav
```