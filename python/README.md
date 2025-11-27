# README

setup and install dependencies:

```
$ python3 -m venv .env
$ source .env/bin/activate
$ pip install -r requirements.txt
```

copy the `LJ_eng.wav` file to the directory.

run:

```
$ python main.py
```

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