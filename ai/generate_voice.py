import sys
import asyncio
import edge_tts

text = sys.argv[1]
output = sys.argv[2]

async def main():
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    await communicate.save(output)

asyncio.run(main())
