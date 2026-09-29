#!/bin/sh
# every photo spot at every clock time, as six 4096 faces (about 20 min a set on an RTX 4080). Run from tools/blender: sh run_cubes.sh
B="${BLENDER:-/c/Program Files/Blender Foundation/Blender 5.2/blender.exe}"
for spot in ${SPOTS:-living-a kitchen-a}; do for t in ${TIMES:-690 1065 1140}; do
  "$B" -b --factory-startup -P render.py -- --spot $spot --time $t --cube work/cubes/$spot/t$t --face ${FACE:-4096} --samples ${SAMPLES:-256} 2>&1 | grep -E "SETUP|RENDER|DONE|rror|Traceback"
done; done
echo ALL DONE
