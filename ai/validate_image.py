from PIL import Image
import sys
import numpy as np

path = sys.argv[1]

try:
    img = Image.open(path)
    arr = np.array(img)

    if arr.size == 0:
        print("BAD")
        exit()

    brightness = arr.mean()

    if brightness < 10:
        print("BAD")
        exit()

    print("OK")

except Exception:
    print("BAD")
