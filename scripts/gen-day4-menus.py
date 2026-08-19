# -*- coding: utf-8 -*-
"""Generate Chinese menu summary PDFs for DAY4 restaurants."""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT

OUT = Path(r"G:\hokkaido-trip-guide\public\docs")
OUT.mkdir(parents=True, exist_ok=True)

font_candidates = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\msyhbd.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
]
font_path = next(p for p in font_candidates if p.exists())
pdfmetrics.registerFont(TTFont("CN", str(font_path), subfontIndex=0))


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "CNTitle",
            parent=base["Title"],
            fontName="CN",
            fontSize=18,
            leading=24,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "CNH2",
            parent=base["Heading2"],
            fontName="CN",
            fontSize=13,
            leading=18,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "CNBody",
            parent=base["BodyText"],
            fontName="CN",
            fontSize=10.5,
            leading=16,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "CNSmall",
            parent=base["BodyText"],
            fontName="CN",
            fontSize=9,
            leading=13,
            textColor="#555555",
        ),
    }


def build(path: Path, title: str, blocks: list[tuple[str, list[str]]], note: str):
    s = styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )
    story = [Paragraph(title, s["title"]), Paragraph(note, s["small"]), Spacer(1, 6)]
    for heading, lines in blocks:
        story.append(Paragraph(heading, s["h2"]))
        for line in lines:
            story.append(Paragraph(f"• {line}", s["body"]))
    doc.build(story)
    print("wrote", path, path.stat().st_size)


build(
    OUT / "jozankei-ichi-menu-zh.pdf",
    "食堂いち · 中文菜单摘要（定山溪）",
    [
        (
            "店况",
            [
                "地址：札幌市南区定山溪温泉西2丁目2 风マチ大楼2楼",
                "营业：11:00–15:00（午餐时段）／周二休（节假日等除外）",
                "风格：炭火定食，道产食材；可看厨房炭火烤制",
            ],
        ),
        (
            "定食主菜（价格会变动，以店内为准）",
            [
                "ゆる焼き鲑定食（慢烤三文鱼定食）约 ¥1,800–1,980",
                "炭烤鸡定食 约 ¥1,800–1,980",
                "生姜烧定食（富良野猪肉）约 ¥1,800",
                "炭火汉堡肉定食（定山溪精肉店牛肉）约 ¥1,800",
                "鱿鱼炖煮定食 约 ¥1,800",
                "炭烤海鲜定食（蟹甲壳烧／扇贝／大虾等）约 ¥3,900",
                "定山溪精肉店特选炭烤牛定食（约180g）约 ¥4,800",
                "中トロ炙り定食（中肥金枪鱼炙烤定食）约 ¥4,800",
                "平日限定 食堂まかない丼（员工餐盖饭）约 ¥1,100–1,200",
            ],
        ),
        (
            "定食通常附带",
            [
                "出汁豆腐、茶碗蒸、小煮物、烤麸、北海道梦美米、味噌汤、小菜等（以当日为准）",
            ],
        ),
    ],
    "非官方中文摘要｜整理自店家官网与公开食记｜现场价目与供应以当日菜单为准",
)

build(
    OUT / "jozankei-konno-menu-zh.pdf",
    "食堂こんの · 中文菜单摘要（定山溪 · 40年拉面馆）",
    [
        (
            "店况",
            [
                "地址：札幌市南区定山溪温泉西3丁目",
                "营业：约 11:30–14:00、18:00–24:00（可能不定休）",
                "特点：开业40年以上，和风厚料酱油拉面最有名",
            ],
        ),
        (
            "菜单（店家公开品类）",
            [
                "拉面：盐味／酱油／味噌",
                "炒饭",
                "饺子",
            ],
        ),
        (
            "亲子提示",
            [
                "适合想快速吃热汤面的备选；分量大可分享",
                "详细价格以店内价目表为准（公开渠道未列出完整价目PDF）",
            ],
        ),
    ],
    "非官方中文摘要｜整理自定山溪观光协会店铺介绍｜以现场为准",
)

build(
    OUT / "jozankei-haruranna-menu-zh.pdf",
    "埜ノ山キッチン はるらんな · 中文菜单摘要",
    [
        (
            "店况",
            [
                "所在：心の里 埜のてらす（定山溪）",
                "午餐 11:00–15:00／咖啡时间 15:00–17:00／周四休",
                "特点：地场蔬菜、古川猪肉；大窗采光，部分席可携犬",
            ],
        ),
        (
            "招牌／已知品项",
            [
                "北海道埜のシチュー（北海道炖菜）— 店家主打",
                "はるらんなサンド（三明治，古川猪肉香肠／培根+时蔬）约 ¥700",
                "定山溪鸡蛋布丁 约 ¥440（相邻甜点店可外带）",
                "巴斯克芝士蛋糕 约 ¥700",
                "饮品：咖啡／红茶／果汁／可可／果昔等约 ¥300–550",
            ],
        ),
        (
            "说明",
            [
                "店家官网以介绍为主，完整正餐价目以店内当日菜单为准",
            ],
        ),
    ],
    "非官方中文摘要｜整理自店家官网｜以现场为准",
)

build(
    OUT / "gaja-susukino-menu-zh.pdf",
    "GAjA すすきの店 · 烤肉自助中文菜单摘要",
    [
        (
            "店况",
            [
                "地址：札幌市中央区南5条西2丁目 Cyber City Building 3F（丰水薄野站附近）",
                "电话：011-520-2911",
                "形式：点餐式吃到饱（オーダーバイキング）+ 甜点吧／冰淇淋吧 + 软饮畅饮",
                "现场多用座位二维码／App 点餐；无固定中文纸质菜单时，可用本摘要对照",
            ],
        ),
        (
            "常见套餐档位（价格常变，预约页为准）",
            [
                "标准自助：约 ¥3,600–4,700／人（含税区间见公开预约页），约80分钟",
                "标准 + 高级选项（プレミア）：约 ¥6,000+／人，约90分钟",
                "含生啤畅饮的组合价更高（约再加 ¥1,000+）",
                "2人起用；同桌需同一套餐",
            ],
        ),
        (
            "自助里通常能点到的品类（翻译自公开食记／套餐说明）",
            [
                "牛肉：牛五花カルビ、牛肋条、吊龙／横膈膜类、牛里脊等（高级档含更多和牛）",
                "猪肉：猪颈肉、猪舌、松阪猪类等",
                "其他肉：鸡肉、羊肉／小羊肉",
                "海鲜：扇贝、鱿鱼、章鱼等",
                "蔬菜／配菜：蔬菜拼盘、石锅拌饭类、米饭、汤品",
                "调味可选：盐、味噌、罗勒、辣椒等（以App选项为准）",
                "甜点吧：约10种冰棒 + 甜点自助；软饮畅饮",
            ],
        ),
        (
            "重要规则（翻译）",
            [
                "每次每人最多点约3盘；达上限后需先换空盘再点",
                "2人桌同时最多约6盘在桌上",
                "尽量吃完；故意浪费／烤焦可能另收费",
                "标准约80分钟／升级约90分钟；酒吧与甜点吧时间同步",
                "自助最后接待约至凌晨2:30（26:30）",
            ],
        ),
    ],
    "非官方中文摘要｜整理自 GAjA 官网自助页与公开食记｜正式菜单以店内App／现场为准｜官网：https://gajafan.com/m/viking/susukino.php",
)

print("done")
