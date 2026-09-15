# -*- coding: utf-8 -*-
"""Export interview questions + options to Excel."""
import re
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

SRC = Path(__file__).resolve().parent / "src" / "data" / "questions.ts"
OUT = Path(__file__).resolve().parent / "voprosy-karta-sebya.xlsx"

text = SRC.read_text(encoding="utf-8")

# Split into question objects roughly by "id: 's"
blocks = re.split(r"\n  \{\n    id: '", text)
rows = []

for block in blocks[1:]:
    qid_m = re.match(r"([^']+)'", block)
    if not qid_m:
        continue
    qid = qid_m.group(1)
    if qid.startswith("s") is False and not qid[0].isdigit():
        # skip non-question (none expected)
        pass

    def field(name: str) -> str | None:
        m = re.search(rf"{name}:\s*'((?:\\'|[^'])*)'", block)
        if m:
            return m.group(1).replace("\\'", "'")
        m = re.search(rf"{name}:\s*(\d+)", block)
        if m:
            return m.group(1)
        return None

    session = field("session") or ""
    chapter = field("chapter") or ""
    qtype = field("type") or ""
    title = field("title") or ""
    subtitle = field("subtitle") or ""
    required = "да" if re.search(r"required:\s*true", block) else ""
    max_sel = field("maxSelect") or ""
    scale_min = field("scaleMin") or ""
    scale_max = field("scaleMax") or ""

    scale_labels = ""
    sl = re.search(
        r"scaleLabels:\s*(?:scaleAgree|scaleFill|\[([^\]]+)\])",
        block,
    )
    if sl and sl.group(1):
        labs = re.findall(r"'((?:\\'|[^'])*)'", sl.group(1))
        scale_labels = " — ".join(labs)
    elif "scaleLabels: scaleAgree" in block:
        scale_labels = "Совсем нет — Очень да"
    elif "scaleLabels: scaleFill" in block:
        scale_labels = "Опустошало — Наполняло"
    else:
        sl2 = re.search(r"scaleLabels:\s*\[([^\]]+)\]", block)
        if sl2:
            labs = re.findall(r"'((?:\\'|[^'])*)'", sl2.group(1))
            scale_labels = " — ".join(labs)

    # options
    opt_block = re.search(r"options:\s*\[(.*?)\]\s*,", block, re.S)
    options = []
    if opt_block:
        options = re.findall(
            r"\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'((?:\\'|[^'])*)'",
            opt_block.group(1),
        )
        options = [(i, lab.replace("\\'", "'")) for i, lab in options]

    if qtype in ("intro", "surprise"):
        rows.append(
            {
                "session": session,
                "chapter": chapter,
                "id": qid,
                "type": qtype,
                "title": title,
                "subtitle": subtitle,
                "required": required,
                "maxSelect": "",
                "scale": "",
                "option_id": "",
                "option_label": "(экран без вариантов)",
            }
        )
    elif qtype in ("text", "longtext", "chips"):
        rows.append(
            {
                "session": session,
                "chapter": chapter,
                "id": qid,
                "type": qtype,
                "title": title,
                "subtitle": subtitle,
                "required": required,
                "maxSelect": "",
                "scale": "",
                "option_id": "",
                "option_label": "(свободный текст)" if qtype != "chips" else "(свои чипы)",
            }
        )
    elif qtype == "scale":
        rows.append(
            {
                "session": session,
                "chapter": chapter,
                "id": qid,
                "type": qtype,
                "title": title,
                "subtitle": subtitle,
                "required": required,
                "maxSelect": "",
                "scale": f"{scale_min}–{scale_max}" + (f" ({scale_labels})" if scale_labels else ""),
                "option_id": "",
                "option_label": f"Шкала {scale_min}–{scale_max}"
                + (f": {scale_labels}" if scale_labels else ""),
            }
        )
    elif options:
        for oid, olab in options:
            rows.append(
                {
                    "session": session,
                    "chapter": chapter,
                    "id": qid,
                    "type": qtype,
                    "title": title,
                    "subtitle": subtitle,
                    "required": required,
                    "maxSelect": max_sel,
                    "scale": "",
                    "option_id": oid,
                    "option_label": olab,
                }
            )
    else:
        rows.append(
            {
                "session": session,
                "chapter": chapter,
                "id": qid,
                "type": qtype,
                "title": title,
                "subtitle": subtitle,
                "required": required,
                "maxSelect": max_sel,
                "scale": "",
                "option_id": "",
                "option_label": "",
            }
        )

