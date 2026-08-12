# 几大主流平台的返回json结构

1、抖音

视频：

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "video",
    "title": "50位唱见CV齐聚｜古风群像大合唱\n#知我 #剑来 #一人一句接歌 #剧情歌 #古风歌曲",
    "desc": "50位唱见CV齐聚｜古风群像大合唱\n#知我 #剑来 #一人一句接歌 #剧情歌 #古风歌曲",
    "author": {
      "name": "Arny",
      "id": 4023818151800856,
      "avatar": "https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813_ooCCBQOAACgB4A8dAAAeG2f4A5AiIXi1gEEIT0.webp?from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=avatar&biz_tag=aweme_avatar&l=202608120908118F937A4C43DD3F609AA7"
    },
    "cover": "https://p3-sign.douyinpic.com/tos-cn-p-0015/oQANuIZf7UEJpEBLCeDdrhFeXJ6uAAyIDX67IB~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1787706000&x-signature=q%2BPQD1w92IJl9T3%2F93mvrbm2eXw%3D&from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=origin_cover&biz_tag=aweme_video&l=202608120908118F937A4C43DD3F609AA7",
    "url": "https://v3-dy-o.zjcdn.com/fafac13dcb70372154ffec65d2f390b4/6a7bd68a/video/tos/cn/tos-cn-v-0015c004/o8DrgVDIEFAhEjCuZAEEA6BAByekf7edUuEBAN/?a=0&br=6677&bt=6677&btag=80000e00030000&cc=1f&cd=0%7C0%7C0%7C4&ch=0&cquery=106H&cr=4&cs=0&cv=1&dr=0&dy_q=1786496892&dy_va_biz_cert=&ft=iJM3pymVZmo0P40aSgkVQN~mApHKJd.o~&l=20260812090812D41A3027DC78E0610A0B%2C20260812090812D41A3027DC78E0610A0B&lr=unwatermarked&mime_type=video_mp4&net=5&qs=13&rc=amd0d3M5cmx4PDMzNGkzM0Bpamd0d3M5cmx4PDMzNGkzM0Bgam8tMmQ0ZGJhLS1kLS9zYSNgam8tMmQ0ZGJhLS1kLS9zcw%3D%3D&req_cdn_type=",
    "duration": 254259,
    "video_backup": [
      {
        "label": "720_1_2|720p|196506|h264|mp4",
        "quality": "720p",
        "url": "https://v11-o.douyinvod.com/1602bbe84cb9bef25b88f6bcc9377ee6/6a7bd689/video/tos/cn/tos-cn-ve-15/owkNBFdE7EufrhNZ9AQedE9uIADUeyDTdIoBFC/?a=1128&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=191&bt=191&cs=5&ds=3&ft=R._rKG3h02R12NvjIvzi7nRfwc2bL84kSYNc&mime_type=video_mp4&qs=0&rc=PDc0Zjg2PDU7NTo5O2g6NUBpamd0d3M5cmx4PDMzNGkzM0A2YV4uMl4uX2MxLWM0XzQxYSNgam8tMmQ0ZGJhLS1kLS9zcw%3D%3D&btag=c0010e000b0008&cc=3e&cquery=103S_100b_104i_103Q_103R&dy_q=1786496892&feature_id=af74c2c3a16393c078a1bf4ca49f0df3&l=202608120908118F937A4C43DD3F609AA7&req_cdn_type=",
        "bit_rate": 196506,
        "width": 1280,
        "height": 720,
        "format": "mp4",
        "codec": "h264",
        "quality_type": 11,
        "gear_name": "720_1_2"
      },
      {
        "label": "540_1_2|576p|155548|h264|mp4",
        "quality": "576p",
        "url": "https://v11-o.douyinvod.com/ee657ce0cbd481c391376ea01bfc0744/6a7bd689/video/tos/cn/tos-cn-ve-15/oIyetdhEeIINuEUUADQE79uFYftC1xBEBDZCAr/?a=1128&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=151&bt=151&cs=5&ds=6&ft=R._rKG3h02R12NvjIvzi7nRfwc2bL84kSYNc&mime_type=video_mp4&qs=0&rc=Zjc1O2ZkaTpnNjpmaDM2ZkBpamd0d3M5cmx4PDMzNGkzM0BeNi0tXy0wXjIxMDQ1MmBjYSNgam8tMmQ0ZGJhLS1kLS9zcw%3D%3D&btag=c0010e000b0008&cc=3e&cquery=103S_100b_104i_103Q_103R&dy_q=1786496892&feature_id=af74c2c3a16393c078a1bf4ca49f0df3&l=202608120908118F937A4C43DD3F609AA7&req_cdn_type=",
        "bit_rate": 155548,
        "width": 1024,
        "height": 576,
        "format": "mp4",
        "codec": "h264",
        "quality_type": 22,
        "gear_name": "540_1_2"
      },
      {
        "label": "540_2_2|576p|119548|h264|mp4",
        "quality": "576p",
        "url": "https://v11-o.douyinvod.com/ef36880f95fcac450a03a73b694f0a37/6a7bd689/video/tos/cn/tos-cn-ve-15/oElAuN9IADhBeyEU7rZCBreElEEsIQFdn5DufD/?a=1128&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=116&bt=116&cs=5&ds=6&ft=R._rKG3h02R12NvjEvzi7nRfwc2bL84kSYNc&mime_type=video_mp4&qs=0&rc=ZWdpPDs3ZjUzaDxmZTc3NkBpamd0d3M5cmx4PDMzNGkzM0AzLS5gLTQwNV8xNGFjX2A0YSNgam8tMmQ0ZGJhLS1kLS9zcw%3D%3D&btag=c0010e000b0008&cc=3e&cquery=103R_103S_100b_104i_103Q&dy_q=1786496892&feature_id=ac032418dfe7c1579a8b7977a526a2a1&l=202608120908118F937A4C43DD3F609AA7&req_cdn_type=",
        "bit_rate": 119548,
        "width": 1024,
        "height": 576,
        "format": "mp4",
        "codec": "h264",
        "quality_type": 23,
        "gear_name": "540_2_2"
      },
      {
        "label": "720_2_2|720p|95668|h264|mp4",
        "quality": "720p",
        "url": "https://v11-o.douyinvod.com/43438ddd22c127b2f9e60357fdc2b8ec/6a7bd689/video/tos/cn/tos-cn-ve-15/oQDrHDDIIFAhENCuZQEE59BCByeSf7edUuFlAN/?a=1128&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=93&bt=93&cs=5&ds=3&ft=R._rKG3h02R12NvjEvzi7nRfwc2bL84kSYNc&mime_type=video_mp4&qs=0&rc=OGg0ZzczZmY0ODw2ZDVnM0Bpamd0d3M5cmx4PDMzNGkzM0AvLmNfNDUwX2AxNDAzNGEvYSNgam8tMmQ0ZGJhLS1kLS9zcw%3D%3D&btag=c0010e000b0008&cc=3e&cquery=100b_104i_103Q_103R_103S&dy_q=1786496891&feature_id=af74c2c3a16393c078a1bf4ca49f0df3&l=202608120908118F937A4C43DD3F609AA7&req_cdn_type=",
        "bit_rate": 95668,
        "width": 1280,
        "height": 720,
        "format": "mp4",
        "codec": "h264",
        "quality_type": 12,
        "gear_name": "720_2_2"
      }
    ],
    "images": [],
    "live_photo": [],
    "music": {
      "title": "@Arny创作的原声",
      "author": "Arny",
      "url": "https://sf11-cdn-tos.douyinstatic.com/obj/ies-music/7664537907272698687.mp3",
      "cover": "https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813_ooCCBQOAACgB4A8dAAAeG2f4A5AiIXi1gEEIT0.webp?from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=avatar&biz_tag=aweme_avatar&l=202608120908118F937A4C43DD3F609AA7"
    },
    "quality": "original",
    "extra": {
      "aweme_id": 7664537852009777000,
      "sec_item_id": "MS4wLjAAAAAAH_awHVZuHIPBT6NcCtqBhpLZ7OaDOh1yNXcBf0HZPAtJwNKJjLYYHAnjs4FKb0xl",
      "create_time": 1784539282,
      "region": "CN",
      "duration_ms": 254259,
      "share_url": "https://www.iesdouyin.com/share/video/7664537852009777573/?region=SG&mid=7664537864360823615&u_code=-1&did=MS4wLjABAAAAMUU43OQ-Zti8YDTfJtSm5s1Z-HwUYItHSl-z1KK9lcMRtOfxJ3pinplkfU3iCK0v&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=.d7E.7auzhH1EpspILknpHIG5cgkzuT4ncQ_8ioJg_U-&share_version=390500&ts=1786496892&from_aid=1128&from_ssr=1&share_track_info=%7B%22link_description_type%22%3A%22%22%7D",
      "statistics": {
        "digg_count": 205517,
        "comment_count": 4816,
        "collect_count": 27247,
        "share_count": 49184,
        "admire_count": 11,
        "play_count": 0
      },
      "hashtags": [
        {
          "name": "知我",
          "id": 1635145565320199,
          "type": 1
        },
        {
          "name": "剑来",
          "id": 1596684729376776,
          "type": 1
        },
        {
          "name": "一人一句接歌",
          "id": 7515236654546848000,
          "type": 1
        },
        {
          "name": "剧情歌",
          "id": 1591410224293902,
          "type": 1
        },
        {
          "name": "古风歌曲",
          "id": 1573703355384925,
          "type": 1
        }
      ],
      "video_tags": [
        {
          "name": "随拍",
          "id": 2029,
          "level": 1
        },
        {
          "name": "录屏",
          "id": 2029002,
          "level": 2
        },
        {
          "name": "聊天记录录屏",
          "id": 2029002003,
          "level": 3
        }
      ],
      "author_extra": {
        "uid": 4023818151800856,
        "sec_uid": "MS4wLjABAAAAWHUUiGQ3XJFJciZthprNp4nr1tvRffcMuWUG3mwRxz681CJm_jbE-kRgvRWzdScl",
        "unique_id": "arnyang",
        "short_id": 2806435537,
        "signature": "哦",
        "follower_count": 0,
        "favoriting_count": 1235,
        "total_favorited": 1334536
      }
    },
    "video_id": "v0200fg10000d9eugi7og65p0trqmdcg"
  },
  "platform": "douyin",
  "cache_status": "rebuilt"
}
```

图文

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "image",
    "title": "给deepseek装个眼睛。用\n接入deepseek v4 flash没有识图功能，在github找的可以识图的外接skill，一句话让他自己看着办就装好了#deepseek #Claude",
    "desc": "给deepseek装个眼睛。用\n接入deepseek v4 flash没有识图功能，在github找的可以识图的外接skill，一句话让他自己看着办就装好了#deepseek #Claude",
    "author": {
      "name": "夭夭",
      "id": 106177940375,
      "avatar": "https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813_oUiWxARzRAtMAGIAi6iUCeiCDHKfI5FAAyYgEB.webp?from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=avatar&biz_tag=aweme_avatar&l=20260812090905557EAC3482A3BD7EA40D"
    },
    "cover": "https://p26-sign.douyinpic.com/tos-cn-i-0813c000-ce/owf14ieBA3BOL1KikTid0EAuEvAwIwExq6AeHA~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1787706000&x-signature=94aP%2BNgtNUbt7TFUjl2F3snfJzM%3D&from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=origin_cover&biz_tag=aweme_images&l=20260812090905557EAC3482A3BD7EA40D",
    "url": null,
    "duration": 0,
    "video_backup": [],
    "images": [
      "https://p3-sign.douyinpic.com/tos-cn-i-0813c000-ce/owf14ieBA3BOL1KikTid0EAuEvAwIwExq6AeHA~tplv-dy-vqe2-sr-v2:1920:1338:q80.jpeg?lk3s=138a59ce&x-expires=1789088400&x-signature=xyHyfuL5%2FRUKfCT0Sp8ilUXApIs%3D&from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=image&biz_tag=aweme_images&l=20260812090905557EAC3482A3BD7EA40D",
      "https://p3-sign.douyinpic.com/tos-cn-i-0813c000-ce/oQwexOiBLAHum1euAwd0TZwEBfAZiEA6iEA1qI~tplv-dy-vqe2-sr-v2:1920:1339:q80.jpeg?lk3s=138a59ce&x-expires=1789088400&x-signature=3hgReEyBdZttO7UkHdGNcaTSH4w%3D&from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=image&biz_tag=aweme_images&l=20260812090905557EAC3482A3BD7EA40D",
      "https://p3-sign.douyinpic.com/tos-cn-i-0813c000-ce/o0iAIeXfqu6EL5Ae0TO1HAidxAIBwBwEAixm1E~tplv-dy-vqe2-sr-v2:1920:1328:q80.jpeg?lk3s=138a59ce&x-expires=1789088400&x-signature=XRJE6Xr4Ck6roQbDCEVJvzI%2BPs4%3D&from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=image&biz_tag=aweme_images&l=20260812090905557EAC3482A3BD7EA40D",
      "https://p3-sign.douyinpic.com/tos-cn-i-0813c000-ce/oUeByANAiB5AIuiw1l6ALTqfHdxeE0AO1EEHwi~tplv-dy-vqe2-sr-v2:1920:1343:q80.jpeg?lk3s=138a59ce&x-expires=1789088400&x-signature=CZo7QAfNNWWydzbInbCTWS0m8As%3D&from=327834062&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=image&biz_tag=aweme_images&l=20260812090905557EAC3482A3BD7EA40D"
    ],
    "live_photo": [],
    "music": {
      "title": "我真没招了",
      "author": "顺顺顺",
      "url": "https://sf11-cdn-tos.douyinstatic.com/obj/tos-cn-ve-2774/owbxCFDSZtAULYuyrzEQjPBCZgTgfhCrmpfqck",
      "cover": "https://p3.douyinpic.com/tos-cn-v-2774c002/ogftmfbzFgMZD6AIAM3ECzBDZAmFInzBpZPSAE~tplv-dy-resize-walign-adapt-aq:100:q75.heic?biz_tag=aweme_music&s=PackSourceEnum_AWEME_DETAIL&sc=cover"
    },
    "quality": "",
    "extra": {
      "aweme_id": 7671125888137818000,
      "sec_item_id": "MS4wLjAAAAAAFsVxuekAi7oBUK5oWriYwtIu7okZX6Gz-AFWquqBGfvDGI6YLqFHAIY_NF1rCm_p",
      "create_time": 1786073178,
      "region": "CN",
      "duration_ms": 0,
      "share_url": "https://www.iesdouyin.com/share/note/7671125888137818097/?region=SG&mid=7606641453054150707&u_code=-1&did=MS4wLjABAAAAFFt1dNHscHGYda9X79hLnQPlrchmBDSe3d13MAAZgvlrVSILKZUnU1FbzLSOxJUj&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&schema_type=37&share_sign=DwP3AX53sJXtG2QKKXVFAKAF.4SyzZS54q7QrB80Rxk-&share_version=390500&ts=1786496945&from_aid=1128&from_ssr=1&share_track_info=%7B%22link_description_type%22%3A%22%22%7D",
      "statistics": {
        "digg_count": 362,
        "comment_count": 19,
        "collect_count": 365,
        "share_count": 45,
        "admire_count": 0,
        "play_count": 0
      },
      "hashtags": [
        {
          "name": "deepseek",
          "id": 1784740573938700,
          "type": 1
        },
        {
          "name": "claude",
          "id": 1640552203935755,
          "type": 1
        }
      ],
      "video_tags": [],
      "author_extra": {
        "uid": 106177940375,
        "sec_uid": "MS4wLjABAAAAa4yXq_bdIGC0QSbJ3PRgHwQBIL6-1akTLL8tKvH2PaI",
        "unique_id": "dyduyjbz10di",
        "short_id": 2943280219,
        "signature": "💌DY58181102",
        "follower_count": 0,
        "favoriting_count": 7888,
        "total_favorited": 613
      }
    }
  },
  "platform": "douyin",
  "cache_status": "rebuilt"
}
```

