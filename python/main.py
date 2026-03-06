import socketio
import soundfile as sf
import numpy as np

BASE_URL = "http://translation-api.nuvoice.ai:8000"
FILE = "LJ_eng.wav"
OUTPUT = "test.wav"
target_language = "hin"

client = None
channel_data = None
sample_rate = None

class SpeechTranslationClient:
    def __init__(self, speech_callback=None, text_callback=None, init_callback=None):
        self.sio = socketio.Client()

        @self.sio.on("speech")
        def on_speech(speech_samples, args):
            if speech_callback:
                speech_callback(SpeechTranslationClient.adapter(speech_samples), args)

        @self.sio.on("text")
        def on_text(arg):
            if text_callback:
                text_callback(arg)
        
        @self.sio.on("runtime_error")
        def on_error(error):
            print(error)

        @self.sio.event
        def connect():
            if init_callback:
                init_callback(self)

        @self.sio.event
        def connect_error(error):            
            print(f"connect_error: {error}")

        @self.sio.event
        def disconnect(reason):
            # python-socketio doesn't give details separate from reason
            print(f"disconnected: {reason}")

        # Actually connect to server
        self.sio.connect(BASE_URL)

    def send_request(self, audio_data, target_language, sample_rate, state):
        """
        audio_data: 1D numpy array of float32 samples
        """
        if isinstance(audio_data, np.ndarray):
            payload_audio = audio_data.astype(np.float32).tobytes()
        else:
            payload_audio = np.asarray(audio_data, dtype=np.float32).tobytes()

        self.sio.emit(
            "translate",
            {
                "audioData": payload_audio,
                "targetLanguage": target_language,
                "sampleRate": sample_rate,
                "state": state,
            },
        )

    def shutdown(self):
        self.sio.disconnect()

    def wait(self):
        """Block forever to keep the client alive (like Node's event loop)."""
        self.sio.wait()

    @staticmethod
    def adapter(speech_samples):
        """
        Convert incoming speechSamples from socket.io into a float32 NumPy array,
        similar to the JS adapter that produces a Float32Array.
        """
        if isinstance(speech_samples, (bytes, bytearray, memoryview)):
            # Interpret raw bytes as float32 samples
            float32 = np.frombuffer(speech_samples, dtype=np.float32)
        elif isinstance(speech_samples, list):
            # Fallback if it comes as a JSON array of numbers
            float32 = np.array(speech_samples, dtype=np.float32)
        else:
            raise TypeError(f"Unexpected speechSamples type: {type(speech_samples)}")

        return float32

def speech_callback(data, args):
    # data is a 1D float32 NumPy array
    print("received translated audio")
    # Save as 32-bit float WAV, matching the JS encoder behavior
    sf.write(OUTPUT, data, 16000, subtype="FLOAT")
    print(f"wrote {OUTPUT}")


def text_callback(text):
    print(text)


def init_callback(client):
    global channel_data, sample_rate, target_language
    print("connected")
    print("sending", channel_data[0].shape[0], "samples to the API")
    client.send_request(
        audio_data=channel_data[0],
        target_language=target_language,
        sample_rate=sample_rate,
        state="some state",
    )

def main():
    global client, channel_data, sample_rate

    # Read WAV (as float32). always_2d=True -> shape (n_samples, n_channels)
    data, sr = sf.read(FILE, dtype="float32", always_2d=True)
    sample_rate = sr

    # Split into per-channel arrays, like channelData in Node
    # mono: [Float32Array], stereo: [L, R], etc.
    channel_data = [data[:, ch] for ch in range(data.shape[1])]

    print("Sample rate:", sample_rate)
    print("Number of channels:", len(channel_data))
    print("Samples in first channel:", channel_data[0].shape[0])

    client = SpeechTranslationClient(
        speech_callback=speech_callback,
        text_callback=text_callback,
        init_callback=init_callback,
    )

    # Keep the client alive and listening for events
    client.wait()

if __name__ == "__main__":
    main()
