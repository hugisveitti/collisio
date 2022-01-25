import os 
import string
import random
import json

models_path = "../../dist/models"

files = os.listdir(models_path)
print("files", files)

letters = string.ascii_lowercase+("".join([str(x) for x in range(0,9)]))

def create_encryption(n):
    return "".join((random.choice(letters)) for x in range(n))


d = {}
for file in files:
    if ".glb" in file or ".gltf" in file:
        r = create_encryption(random.randint(8,16))
        d[r] = file 

encrytion_file = "encryption.json"


with open(encrytion_file, "w") as f:
    json.dump(d, f)