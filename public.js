// 获取DOM
let oPage = document.getElementById("page-fans");//整个页面
let oUserName = document.getElementById('j-user-name');//用户名DOM
let oUserFans = document.getElementById('j-user-fans');//用户粉丝DOM
let oContent = oPage.getElementsByClassName('j-content');//DOM包裹
let oList = document.getElementById('list');//弹幕的列表DOM
let oUserLink = document.getElementById('user-link');//用户名上面的链接
let oBarItem = oPage.getElementsByClassName('bar-item');// 弹幕粒子集合DOM

// 后端API的地址
let BASE_URL = 'https://api.axihe.com';

// 定时器变量
let timer = null;//轮训最新粉丝的定时器
let timeVal = 1000 * 30;

// 配置变量
let BANG_ID = 59312814;
let BASE_CONF = {
    user_id: BANG_ID,
    color: ""
}

// 弹幕的颜色
let tempColor = '';
let lv = {
    zero: 0,
    one: 10000 * 10,
    two: 10000 * 100,
    three: 10000 * 1000
}

let Utility = {
    // 初始化
    init: function () {
        this.bind();
        this.parseUrlParams();
        this.formatBarrage();
        this.baidu();
        this.setLayout()
    },

    // 绑定事件
    bind: function () {
        // 弹幕区域的移入和移除
        oList.onmouseover = function () {
            oList.style.webkitAnimationPlayState = "paused"
        }
        oList.onmouseout = function () {
            oList.style.webkitAnimationPlayState = BASE_CONF.disabled ? "paused" : "running";
        }

        // 改变时候，重新计算布局
        window.onresize = Utility.setLayout;

    },

    // 解析和组装用户传入的参数
    parseUrlParams: function () {
        let userSearchObj = this.parseURL(window.location.search);
        Object.assign(BASE_CONF, userSearchObj);

        // 参数的一些设置
        BASE_CONF.user_id = BASE_CONF.user_id ? BASE_CONF.user_id : BANG_ID;
        oList.style.webkitAnimationPlayState = BASE_CONF.disabled ? "paused" : "running";
        BASE_CONF.name ? (oUserName.innerText = decodeURIComponent(BASE_CONF.name)) : this.getUserInfo();
        BASE_CONF.fans ? this.formatFans(BASE_CONF.fans) : this.getUserFans();
    },

    // 设置布局
    setLayout: function () {
        // 判断是否竖屏
        let clientWidth = document.documentElement.clientWidth;
        let clientHeight = document.documentElement.clientHeight;
        let isPortrait = clientHeight - clientWidth > 0 ? true : false;
        Utility.fontSizeAuto(clientWidth);
        if (!isPortrait) {
            oContent[0].style.width = parseInt(clientHeight * 0.75) + 'px';
        }
    },

    // 设置字体
    fontSizeAuto: function (viewportWidth) {
        //750是原始设计图大小
        if (viewportWidth > 750) { viewportWidth = 750; }
        if (viewportWidth < 375) { viewportWidth = 375; }
        document.documentElement.style.fontSize = viewportWidth / 7.5 + 'px';
    },



    // 获取用户信息
    getUserInfo: function () {
        this.ajax({
            url: `${BASE_URL}/x/space/acc/info`,    // 请求地址
            data: {
                'mid': BASE_CONF.user_id
            },   // 传输数据
            success: function (res) { // 请求成功的回调函数
                // console.log(res);
                if (res.code === 200) {
                    oUserName.innerText = res.data.name;
                } else {
                    oUserName.innerText = '有异常的账号';
                }
            },
            error: function (error) { // 请求失败的回调函数
                console.log(res);
            }
        });
    },

    // 获取用户粉丝数
    getUserFans: function () {
        this.ajax({
            url: `${BASE_URL}/x/relation/stat`,    // 请求地址
            data: {
                'vmid': BASE_CONF.user_id
            },   // 传输数据
            success: function (res) { // 请求成功的回调函数
                if (res.code === 200) {
                    let follower = res.data.follower;
                    Utility.formatFans(follower)
                    Utility.fansTimer();
                } else {
                }
            },
            error: function (error) { // 请求失败的回调函数
                console.log(res);
            }
        });
    },

    // 定时器
    fansTimer: function () {
        clearTimeout(timer);
        timer = setTimeout(() => {
            Utility.getUserFans();
        }, timeVal);
    },

    // 格式化粉丝
    formatFans: function (follower) {

        if (follower >= lv.zero && follower < lv.one) {
            tempColor = '8d9da7';//灰色
        } else if (follower >= lv.one && follower < lv.two) {
            tempColor = 'ffffff';//白色
        } else if (follower >= lv.two && follower < lv.three) {
            tempColor = 'ebce67';//金色
        } else if (follower >= lv.three) {
            tempColor = 'ff5757';//番茄色 eb6767
        }
        BASE_CONF.color = BASE_CONF.color ? BASE_CONF.color : tempColor;
        Utility.setColor();
        oUserFans.innerText = (parseInt(follower)).toLocaleString("en-US")
    },

    // 设置颜色
    setColor: function () {
        let showColor = `#${BASE_CONF.color || 'ebce67'}`;
        document.documentElement.style.setProperty('--mainColor', showColor);
        // UserLink
        oUserLink.setAttribute("href", `https://space.bilibili.com/${BASE_CONF.user_id}?src=axihe.com`);
    },

    // AJAX的封装
    ajax: function (params) {
        //创建xhr对象
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        //异步接受响应
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    params.success && params.success(data);
                } else {
                    params.error && params.error({
                        message: '超时'
                    });
                }
            }
        }
        //发送请求
        var formatData = Utility.formatParams(params.data);
        let targetUrl = params.url + '?' + formatData;
        xhr.open('get', targetUrl, true);
        xhr.send();
    },

    // 格式化参数
    formatParams: function (data) {
        var arr = [];
        for (var name in data) {
            arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        };
        return arr.join('&');
    },

    // 格式化URL
    parseURL: function (search) {
        let seg = search.replace(/^\?/, '').split('&');
        let tempObj = {};
        let tempVal;
        seg.forEach(element => {
            tempVal = element.split('=');
            tempObj[tempVal[0]] = tempVal[1]
        });
        return tempObj;
    },

    // baidu统计
    baidu: function () {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?fbfcdf49584643f17d3adc10a6cf9e13";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
    },

    // 弹幕设置
    formatBarrage: function () {
        let texts = [
            // 1
            '我也就看了3000遍', '恭喜你发现了镇站之宝', 'UP祝蓄力中', '不就是膝盖么，拿去吧', '为UP主打call', '打开了新世界的大门', '前方高能', '此生无悔入B站', '前方美颜暴击', '太好看啦~',
            '66666', '颜值UP主', '牛X', '感谢所有', '光环', '给大佬递茶', '献上膝盖', '镇站之宝', '哔哩哔哩 ( ゜- ゜)つロ 乾杯~',
            // 2
            '喜欢UP主', '再刷亿遍', '震惊，UP主竟然。。。', '一起多人运动', '我也是这样', '赞同UP主', '真是妙啊！！！', '强悍', '我从未见过如此厚颜无耻之人！', '前方高能提醒', '太好看~', 'UP主后面是什么',
            '233333', '牛X', '感谢我自己', '正道之光', '颜值在线中', '献上三连', '先投币再看', '高能警告~',

            // 3
            'UP主脸呢?', '终于更新啦', '下次一定',
            '三连三连', 'B站颜值最高', '哈哈哈', '住口！！！', '笑死我了', '真香', '震惊',
            '我太难了~', '学到了', '大佬', '秀儿，你坐下', '666', '啥情况？', '等待中....',
            '太有才了', 'UP人才啊', 'haohaohoa~',
            // 1
            '我也就看了3000遍', '恭喜你发现了镇站之宝', 'UP祝蓄力中', '不就是膝盖么，拿去吧', '为UP主打call', '打开了新世界的大门', '前方高能', '此生无悔入B站', '前方美颜暴击', '太好看啦~',
            '66666', '颜值UP主', '牛X', '感谢所有', '光环', '给大佬递茶', '献上膝盖', '镇站之宝', '哔哩哔哩 ( ゜- ゜)つロ 乾杯~',

        ]
        for (let index = 0; index < oBarItem.length; index++) {
            const element = oBarItem[index];
            element.innerText = texts[index];
        }

    }
}
Utility.init();
