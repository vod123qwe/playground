#!/usr/bin/env bash
# 🔊 English Coach — lektor (natywny głos systemu).
# Czyta podany tekst przez wbudowany TTS OS-a. Działa LOKALNIE (na Twoim desktopie);
# w chmurze dźwięk zagra na serwerze, więc go nie usłyszysz.
#
# Użycie:  ./speak.sh "text to read aloud"
# Opcje:   VOICE=Samantha ./speak.sh "..."   (wybór głosu, np. na macOS)
#          RATE=170       ./speak.sh "..."   (tempo słów/min, tam gdzie wspierane)

set -euo pipefail
text="${*:-}"
if [ -z "$text" ]; then
  echo "usage: ./speak.sh \"text to read aloud\"" >&2
  exit 1
fi

if command -v say >/dev/null 2>&1; then                         # macOS
  say ${VOICE:+-v "$VOICE"} ${RATE:+-r "$RATE"} "$text"
elif command -v spd-say >/dev/null 2>&1; then                   # Linux (speech-dispatcher)
  spd-say ${RATE:+-r "$RATE"} -w "$text"
elif command -v espeak-ng >/dev/null 2>&1; then                 # Linux fallback
  espeak-ng ${RATE:+-s "$RATE"} "$text"
elif command -v espeak >/dev/null 2>&1; then
  espeak ${RATE:+-s "$RATE"} "$text"
elif command -v powershell.exe >/dev/null 2>&1; then            # Windows / WSL
  powershell.exe -NoProfile -Command \
    "Add-Type -AssemblyName System.Speech; \$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; \$s.Speak([Console]::In.ReadToEnd())" <<< "$text"
else
  echo "⚠️  Brak silnika TTS. Zainstaluj jeden:" >&2
  echo "   macOS  : 'say' jest wbudowane (powinno działać od ręki)" >&2
  echo "   Linux  : sudo apt install speech-dispatcher   # daje spd-say" >&2
  echo "            albo: sudo apt install espeak-ng" >&2
  echo "   Windows: PowerShell ma wbudowany System.Speech" >&2
  exit 2
fi
