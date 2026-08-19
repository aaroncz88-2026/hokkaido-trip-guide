# -*- coding: utf-8 -*-
"""Generate GAjA Susukino reservation voucher PDF (Chinese)."""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

OUT = Path(r"G:\hokkaido-trip-guide\public\docs\gaja-susukino-reservation.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

font_candidates = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\msyhbd.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
]
font_path = next(p for p in font_candidates if p.exists())
pdfmetrics.registerFont(TTFont("CN", str(font_path), subfontIndex=0))

base = getSampleStyleSheet()
title = ParagraphStyle("T", parent=base["Title"], fontName="CN", fontSize=18, leading=24, spaceAfter=4)
badge = ParagraphStyle("B", parent=base["BodyText"], fontName="CN", fontSize=11, leading=16, textColor=colors.HexColor("#2f6f68"), spaceAfter=10)
h2 = ParagraphStyle("H", parent=base["Heading2"], fontName="CN", fontSize=12, leading=16, spaceBefore=10, spaceAfter=6)
body = ParagraphStyle("P", parent=base["BodyText"], fontName="CN", fontSize=10.5, leading=16, spaceAfter=3)
small = ParagraphStyle("S", parent=base["BodyText"], fontName="CN", fontSize=9, leading=13, textColor=colors.HexColor("#555555"), spaceAfter=3)
cell = ParagraphStyle("C", parent=base["BodyText"], fontName="CN", fontSize=10, leading=14)

rows = [
    ["餐厅", "gajaすすきの店（GAjA 薄野店）"],
    ["预约编号", "#30633"],
    ["日期", "2026年8月26日（星期三）· DAY4"],
    ["时间", "18:45 来店 → 20:45 离店（约 2 小时）"],
    ["人数", "6位（大人 4人，小孩 2人）"],
    ["桌位", "屏風隔間（屏风隔间）"],
    ["餐点", "プレミア食べ放題 6028円コース × 6人"],
    ["单价参考", "¥6,028 / 人（以店内结算为准）"],
    ["预约姓名", "CHEN ZHONG"],
    ["电话", "+86 13816203772"],
    ["邮箱", "13816203772@163.com"],
]

table_data = [[Paragraph(a, cell), Paragraph(b, cell)] for a, b in rows]
table = Table(table_data, colWidths=[32 * mm, 140 * mm])
table.setStyle(
    TableStyle(
        [
            ("FONTNAME", (0, 0), (-1, -1), "CN"),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef6f4")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#2f6f68")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cfe3df")),
        ]
    )
)

doc = SimpleDocTemplate(
    str(OUT),
    pagesize=A4,
    leftMargin=16 * mm,
    rightMargin=16 * mm,
    topMargin=14 * mm,
    bottomMargin=14 * mm,
)

story = [
    Paragraph("GAjA すすきの店 · 预约凭证", title),
    Paragraph("【已确认预约】入店时出示本页或预约编号即可", badge),
    HRFlowable(width="100%", thickness=1, color=colors.HexColor("#2f6f68"), spaceAfter=10),
    table,
    Spacer(1, 10),
    Paragraph("餐厅信息", h2),
    Paragraph("地址：北海道札幌市中央区南5条西2丁目 Cyber City Building 3F", body),
    Paragraph("电话：011-520-2911", body),
    Paragraph("官网：https://gajafan.com", body),
    Spacer(1, 6),
    Paragraph("停车提示", h2),
    Paragraph("可停 トラストパーク札幌すすきの5・2，再到店。", body),
    Spacer(1, 6),
    Paragraph("变更／取消说明", h2),
    Paragraph("取消或改期请至少提前一天致电餐厅：011-520-2911（勿只回邮件）。", body),
    Paragraph("在线取消页（Toreta）：", small),
    Paragraph(
        "https://rsv.ms/Q9L1WxGpJUgmlve2GjM8fxNm5G6NCC7ijMaa_6A7xzg",
        small,
    ),
    Spacer(1, 10),
    Paragraph(
        "整理自 Toreta 预约确认邮件｜请保留至用餐当天｜本页供家庭行程离线出示",
        small,
    ),
]
doc.build(story)
print("wrote", OUT, OUT.stat().st_size)
