#!/usr/bin/env python3
"""
avatarGenerator.py

Create a talking avatar video by synchronising lip movements of a static
character image to a provided audio track.
"""

import argparse
import os
import sys
import subprocess

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate a talking avatar video')
    parser.add_argument('--image', required=True, help='Path to the source character image')
    parser.add_argument('--audio', required=True, help='Path to the voice audio file')
    parser.add_argument('--output', required=True, help='Path to save the generated video (MP4)')
    parser.add_argument('--checkpoint', default=None, help='Optional path to the Wav2Lip checkpoint')
    parser.add_argument('--method', default='wav2lip', choices=['wav2lip'], help='Lip sync method to use')
    return parser.parse_args()

def run_wav2lip(image: str, audio: str, output: str, checkpoint: str = None) -> None:
    repo_path = os.environ.get('WAV2LIP_PATH') or os.path.join(os.path.dirname(__file__), 'Wav2Lip')
    script_path = os.path.join(repo_path, 'inference.py')
    if not os.path.isfile(script_path):
        raise RuntimeError(f'Wav2Lip inference script not found at {script_path}')
    ckpt = checkpoint or os.environ.get('WAV2LIP_CHECKPOINT') or os.path.join(repo_path, 'checkpoints', 'wav2lip_gan.pth')
    if not os.path.isfile(ckpt):
        raise RuntimeError(f'Wav2Lip checkpoint not found at {ckpt}')
    cmd = [
        sys.executable,
        script_path,
        '--checkpoint_path', ckpt,
        '--face', image,
        '--audio', audio,
        '--outfile', output,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f'Wav2Lip failed: {proc.stderr.strip()}')

def main() -> None:
    args = parse_args()
    try:
        if args.method == 'wav2lip':
            run_wav2lip(args.image, args.audio, args.output, args.checkpoint)
        else:
            raise RuntimeError(f'Unsupported method: {args.method}')
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