2、小红书

图文

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "image",
    "title": "GPT订阅开发票",
    "desc": "可配合可发票\n有企业对公账户#GPT[话题]# #codex[话题]# #发票[话题]# #发票[话题]# #全电发票[话题]# #财务会计[话题]# #plus[话题]# #GPT5[话题]#\n#财务小知识[话题]# #GPTPlus优惠[话题]#",
    "author": {
      "name": "三亚市欧奥普创科技有限公司",
      "id": "649e15a3000000000b01740c",
      "avatar": "https://sns-avatar-qc.xhscdn.com/avatar/seller_69eeff85199cb8000185b25e"
    },
    "cover": "https://ci.xiaohongshu.com/1040g2sg323majulf0o005p4u2mhiqt0cn088jeo?imageView2/2/w/1080/format/jpg",
    "url": null,
    "images": [
      "https://ci.xiaohongshu.com/1040g2sg323majulf0o005p4u2mhiqt0cn088jeo?imageView2/2/w/1080/format/jpg",
      "https://ci.xiaohongshu.com/1040g2sg323majulf0o0g5p4u2mhiqt0cib08du8?imageView2/2/w/1080/format/jpg",
      "https://ci.xiaohongshu.com/1040g2sg323majulf0o1g5p4u2mhiqt0c3d665lg?imageView2/2/w/1080/format/jpg"
    ],
    "live_photo": []
  },
  "platform": "xiaohongshu",
  "cache_status": "rebuilt"
}
```

视频

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "video",
    "title": "对深大的刻板印象又加深了",
    "desc": "#深圳大学[话题]# #大学宿舍[话题]# #大学生[话题]# #校园环境[话题]# #羡慕[话题]#",
    "author": {
      "name": "摸娱领头羊",
      "id": "686e59a7000000001e00a162",
      "avatar": "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31q3r6u2tga005q3eb6jnh8b22qdl7do"
    },
    "cover": "https://sns-img-hw.xhscdn.com/spectrum/1040g0k0323nfhhft74005q3eb6jnh8b29q2q2to?imageView2/2/w/1080/format/jpg",
    "url": "https://sns-video-zl.xhscdn.com/stream/79/110/258/01ea7aabaf3f05cb4f0370019fef2f0932_258.mp4?sign=75332d7ecb89bedc9a430c2fee95027c&t=6a806558",
    "images": [
      "https://sns-img-hw.xhscdn.com/spectrum/1040g0k0323nfhhft74005q3eb6jnh8b29q2q2to?imageView2/2/w/1080/format/jpg"
    ],
    "live_photo": [],
    "video_backup": null
  },
  "platform": "xiaohongshu",
  "cache_status": "rebuilt"
}
```

