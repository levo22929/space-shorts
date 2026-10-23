"""Kodla üretilen müzik ve efekt sesi (lisans derdi yok).
Kullanım: python3 tools/audio.py <cue.json> <çıktı.wav>
cue.json: {"duration": 14.5, "events": [{"t": 1.0, "type": "poof"}, {"t": 9.0, "type": "boom"},
           {"t": 1.5, "type": "ticks", "until": 9.0, "every": 0.5}, {"t": 12.5, "type": "rewind", "until": 14.5}]}
Müzik, döngüde dikiş olmasın diye süreye tam bölünen periyotlarla kurulur.
"""
import json, sys, wave
import numpy as np

SR = 48000


def env(n, a, r):
    e = np.ones(n)
    a, r = int(a * SR), int(r * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


def pad(dur, mood="dark"):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    # dark: Am – F; happy: C – G (döngü süresine oturan yavaş geçiş)
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63]] if mood == "dark" else [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]
    mix = 0.5 - 0.5 * np.cos(2 * np.pi * t / dur * 2)  # süre içinde 2 tam salınım
    for i, ch in enumerate(chords):
        w = mix if i else 1 - mix
        for f in ch:
            for h, a in ((1, 1.0), (2, 0.25), (3, 0.08)):
                out += w * a * np.sin(2 * np.pi * f * h * t + h) * (0.8 + 0.2 * np.sin(2 * np.pi * t / dur * 4 + f))
    out += 0.6 * np.sin(2 * np.pi * 55 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * t / dur * 8))  # bas
    return out / np.abs(out).max() * 0.25


def poof():
    n = int(0.9 * SR); t = np.arange(n) / SR
    noise = np.random.default_rng(1).standard_normal(n)
    sweep = np.sin(2 * np.pi * (900 * t - 700 * t * t))
    return (0.6 * noise * np.exp(-t * 6) + 0.5 * sweep * np.exp(-t * 4)) * env(n, 0.005, 0.2)


def tick():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return 0.35 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90)


def boom():
    n = int(2.2 * SR); t = np.arange(n) / SR
    f = 70 * np.exp(-t * 1.2) + 30
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    noise = np.random.default_rng(2).standard_normal(n) * np.exp(-t * 8) * 0.3
    return (body + noise) * env(n, 0.003, 0.4)


def rewind(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 300 + 1500 * (t / dur) ** 2
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.15
    return s * np.sin(np.pi * t / dur) ** 2


def pop():
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = 500 + 900 * np.exp(-t * 30)
    return 0.7 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)


def sparkle():
    n = int(0.6 * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k, f in enumerate((2093, 2637, 3136, 4186)):
        i = int(k * 0.06 * SR); tt = t[: n - i]
        out[i:] += 0.18 * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9)
    return out


def place(buf, x, at):
    i = int(at * SR); j = min(len(buf), i + len(x))
    buf[i:j] += x[:j - i]


def main(cue_path, out):
    cue = json.load(open(cue_path))
    dur = cue["duration"]
    music = pad(dur, cue.get("mood", "dark"))
    sfx = np.zeros_like(music)
    duck = np.ones_like(music)
    for e in cue["events"]:
        if e["type"] == "poof": place(sfx, poof(), e["t"])
        elif e["type"] == "boom":
            place(sfx, boom(), e["t"])
            i = int(e["t"] * SR); duck[i:i + int(1.5 * SR)] = np.linspace(0.3, 1, int(1.5 * SR))[:len(duck) - i]
        elif e["type"] == "ticks":
            for k in np.arange(e["t"], e["until"], e["every"]): place(sfx, tick(), k)
        elif e["type"] == "pop": place(sfx, pop(), e["t"])
        elif e["type"] == "sparkle": place(sfx, sparkle(), e["t"])
        elif e["type"] == "rewind": place(sfx, rewind(e["until"] - e["t"]), e["t"])
    mixd = music * duck + sfx
    mixd = mixd / max(1e-9, np.abs(mixd).max()) * 0.9
    st = np.stack([mixd, mixd], 1)
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print("wrote", out, f"{len(mixd) / SR:.2f}s")


if __name__ == "__main__":
    main(*sys.argv[1:])
