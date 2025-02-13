import whisper
import pyaudio
import wave
import numpy as np
import ollama
import tempfile
import os
import time
from gtts import gTTS
from pydub import AudioSegment
from pydub.playback import play
from langdetect import detect
from scipy.signal import butter, lfilter
import warnings

warnings.filterwarnings("ignore")

# 🔹 Speech-to-Text (Using Whisper)
class SpeechToText:
    def __init__(self, model_size="small"):
        self.model = whisper.load_model(model_size)
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = 16000
        self.silence_threshold = 500
        self.silence_duration = 1.5
        self.min_record_time = 2

    def band_pass_filter(self, data, lowcut=300, highcut=3400, fs=16000, order=5):
        """Apply a band-pass filter to capture only human speech frequencies."""
        nyquist = 0.5 * fs
        low = lowcut / nyquist
        high = highcut / nyquist
        b, a = butter(order, [low, high], btype='band')
        return lfilter(b, a, data)

    def record_audio(self, filename="input.wav", silence_threshold=700, silence_duration=1.5):
        """Records audio until silence is detected for a given duration."""
        p = pyaudio.PyAudio()
        stream = p.open(format=self.format, channels=self.channels, rate=self.rate, 
                        input=True, frames_per_buffer=self.chunk)

        frames = []
        silence_counter = 0
        silence_limit = int((self.rate / self.chunk) * silence_duration)
        recording_time = 0

        print("🎙️ Recording... Speak now.")

        while True:
            data = stream.read(self.chunk, exception_on_overflow=False)
            audio_data = np.frombuffer(data, dtype=np.int16)

            # Apply band-pass filter
            filtered_audio = self.band_pass_filter(audio_data)

            volume = np.abs(filtered_audio).mean()
            if volume < silence_threshold:
                silence_counter += 1
            else:
                silence_counter = 0  

            frames.append(filtered_audio.tobytes())

            recording_time += self.chunk / self.rate
            if silence_counter > silence_limit and recording_time > self.min_record_time:
                print("🛑 Silence detected. Stopping recording...")
                break

        stream.stop_stream()
        stream.close()
        p.terminate()

        # Save the recorded audio
        with wave.open(filename, "wb") as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(p.get_sample_size(self.format))
            wf.setframerate(self.rate)
            wf.writeframes(b''.join(frames))

        return filename  # Ensure filename is returned

    def transcribe_audio(self, filename="input.wav"):
        """Transcribes the recorded audio using Whisper and ensures only English is processed."""
        try:
            result = self.model.transcribe(filename, language="en", task="transcribe")  # Force English
            text = result["text"]

            # Detect language
            detected_lang = detect(text)
            if detected_lang != "en":
                print(f"⚠️ Non-English detected ({detected_lang}). Please speak in English.")
                return ""

            return text
        except Exception as e:
            print(f"⚠️ Speech-to-text failed: {e}")
            return ""


# 🔹 AI Job Assistant using Ollama
class JobAssistant:
    def __init__(self, model="gemma:2b"):
        self.model = model
        self.system_prompt = (
    "You are a specialized AI assistant that provides expert guidance only on job-related topics. "
    "Your role is to assist users with careers, job searching, resume building, interview preparation, "
    "salary negotiation, professional skills development, and workplace success. "
    "Do not answer any questions unrelated to jobs. If a user asks about politics, entertainment, personal life, or any other question that is not related to job/internship."
    "Boost their moral and give them good advice."
    "Always greet them. Before and after exiting."
    "or general trivia, politely inform them that you only provide career-related guidance. "
    "Keep responses concise, professional, and easy to understand, and provide step-by-step instructions where applicable."
    "You are a specialized AI assistant that provides concise job-related advice. "
    "Keep responses short (under 2-3 sentences) unless the user asks for details."
    "If you do not understand the question, ask user again."
)

    def chat(self, user_input):
        """Interacts with the AI model to generate responses."""
        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "system", "content": self.system_prompt}, {"role": "user", "content": user_input}]
            )
            return response['message']['content']
        except Exception as e:
            print(f"⚠️ AI response failed: {e}")
            return "I'm sorry, but I couldn't process that request."


# 🔹 Text-to-Speech (Using pydub for direct playback)
def speak(text, speed=1.5):
    """Generate and play speech using Google TTS."""
    try:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3").name
        gTTS(text=text, lang="en").save(temp_file)
        audio = AudioSegment.from_file(temp_file, format="mp3").speedup(playback_speed=speed)
        play(audio)
        os.remove(temp_file)
    except Exception as e:
        print(f"⚠️ Text-to-Speech failed: {e}")


# 🔹 Job Tracker (Main Voice Assistant)
class JobTracker:
    def __init__(self):
        self.assistant = JobAssistant()
        self.speech_to_text = SpeechToText()

    def start(self):
        """Runs the assistant in a loop, listening for user input and responding."""
        print("🎙️ Speak to the assistant (say 'exit' to quit)...")
        while True:
            try:
                print("\nListening... (Say 'exit' to stop)")
                filename = self.speech_to_text.record_audio()
                user_input = self.speech_to_text.transcribe_audio(filename).lower()

                if not user_input:
                    continue  # Skip empty responses

                print("You:", user_input)
                if user_input in ["exit", "quit", "stop", "bye"]:
                    print("👋 Exiting assistant.")
                    break

                response = self.assistant.chat(user_input)
                print("Assistant:", response)
                speak(response)
                time.sleep(0.5)
            except KeyboardInterrupt:
                print("\n👋 Exiting assistant.")
                break


# 🔹 Run Job Assistant
if __name__ == "__main__":
    JobTracker().start()