3、视频号

视频

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "video",
    "title": "大批百度阿里中层涌入字节！互联网藤壶来袭，扁平风气直接被啃没了",
    "desc": "大批百度阿里中层涌入字节！互联网藤壶来袭，扁平风气直接被啃没了",
    "cover": "https://finder.video.qq.com/251/20304/stodownload?encfilekey=KGDRibp2wkicLiae1LwWtHUyCb73MxrfhQgvVObYW2KoyGYVCicDWzz9icQZJTSQ7oQm40XMJH2lzuDvGlHicx4cF5xw&token=Cvvj5Ix3eewIL2QHboXicEic5BW1sZ7MYibcpicr2OWnWkUCmBgiavxp5Gy779BRlQ6SVOhyxdibICehTibes7ebicScsCPLpygyhjQibm7D5uT5K3nW5ZiayREyo01AxM5P4APAxPdSpMRcjvmNxN4yHOcFBBFcGIGwVlH3Hd91Ge3gNCuL4Zakdz0EWYfWjI7HaxuA3YIhWb6eDbe8Hseic7l8CqhicOOGp4aS4WYzVxgfr7iaqSyQ&hy=SH&idx=1&m=&scene=2&uzid=1&wxampicformat=503&picformat=200",
    "url": "https://finder.video.qq.com/251/20302/stodownload?encfilekey=rgjNqbibdAo3eZcHX5JLkrJgAchR83CeBaiba5IlTibVnGfoznBndANXq0rvSLSKk9fA8mODgFum1Op79e0ux1Cfw&token=o3K9JoTic9IhB5tRHIXyzwdsMD8AII8CXORlxYLeGC2bZuhC4TCvjOHNE1sh8us539CBdqiapavY0vsMVjibEqMe3GgPNJibFO6UUnuzmAJYgnibUFmy9bQSdiaVZFaTHYPQW6czQuIeHXSaoKAFSTJvcflUm3dYWQg6lNnxUzwdDRkRdtPc6Km2JyG20g5U3l2rHtPib0J7Zr26HniceEpEun1bOJvGkClmP2Vf&bizid=1023&dotrans=0&hy=SH&idx=1&m=&uzid=7a170&X-snsvideoflag=xWT113&basedata=CAMSBnhXVDExMyIMCgoKBnhXVDExMxAAQiAZUvIpqPrRtmRA3lI1eNiEWgcdrxNPpQA1rmE90WzyPEi1kO_TBg&sign=GwzncC_Tma2zvEkL5975Uf7aIVFcivSqLBiZTNLWrISKXluHYiWsyg-O3IZqIecwRruTqa_qJzjg2-FbJRe-0w",
    "quality": "1080p",
    "author": {
      "name": "GeekTech",
      "avatar": "https://wx.qlogo.cn/finderhead/ver_1/R6f2ZaGIKOMs1Via0DaKfJs5OTxDn0P1ZPjMxksmsgx152mwkudWFzSEgokD3efR70HXuhibk9vDJoZIxkCmqdFQXqBicAiadhRrGxlNFJBbicEzyU8ffe3JmVM2fIwZnRrxic/0"
    },
    "video_backup": [
      {
        "label": "1080p",
        "quality": "1080p",
        "url": "https://finder.video.qq.com/251/20302/stodownload?encfilekey=rgjNqbibdAo3eZcHX5JLkrJgAchR83CeBaiba5IlTibVnGfoznBndANXq0rvSLSKk9fA8mODgFum1Op79e0ux1Cfw&token=o3K9JoTic9IhB5tRHIXyzwdsMD8AII8CXORlxYLeGC2bZuhC4TCvjOHNE1sh8us539CBdqiapavY0vsMVjibEqMe3GgPNJibFO6UUnuzmAJYgnibUFmy9bQSdiaVZFaTHYPQW6czQuIeHXSaoKAFSTJvcflUm3dYWQg6lNnxUzwdDRkRdtPc6Km2JyG20g5U3l2rHtPib0J7Zr26HniceEpEun1bOJvGkClmP2Vf&bizid=1023&dotrans=0&hy=SH&idx=1&m=&uzid=7a170&X-snsvideoflag=xWT113&basedata=CAMSBnhXVDExMyIMCgoKBnhXVDExMxAAQiAZUvIpqPrRtmRA3lI1eNiEWgcdrxNPpQA1rmE90WzyPEi1kO_TBg&sign=GwzncC_Tma2zvEkL5975Uf7aIVFcivSqLBiZTNLWrISKXluHYiWsyg-O3IZqIecwRruTqa_qJzjg2-FbJRe-0w",
        "format": "mp4",
        "codec": "h264",
        "quality_type": 8,
        "gear_name": "高清"
      },
      {
        "label": "1080p",
        "quality": "1080p",
        "url": "https://finder.video.qq.com/251/20302/stodownload?encfilekey=rgjNqbibdAo3eZcHX5JLkrJgAchR83CeBaiba5IlTibVnGfoznBndANXq0rvSLSKk9fA8mODgFum1Op79e0ux1Cfw&token=Cvvj5Ix3eewIL2QHboXicE3I7xXgDNbxpwB7zmYXgs8iaVZDCptK8H7t4EicCgP2WMbUOAbsgbqvQKDc81pCYSvkyD0d7vnEZcMr9gWZfcMUroLIHlOF0dbeDYlAYk4mO7q4VremLSSqmtF0gT49dHQjgXcT89ndvia9QmWmf6ONT4v8wE70XkicFDdCEdz2sTvsoibfh6nAkuEjq5C8O4Z0J9oXrCY970jbwV8akz4OUQ5uA&bizid=1023&dotrans=0&hy=SH&idx=1&m=&uzid=7a170&X-snsvideoflag=xWT258&basedata=CAMSBnhXVDI1OCIMCgoKBnhXVDI1OBAAQiAe-ylujeDmqpFU83cICsw7DNx27IPYqrh86R6_yHW-8ki1kO_TBg&sign=MPoIum6JYwRetWNAyhLIZvL5exPBLZI4fZGJTr1RtfM_fIyJXgOHu2n467z7TMYZXHIGpHt6r3P5x2N57NAJwA",
        "format": "mp4",
        "codec": "h265",
        "quality_type": 8,
        "gear_name": "高清"
      }
    ],
    "extra": {
      "create_time": 1786433331,
      "expire_time": "2026-08-13 01:11:15"
    }
  },
  "platform": "wxsph",
  "cache_status": "rebuilt"
}
```

图文

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "video",
    "title": "属实惊叹AI的多任务探测水平(仅做安全技术学习)\n#一天一个ai干货#ai开发学习#ai指令#大模型agent开发#ai部署",
    "desc": "属实惊叹AI的多任务探测水平(仅做安全技术学习)\n#一天一个ai干货#ai开发学习#ai指令#大模型agent开发#ai部署",
    "cover": "https://finder.video.qq.com/251/20350/stodownload?encfilekey=2fG3V4WwQPkyCmsVNcN3Ps7VAywERNseMBxeHiaEEQMmYuZicBkCo1JX9QOTsDBiaV5PN1NdH3wwEg3HdgyUj6Wqwao8SnA69lE9u5LglkdFeI&token=Cvvj5Ix3eewIL2QHboXicE6UpFfiaZfLRiagHSePL9sjrhKDEhib81eV5MicDtKseWia3o4UCA3GxrSvzib1z619p3XDjOcqzjVoFa3K5S3VmHl28K0csuIV98iciaY5Fa4xActPCwDYL9E5MYOCM6ribmrWfQiaf1iaOQlusybV0uriblXpHHCibhw5lxwIrBveZPVQY1FULhia3msCjEWpLeeg6xHhicgoTWyDGRhrEAbT3afA0x1v2xA&hy=SZ&idx=1&m=1adf4f5af36929c8c7d8e8ee495fc153&wxampicformat=503&picformat=200",
    "url": "",
    "quality": "origin",
    "author": {
      "name": "KK黑牛AI",
      "avatar": "https://wx.qlogo.cn/finderhead/ver_1/NGxdXMibnZvdsR5icdKNlj6UmPkkKlTHSRYG2tJcsrCibRDyL9CIDibTwWFc5edJegvelDiabIcb5STbgSBogPt2nCnuVco7LMap43ic6vZooxTaCJb9MfPicdDg7MaZrDbbFnCK8ia5nI5G0FZqR319qhFxxA/0"
    },
    "extra": {
      "create_time": 1786431543,
      "expire_time": "2026-08-13 01:12:01"
    }
  },
  "platform": "wxsph",
  "cache_status": "rebuilt"
}
```

