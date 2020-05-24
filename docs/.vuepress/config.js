module.exports = {
  "locales": {
    '/': {
      "lang": 'zh-CN'
    }
  },
  "title": "Wallace's Blog",
  "description": "记录个人修行中的点滴",
  "dest": "public",
  "head": [
    [
      "link",
      {
        "rel": "icon",
        "href": "/favicon.ico"
      }
    ],
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  //主题的配置
  "themeConfig": {
    //导航栏配置
    "noFoundPageByTencent": false,
    "nav": [
      {
        "text": "主页",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "时间轴",
        "link": "/timeline/",
        "icon": "reco-date"
      },
      {
        "text": "联系我",
        "icon": "reco-message",
        "items": [
          {
            "text": "GitHub",
            "link": "https://github.com/wallace4ever",
            "icon": "reco-github"
          },
          {
            "text": "邮箱",
            "link": "mailto://xpkllp@hotmail.com",
            "icon": "reco-mail"
          }
        ]
      }
    ],
    //安装时选择的风格
    "type": "blog",
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "分类"
      },
      "tag": {
        "location": 3,
        "text": "标签"
      }
    },
    //友链设置
    "friendLink": [
      {
        "title": "程序羊",
        "desc": "普通的开发者 热情的学习者 狂热的数码迷",
        "thumbnail": "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
        "link": "https://www.codesheep.cn/"
      },
      {
        "title": "vuepress-theme-reco",
        "desc": "A simple and beautiful vuepress Blog & Doc theme.",
        "avatar": "https://www.codesheep.cn/css/images/codesheep_logo.png",
        "link": "https://vuepress-theme-reco.recoluan.com"
      }
    ],
    //其他配置
    "logo": "/logo.png",
    "search": true,
    "searchMaxSuggestions": 10,
    "sidebar": "auto",
    "lastUpdated": "Last Updated",
    "author": "Wallace Xu",
    "authorAvatar": "/avatar.png",
    "startYear": "2019"
  },
  "markdown": {
    "lineNumbers": true
  },
  "plugins": [
  [
    "@vuepress-reco/vuepress-plugin-kan-ban-niang",
    {
      theme: ["blackCat"],
      clean: true,
      messages: {
        welcome: '我是Wallace欢迎你的关注 ',
        home: '回到主页',
        theme: '好吧，希望你能喜欢我的其他小伙伴。',
        close: '再见哦'
      }
    }
  ],
  [
    "vuepress-plugin-auto-sidebar",{}
  ],
]
}