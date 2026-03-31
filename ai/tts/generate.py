#!/usr/bin/env python3
import argparse
import os
import sys
import soundfile as sf
try:
    from TTS.api import TTS
except ImportError:
    TTS = None

def parse_args():
    parser = argparse.ArgumentParser(description='Generate speech audio using Coqui TTS')
    parser.add_argument('--text', required=True, help='Input text')
    parser.add_argument('--voice', default='en', help='Voice model')
    parser.add_argument('--output', required=True, help='Output path for WAV file')
    return parser.parse_args()

def main():
    args = parse_args()
    if TTS is None:
        print('Error: Coqui TTS is not installed', file=sys.stderr)
        sys.exit(1)
    try:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        tts = TTS(args.voice)
        audio = tts.tts(args.text)
        sf.write(args.output, audio, tts.sampling_rate)
        print(args.output)
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