# Only keep real interview questions s1_/s2_/s3_
rows = [r for r in rows if re.match(r"^s[123]_", r["id"])]

wb = Workbook()

# Sheet 1: flat options
ws = wb.active
ws.title = "Вопросы и варианты"
headers = [
    "Часть",
    "Глава",
    "ID вопроса",
    "Тип",
    "Вопрос",
    "Подзаголовок",
    "Обязательный",
    "Макс. выбора",
    "Шкала",
    "ID варианта",
    "Вариант ответа",
]
ws.append(headers)

header_fill = PatternFill("solid", fgColor="163F3A")
header_font = Font(color="FFFFFF", bold=True)
thin = Border(
    left=Side(style="thin", color="CCCCCC"),
    right=Side(style="thin", color="CCCCCC"),
    top=Side(style="thin", color="CCCCCC"),
    bottom=Side(style="thin", color="CCCCCC"),
)
alt = PatternFill("solid", fgColor="F3F7F5")

for col, h in enumerate(headers, 1):
    cell = ws.cell(1, col, h)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(vertical="center", wrap_text=True)

for i, r in enumerate(rows):
    line = [
        r["session"],
        r["chapter"],
        r["id"],
        r["type"],
        r["title"],
        r["subtitle"],
        r["required"],
        r["maxSelect"],
        r["scale"],
        r["option_id"],
        r["option_label"],
    ]
    ws.append(line)
    for col in range(1, len(headers) + 1):
        cell = ws.cell(i + 2, col)
        cell.alignment = Alignment(vertical="top", wrap_text=True)
        cell.border = thin
        if i % 2 == 1:
            cell.fill = alt

widths = [8, 14, 22, 10, 45, 40, 12, 12, 28, 18, 55]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(rows) + 1}"
ws.freeze_panes = "A2"

# Sheet 2: one row per question, options joined
ws2 = wb.create_sheet("Сводка по вопросам")
h2 = ["Часть", "Глава", "ID", "Тип", "Вопрос", "Подзаголовок", "Обязательный", "Параметры", "Варианты"]
ws2.append(h2)
for col, h in enumerate(h2, 1):
    cell = ws2.cell(1, col, h)
    cell.fill = header_fill
    cell.font = header_font

by_q: dict[str, dict] = {}
order = []
for r in rows:
    if r["id"] not in by_q:
        by_q[r["id"]] = {**r, "opts": []}
        order.append(r["id"])
    if r["option_label"]:
        label = r["option_label"]
        if r["option_id"]:
            label = f"{r['option_id']}: {r['option_label']}"
        by_q[r["id"]]["opts"].append(label)

for i, qid in enumerate(order):
    q = by_q[qid]
    params = []
    if q["maxSelect"]:
        params.append(f"maxSelect={q['maxSelect']}")
    if q["scale"]:
        params.append(q["scale"])
    line = [
        q["session"],
        q["chapter"],
        q["id"],
        q["type"],
        q["title"],
        q["subtitle"],
        q["required"],
        "; ".join(params),
        "\n".join(q["opts"]),
    ]
    ws2.append(line)
    for col in range(1, len(h2) + 1):
        cell = ws2.cell(i + 2, col)
        cell.alignment = Alignment(vertical="top", wrap_text=True)
        cell.border = thin

for i, w in enumerate([8, 14, 22, 10, 45, 40, 12, 20, 70], 1):
    ws2.column_dimensions[get_column_letter(i)].width = w
ws2.freeze_panes = "A2"
ws2.auto_filter.ref = f"A1:I{len(order) + 1}"

wb.save(OUT)
print(f"OK: {OUT}")
print(f"questions: {len(order)}, rows: {len(rows)}")