4、bilibili

视频

```
{
  "code": 200,
  "msg": "解析成功！",
  "data": {
    "title": "豆包真能干活了！【豆包Agent入门教程】",
    "cover": "http://i1.hdslb.com/bfs/archive/4f3d74c011fb41aea2260b749a8b0f9e2658d542.jpg",
    "auther": "秋芝2046",
    "avatar": "https://i0.hdslb.com/bfs/face/9caeeb8cbf5b2f29e5304d0909390ba5d91331c9.jpg",
    "description": "这个视频让你的豆包技能噌噌上涨，还有“秋芝AI科普skill”帮你答疑～\n感谢朋友们的三连+关注~",
    "url": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/60/61/40081426160/40081426160-1-192.mp4?e=ig8euxZM2rNcNbRVhwdVhwdlhWdVhwdVhoNvNC8BqJIzNbfq9rVEuxTEnE8L5F6VnEsSTx0vkX8fqJeYTj_lta53NCM=&uipk=5&oi=2523728552&deadline=1786504370&trid=ca0b50ae5e384312935f4d32c3c0fd7h&mid=0&gen=playurlv3&platform=html5&nbs=1&os=akam&og=cos&upsig=bcc1f585e17e3b44032838ec37260fb2&uparams=e,uipk,oi,deadline,trid,mid,gen,platform,nbs,os,og&hdnts=exp=1786504370~hmac=948a8b0e2f01e416529e6e933768381259623296300fbb97136a3bd98c741ffa&bvc=vod&nettype=0&bw=485081&lrs=0&f=h_0_0&agrr=1&buvid=&build=0&dl=0&orderid=0,1",
    "user": {
      "name": "秋芝2046",
      "user_img": "https://i0.hdslb.com/bfs/face/9caeeb8cbf5b2f29e5304d0909390ba5d91331c9.jpg"
    },
    "videos": [
      {
        "title": "比99%的人更会用豆包!【豆包Agent入门教程】",
        "duration": 491,
        "durationFormat": "00:08:10",
        "accept": [
          "高清 720P",
          "流畅 360P"
        ],
        "url": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/60/61/40081426160/40081426160-1-192.mp4?e=ig8euxZM2rNcNbRVhwdVhwdlhWdVhwdVhoNvNC8BqJIzNbfq9rVEuxTEnE8L5F6VnEsSTx0vkX8fqJeYTj_lta53NCM=&uipk=5&oi=2523728552&deadline=1786504370&trid=ca0b50ae5e384312935f4d32c3c0fd7h&mid=0&gen=playurlv3&platform=html5&nbs=1&os=akam&og=cos&upsig=bcc1f585e17e3b44032838ec37260fb2&uparams=e,uipk,oi,deadline,trid,mid,gen,platform,nbs,os,og&hdnts=exp=1786504370~hmac=948a8b0e2f01e416529e6e933768381259623296300fbb97136a3bd98c741ffa&bvc=vod&nettype=0&bw=485081&lrs=0&f=h_0_0&agrr=1&buvid=&build=0&dl=0&orderid=0,1",
        "index": 1
      }
    ],
    "totalVideos": 1
  },
  "platform": "bilibili",
  "cache_status": "rebuilt"
}
```

