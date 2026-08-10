export type JapanesePhrase = {
  chinese: string
  japanese: string
  romaji: string
}

export type JapaneseLesson = {
  id: string
  title: string
  subtitle: string
  phrases: JapanesePhrase[]
}

export const japaneseLessons: JapaneseLesson[] = [
  {
    id: 'polite',
    title: '基础礼貌',
    subtitle: '先记住这组，绝大多数场景都能用。',
    phrases: [
      { chinese: '您好', japanese: 'こんにちは', romaji: 'Konnichiwa' },
      { chinese: '非常感谢', japanese: 'ありがとうございます', romaji: 'Arigatou gozaimasu' },
      { chinese: '不好意思，请问一下', japanese: 'すみません、ちょっといいですか？', romaji: 'Sumimasen, chotto ii desu ka?' },
      { chinese: '拜托您了', japanese: 'お願いします', romaji: 'Onegai shimasu' },
      { chinese: '没关系 / 我没事', japanese: '大丈夫です', romaji: 'Daijoubu desu' },
    ],
  },
  {
    id: 'restaurant',
    title: '餐厅用语',
    subtitle: '入店、点餐和结账时最实用。',
    phrases: [
      { chinese: '4 位成人、2 个孩子', japanese: '大人4人、子ども2人です', romaji: 'Otona yonin, kodomo futari desu' },
      { chinese: '请给我这个', japanese: 'これをお願いします', romaji: 'Kore o onegai shimasu' },
      { chinese: '有儿童菜单吗？', japanese: 'お子様メニューはありますか？', romaji: 'Okosama menyuu wa arimasu ka?' },
      { chinese: '请问洗手间在哪里？', japanese: 'トイレはどこですか？', romaji: 'Toire wa doko desu ka?' },
      { chinese: '麻烦结账', japanese: 'お会計をお願いします', romaji: 'Okaikei o onegai shimasu' },
    ],
  },
  {
    id: 'transport',
    title: '问路与交通',
    subtitle: '开车、停车或找不到地点时使用。',
    phrases: [
      { chinese: '请问这里怎么走？', japanese: 'ここへはどう行けばいいですか？', romaji: 'Koko e wa dou ikeba ii desu ka?' },
      { chinese: '请带我们到这里', japanese: 'ここまでお願いします', romaji: 'Koko made onegai shimasu' },
      { chinese: '这里可以停车吗？', japanese: 'ここに車を停めてもいいですか？', romaji: 'Koko ni kuruma o tomete mo ii desu ka?' },
      { chinese: '我们迷路了', japanese: '道に迷いました', romaji: 'Michi ni mayoimashita' },
      { chinese: '请再说慢一点', japanese: 'もう少しゆっくり話してください', romaji: 'Mou sukoshi yukkuri hanashite kudasai' },
    ],
  },
  {
    id: 'shopping',
    title: '购物结账',
    subtitle: '便利店、药妆店和伴手礼店都适用。',
    phrases: [
      { chinese: '这个多少钱？', japanese: 'これはいくらですか？', romaji: 'Kore wa ikura desu ka?' },
      { chinese: '可以刷卡吗？', japanese: 'カードは使えますか？', romaji: 'Kaado wa tsukaemasu ka?' },
      { chinese: '可以免税吗？', japanese: '免税できますか？', romaji: 'Menzei dekimasu ka?' },
      { chinese: '请给我一个袋子', japanese: '袋を一枚お願いします', romaji: 'Fukuro o ichimai onegai shimasu' },
      { chinese: '我只是看看', japanese: '見ているだけです', romaji: 'Mite iru dake desu' },
    ],
  },
  {
    id: 'family',
    title: '亲子与应急',
    subtitle: '孩子不舒服或需要求助时直接出示。',
    phrases: [
      { chinese: '孩子身体不舒服', japanese: '子どもの具合が悪いです', romaji: 'Kodomo no guai ga warui desu' },
      { chinese: '我对这个过敏', japanese: 'これにアレルギーがあります', romaji: 'Kore ni arerugii ga arimasu' },
      { chinese: '请帮帮我们', japanese: '助けてください', romaji: 'Tasukete kudasai' },
      { chinese: '请叫救护车', japanese: '救急車を呼んでください', romaji: 'Kyuukyuusha o yonde kudasai' },
      { chinese: '有会说中文的人吗？', japanese: '中国語を話せる方はいますか？', romaji: 'Chuugokugo o hanaseru kata wa imasu ka?' },
    ],
  },
]
