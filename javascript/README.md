# README

The sample in this folder illustrates how to access the Speech Translation API using JavaScript.

Provision an EC2 Instance in the **same** VPC and subnet that you used in the Setup and use the **same** SG.

Then copy over the code in this folder together with the sample `LJ_eng.wav` file to the EC2 Instance.

Install latest Node.js using [nvm](https://github.com/nvm-sh/nvm).

Install all the dependencies:

```
npm i
```

and edit `index.js` replacing the `BASE_URL` as appropriate:

```
const BASE_URL = "http://api.nuvoice.ai:8000";
```

You can find the domain part of the URL from `VPC -> Endpoints` in AWS dashboard. Select the endpoint you created in the Setup section.

Also change the `targetLanguage` to whatever you like:

```
let targetLanguage = "hin";
```

You can get list of supported languages by running:

```
curl http://api.nuvoice.ai:8000/languages
```

from the command line.

Running the sample should translate the given audio clip in English to the `targetLanguage` and save it as `test.wav`.

Below is sample output from a test run:

```
$ node index.js
start offset =  0
length =  485430
Sample rate: 16000
Number of channels: 1
Samples in first channel: 121343
connected
sending  121343  samples to the API
{
  text: 'विशेषज्ञों की जांच और गवाही ने आयोग को यह निष्कर्ष निकालने में सक्षम बनाया कि पांच गोलीबारी की गई हो सकती है।',
  target_language: 'hin',
  state: 'some state'
}
received translated audio
```

Stay tuned for more updates and samples.