5、快手

视频

```
{
  "code": 200,
  "msg": "解析成功-fallback",
  "data": {
    "type": "video",
    "title": "我的弟弟被执行安乐死，我用摩斯电码救了他（1）",
    "desc": "我的弟弟被执行安乐死，我用摩斯电码救了他（1）",
    "author": {
      "name": "墨白科普",
      "id": 4587972074,
      "avatar": "https://p66-pro.a.yximgs.com/uhead/AB/2025/09/23/21/BMjAyNTA5MjMyMTQxNDBfNDU4Nzk3MjA3NF8yX2hkMF83NTQ=_s.jpg"
    },
    "video_backup": [
      {
        "label": "1080p",
        "quality": "1080p",
        "url": "https://k0u77y60yf9y57zw240ex95cx3018x502xx17z.djvod.ndcimgs.com/bs2/photo-video-mz/5190680247537925742_de503aeb6ca475e0_9542_v6UltraV5.mp4?tag=1-1786497215-unknown-0-uvwknwpwww-8ce0daa1e642e16a&provider=self&clientCacheKey=3x5vtqevvfmyd49_1cb02789&di=ab2ba527&bp=10000&x-ks-ptid=202323690044&kwai-not-alloc=self-cdn&kcdntag=p:Hubei;i:ChinaTelecom;ft:UNKNOWN;h:COLD;pn:kuaishouVideoProjection&ocid=300000603&tt=v6UltraV5&ss=vpm",
        "bit_rate": 1063000,
        "width": 1080,
        "height": 1920,
        "codec": "hevc"
      },
      {
        "label": "高清",
        "quality": "720p",
        "url": "https://k0u77y60yf9y57zw240ex95cx3018x502xx17z.djvod.ndcimgs.com/bs2/photo-video-mz/5190680247537925742_de503aeb6ca475e0_9542_v6HighV5.mp4?tag=1-1786497215-unknown-0-ovnr3mztiy-b1642ceba3c26680&provider=self&clientCacheKey=3x5vtqevvfmyd49_3815e7ba&di=ab2ba527&bp=10000&x-ks-ptid=202323690044&kwai-not-alloc=self-cdn&kcdntag=p:Hubei;i:ChinaTelecom;ft:UNKNOWN;h:COLD;pn:kuaishouVideoProjection&ocid=300000603&tt=v6HighV5&ss=vpm",
        "bit_rate": 687000,
        "width": 720,
        "height": 1280,
        "codec": "hevc"
      },
      {
        "label": "高清",
        "quality": "720p",
        "url": "https://k0u77y60yf9y57zw240ex95cx3018x502xx17z.djvod.ndcimgs.com/upic/2026/07/16/16/BMjAyNjA3MTYxNjA0MjFfNDU4Nzk3MjA3NF8yMDIzMjM2OTAwNDRfMF8z_b_Bea20db1bd26aa9f5680bf5e0bba79572.mp4?tag=1-1786497215-unknown-0-f77yx57f9x-71965cf9d2666b91&provider=self&clientCacheKey=3x5vtqevvfmyd49_b.mp4&di=ab2ba527&bp=10000&x-ks-ptid=202323690044&kwai-not-alloc=self-cdn&kcdntag=p:Hubei;i:ChinaTelecom;ft:UNKNOWN;h:COLD;pn:kuaishouVideoProjection&ocid=300000603&tt=b&ss=vpm",
        "bit_rate": 2089000,
        "width": 720,
        "height": 1280,
        "codec": "avc"
      }
    ],
    "url": "https://k0u77y60yf9y57zw240ex95cx3018x502xx17z.djvod.ndcimgs.com/bs2/photo-video-mz/5190680247537925742_de503aeb6ca475e0_9542_v6UltraV5.mp4?tag=1-1786497215-unknown-0-uvwknwpwww-8ce0daa1e642e16a&provider=self&clientCacheKey=3x5vtqevvfmyd49_1cb02789&di=ab2ba527&bp=10000&x-ks-ptid=202323690044&kwai-not-alloc=self-cdn&kcdntag=p:Hubei;i:ChinaTelecom;ft:UNKNOWN;h:COLD;pn:kuaishouVideoProjection&ocid=300000603&tt=v6UltraV5&ss=vpm",
    "quality": "1080p",
    "duration": 114,
    "extra": {
      "aweme_id": 5190680247537926000,
      "statistics": {
        "play_count": 467
      }
    }
  },
  "platform": "kuaishou",
  "cache_status": "rebuilt"
}
```

