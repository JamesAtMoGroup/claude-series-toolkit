#!/usr/bin/env python3
"""
vtt-shift.py — 把 source-time VTT 平移到 mp4-time（鐵律 #23）

claude-series 的 VTT 從 speaker.wav (source-time) 來。
mp4 因為前面接了 T0 SceneTransition (4s)，整段時間軸往後推 +4s。
不 shift 字幕從第 0 秒就早 4s，後段累積錯位。

用法:
    vtt-shift.py <input.vtt> <output.vtt> [--shift-sec 4.0]
    vtt-shift.py <input.vtt> <output.vtt> --from-tsx <index.tsx>

--from-tsx 模式會從 TSX 找 TRANSITION_SEC 常數自動推斷 shift 量。
"""
import argparse
import re
import sys
from pathlib import Path


def parse_tsx_transition_sec(tsx_path: Path) -> float:
    """從 index.tsx 找 const TRANSITION_SEC = X；只有 T0 開場 = +TRANSITION_SEC."""
    text = tsx_path.read_text(encoding="utf-8")
    m = re.search(r"const\s+TRANSITION_SEC\s*=\s*(\d+(?:\.\d+)?)", text)
    if not m:
        raise ValueError(f"TSX 內沒找到 TRANSITION_SEC: {tsx_path}")
    return float(m.group(1))


def shift_vtt(src_vtt: Path, dst_vtt: Path, shift_sec: float) -> int:
    """整段 VTT 時間戳平移 shift_sec。回傳處理的 cue 數。"""
    text = src_vtt.read_text(encoding="utf-8")

    def to_sec(ts: str) -> float:
        # 接受 MM:SS.mmm 或 HH:MM:SS.mmm
        parts = ts.split(":")
        if len(parts) == 2:
            mm, ss = parts
            return int(mm) * 60 + float(ss)
        elif len(parts) == 3:
            hh, mm, ss = parts
            return int(hh) * 3600 + int(mm) * 60 + float(ss)
        raise ValueError(f"Bad timestamp: {ts}")

    def to_str(sec: float) -> str:
        if sec < 3600:
            mm = int(sec // 60)
            ss = sec - mm * 60
            return f"{mm:02d}:{ss:06.3f}"
        else:
            hh = int(sec // 3600)
            rem = sec - hh * 3600
            mm = int(rem // 60)
            ss = rem - mm * 60
            return f"{hh:02d}:{mm:02d}:{ss:06.3f}"

    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        a, b = m.group(1), m.group(2)
        count += 1
        return f"{to_str(to_sec(a) + shift_sec)} --> {to_str(to_sec(b) + shift_sec)}"

    # 接 MM:SS.mmm 或 HH:MM:SS.mmm
    out = re.sub(
        r"(\d+(?::\d+)+\.\d+)\s*-->\s*(\d+(?::\d+)+\.\d+)",
        repl,
        text,
    )
    dst_vtt.write_text(out, encoding="utf-8")
    return count


def main():
    ap = argparse.ArgumentParser(description="Shift VTT timestamps by N seconds.")
    ap.add_argument("input", type=Path, help="輸入 VTT 路徑")
    ap.add_argument("output", type=Path, help="輸出 VTT 路徑")
    ap.add_argument(
        "--shift-sec",
        type=float,
        default=None,
        help="手動指定 shift 秒數（預設從 --from-tsx 推）",
    )
    ap.add_argument(
        "--from-tsx",
        type=Path,
        default=None,
        help="從 TSX 抓 TRANSITION_SEC 自動推 shift",
    )
    args = ap.parse_args()

    if args.shift_sec is None and args.from_tsx is None:
        print("❌ 必須給 --shift-sec 或 --from-tsx 至少一個", file=sys.stderr)
        sys.exit(1)

    if args.from_tsx:
        shift_sec = parse_tsx_transition_sec(args.from_tsx)
        print(f"📐 從 {args.from_tsx} 抓到 TRANSITION_SEC={shift_sec}")
    else:
        shift_sec = args.shift_sec

    count = shift_vtt(args.input, args.output, shift_sec)
    print(f"✅ Shifted {count} cue +{shift_sec}s → {args.output}")


if __name__ == "__main__":
    main()
