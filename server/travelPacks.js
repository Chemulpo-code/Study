export const travelPacks = [
  {
    id: 'taxi', title: 'Такси', mark: '车', description: 'Маршрут, цена и просьбы водителю',
    cards: [
      ['请去这里。', 'Qǐng qù zhèlǐ.', 'Пожалуйста, отвезите сюда.'],
      ['到机场多少钱？', 'Dào jīchǎng duōshao qián?', 'Сколько до аэропорта?'],
      ['请停在这里。', 'Qǐng tíng zài zhèlǐ.', 'Пожалуйста, остановитесь здесь.']
    ]
  },
  {
    id: 'restaurant', title: 'Ресторан', mark: '吃', description: 'Заказ, счёт и предпочтения',
    cards: [
      ['请给我菜单。', 'Qǐng gěi wǒ càidān.', 'Дайте, пожалуйста, меню.'],
      ['我不要辣。', 'Wǒ bú yào là.', 'Мне не острое, пожалуйста.'],
      ['买单。', 'Mǎidān.', 'Счёт, пожалуйста.']
    ]
  },
  {
    id: 'hotel', title: 'Отель', mark: '住', description: 'Заселение и помощь в номере',
    cards: [
      ['我有预订。', 'Wǒ yǒu yùdìng.', 'У меня есть бронирование.'],
      ['我的房间在哪里？', 'Wǒ de fángjiān zài nǎlǐ?', 'Где мой номер?'],
      ['可以帮我吗？', 'Kěyǐ bāng wǒ ma?', 'Вы можете мне помочь?']
    ]
  },
  {
    id: 'shopping', title: 'Покупки', mark: '买', description: 'Цена, размер и оплата',
    cards: [
      ['这个多少钱？', 'Zhège duōshao qián?', 'Сколько это стоит?'],
      ['有大一点的吗？', 'Yǒu dà yìdiǎn de ma?', 'Есть размер побольше?'],
      ['可以用卡吗？', 'Kěyǐ yòng kǎ ma?', 'Можно оплатить картой?']
    ]
  },
  {
    id: 'emergency', title: 'Экстренная ситуация', mark: '急', description: 'Помощь, полиция и врач',
    cards: [
      ['请帮帮我。', 'Qǐng bāngbang wǒ.', 'Пожалуйста, помогите мне.'],
      ['我需要医生。', 'Wǒ xūyào yīshēng.', 'Мне нужен врач.'],
      ['请叫警察。', 'Qǐng jiào jǐngchá.', 'Пожалуйста, вызовите полицию.']
    ]
  }
].map(pack => ({ ...pack, cards: pack.cards.map(([characters, pinyin, translation], index) => ({ id: `${pack.id}-${index}`, characters, pinyin, translation })) }));