图文

```
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "type": "image",
    "title": "关于夏天，是微风，是晚霞，是心跳，是无可替代 #夏天 #风景 #治愈 #图文新星计划",
    "desc": "关于夏天，是微风，是晚霞，是心跳，是无可替代 #夏天 #风景 #治愈 #图文新星计划",
    "author": {
      "name": "Sky治愈风景",
      "id": "1017780375",
      "avatar": "http://p22.a.yximgs.com/uhead/AB/2025/06/30/10/BMjAyNTA2MzAxMDI3MzRfMTAxNzc4MDM3NV8yX2hkMzI2XzM4Ng==_s.jpg"
    },
    "cover": "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_0.webp",
    "url": null,
    "images": [
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_0.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_1.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_2.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_3.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_4.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_5.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_6.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_7.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_8.webp",
      "http://ws2.a.kwimgs.com/ufile/atlas/NTIwODQxMzEyOTEyNDY0ODA3Nl8xNzQzNzU1NjE3NTky_9.webp"
    ],
    "extra": {
      "aweme_id": "5208413129124648076",
      "create_time": 1743755624,
      "statistics": {
        "play_count": 665067,
        "like_count": 68061,
        "comment_count": 3374,
        "share_count": 14758
      }
    }
  },
  "platform": "kuaishou",
  "cache_status": "rebuilt"
}
```

