// Require packages and set the port
const routes = require('./routes/routes');
const express = require('express');

const bodyParser = require('body-parser');
const request = require('request-promise');
const randomUseragent = require('random-useragent');
const randomip = require('random-ip');
const http = require('https');
const fs = require('fs');
const app = express();
const router = express.Router();
const path = require('path');
const DomParser = require('dom-parser');
const jsdom = require("jsdom");
const { json } = require('body-parser');
const { JSDOM } = jsdom;
const parser = new DomParser();
// Use Node.js body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

var useAgent = randomUseragent.getRandom()
var ip = randomip('192.168.1.0', 24)
// router.get('/',function(req,res){
//     ip = randomip('192.168.1.0', 24)
//     res.sendFile(path.join(__dirname+'/index.html'));
// });

router.post("/api/test", (req, res) => {
    res.send({
        code : 0,
        message: 'Test ok',
        data: {}
    });
})
router.get("/",(req, res) => {
    res.send("Welcome to TPMovie API")

} )
////////// HELPER ////////////////////////////

function createResponse(data, message, isSucces) {
    return {
        isSuccess : isSucces,
        message: message,
        data: data
    }
}

////////////// API ///////////////////////////
router.post('/api/hhkungfu/list', (req, res) => {
    var urlPage = "https://www.hhkungfu.tv/"
    if (req.body.urlPage != null) {
        urlPage = decodeURI(req.body.urlPage)
       
    }
    gethhkungfulist(urlPage, data => {
        res.send(createResponse(data,"Success", true))
    }, err => {
        console.log("error: "+ err.message)
        res.send(createResponse({}, "error", false));
    })
})

router.post('/api/hhkungfu/detail', (req, res) => {
    var options = {
        url: req.body.url,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        const dom = new JSDOM(body)
        var url = dom.window.document.querySelector("div.btn-group").querySelector("button").getAttribute("onclick").replace("location.href='","").replace("'","");
        var contentFilm = dom.window.document.querySelectorAll('p.noidung');
        var arrContent = []
        contentFilm.forEach(ele => {
            arrContent.push(ele.textContent)
        })
        var options = {
            url: url,
            headers: {
                'user-agent': useAgent,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            method: "GET",
        };
        console.log(options)
        request(options).then( (body2) =>  { 
            var result = []
            const dom2 = new JSDOM(body2)
            var _new = false
            var button = dom2.window.document.querySelectorAll('button.button_movie');
            
            button.forEach((ele, index) => {
                if(ele.getAttribute('onclick').includes('tap_moi()')) {
                    _new = true
                }
                var newEpisode = parseInt(ele.getAttribute("id"));
                var newEpisodeString = newEpisode < 10 ? "0"+newEpisode : newEpisode
                const reLink = new RegExp("link1_"+newEpisodeString+".*");
                var myArrayLink = body2.match(reLink);
                if(myArrayLink.length > 0) {
                    var link = myArrayLink[0];
                    console.log(link)
                    let id = getLastPath(link);
                    if(link.includes('fileone')) {
                        result.push({
                            episode : newEpisode,
                            id: id,
                            link : "https://fileone.tv/v/"+id,
                            isNew : _new,
                            type: "fileone"
                        })
                    }
                    else if(link.includes('dailymotion')){
                        result.push({
                            episode : newEpisode,
                            id : id,
                            link : "https://www.dailymotion.com/embed/video/"+id,
                            isNew : _new,
                            type: "dailymotion"
                        })
                    }
                    else if(link.includes('fembed')){
                        result.push({
                            episode : newEpisode,
                            id : id,
                            link : "https://www.fembed.com/v/"+id,
                            isNew : _new,
                            type: "dailymotion"
                        })
                    }
                }
            })
            res.send(createResponse({
                episodes: result,
                contents: arrContent
            }, "Success", true));
        }).catch(error => { 
            console.log("error: "+ error.message)
            res.send(createResponse({}, "error", false));
        })
    }).catch(error => { 
        console.log("error: "+ error.message)
        createResponse({}, "error", false);
    })
})

function gethhkungfulist(url, complete, error){
    console.log(url)
    var options = {
        url: url,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        complete(progressDataList(body))
    }).catch(error => { 
        error(error)
    })
}


function progressDataList(body) {
    var data = []
    const dom = new JSDOM(body)
    var el = dom.window.document.querySelectorAll("div.blog-post");
    el.forEach(element => {
        var url = element.querySelector("div.post-image-wrap").querySelector("a.post-image-link").getAttribute('href');
        var poster = element.querySelector("div.post-image-wrap").querySelector("img.post-thumb").getAttribute('src');
        var name = element.querySelector("div.post-info").querySelector("h2.post-title").querySelector("a").textContent;
        data.push({
            url : url,
            poster: poster,
            name: name,
            picTag : ""
        })
    });
    var urlPage = dom.window.document.querySelector("a.blog-pager-older-link").getAttribute('href');
    console.log(data)
    var res = {
        title: 'Hot',
        urlPage : urlPage,
        data : data,
        pageType : 'hhkungfu'
    }
    return [res]
}



router.post("/api/hhtq/list", (req, res) => {
    gethhtqlist(data => {
        res.send(createResponse(data,"Success", true));
    }, err => {
        console.log("error: "+ err.message)
        res.send("");
    })
   
})
router.post("/api/hhtq/detail", (req, res) => {
    const host = 'https://hhtq.net'
    var options = {
        url: req.body.url,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        const dom = new JSDOM(body)
        var content = dom.window.document.querySelector("span.sketch.content").textContent;
        var episode = dom.window.document.querySelector('div#playlist1').querySelector('ul.myui-content__list').querySelectorAll('li');
        var episodeArray = []
        episode.forEach(ele => {
            var aTag = ele.querySelector('a');
            var link = aTag.getAttribute('href');
            var newEpisode = aTag.textContent;
            episodeArray.push({
                episode : parseInt(newEpisode) ?? 0,
                id: host+link+newEpisode,
                link : host + link,
                isNew : false,
                type: "hhtq"
            });
        })
        
        res.send(createResponse({
            episodes: episodeArray,
            contents: [content]
        },"Success", true));

    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send("");
    })
})


function gethhtqlist(complete, error){
    const host = 'https://hhtq.net'
    var options = {
        url: host,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        var result = []
        const dom = new JSDOM(body)
        var panel = dom.window.document.querySelectorAll("div.myui-panel.myui-panel-bg");
        panel.forEach(ele => {
            let title = ele.querySelector("div.myui-panel_hd").querySelector('h3.title').textContent;
            var vodlist = ele.querySelector('ul.myui-vodlist').querySelectorAll('li');
            var vodArray = []
            vodlist.forEach(vod => {
                var linkElement = vod.querySelector('a');
                var link = linkElement.getAttribute('href');
                var poster = linkElement.getAttribute('data-original');
                var picTag = linkElement.querySelector('span.pic-tag.pic-tag-top').textContent;
                var name = vod.querySelector('div.myui-vodlist__detail').querySelector('a').textContent
                vodArray.push({
                    url : host+link,
                    poster: host+poster,
                    name: name,
                    picTag : picTag
                })
            })
            result.push({
                title : title,
                urlPage: "",
                data : vodArray,
                pageType : 'hhtq'
            })
        })
        complete(result)

    }).catch(error => { 
        error(error)
    })
}

router.post("/api/hhtq/getepisode", (req, res) => {
    const host = 'https://hhtq.net'
    var options = {
        url: req.body.url,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        var playerArray = body.match(/player_aaaa={.*}/);
        if(playerArray.length > 0){
            var jsonConfig = playerArray[0].match(/{.*}/)[0];
            var jsonObject = JSON.parse(jsonConfig);
            var result = {}
            if(jsonObject.url.includes('dailymotion')) {
                result = {
                    url: jsonObject.url,
                    id: getLastPath(jsonObject.url),
                    type: "dailymotion"
                }
            }
            else  if(jsonObject.url.includes('fembed')) {
                result = {
                    url: jsonObject.url,
                    id: getLastPath(jsonObject.url),
                    type: "fembed"
                }
            }
            else {
                result = {
                    url: jsonObject.url,
                    id: "",
                    type: "normal"
                }
            }
            res.send(createResponse(result,"Success", true));
        }
    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send("");
    })
})


router.post("/api/common/list", (req, res) => {
    gethhkungfulist("http://hhkungfu.tv/",hhkungfu => {
        gethhtqlist(hhtq => {
            var result = hhkungfu.concat(hhtq)
            res.send(createResponse(result,"Success", true))
        }, error => {
            console.log("error: "+ error.message)
        res.send("");
        })
    }, error => {
        console.log("error: "+ error.message)
        res.send("");
    })
})


///////////////// ---- player
function getLastPath(url) {
    const _url = url.replace(/['"]+/g, '')
    var array = _url.match(/[^\/]+(\w(?=\?))|(\b(\w+)$)/);
    if(array.length > 0)
    {
        return array[0]
    }
    return ""
}

router.post("/api/fembed", (req, res) => {
    var host = "https://www.fembed.com/api/source/"
    var options = {
        url: host+req.query.id,
        headers: {
            'user-agent': useAgent,
            'referer': 'https://dutrag.com/',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "POST",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        var object = JSON.parse(body);
        res.send(createResponse(object.data, "Success", true))
    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send("");
    })
})


router.post("/api/fileone", (req, res) => {
    var options = {
        url: req.body.url,
        headers: {
            'user-agent': useAgent,
            'referer': 'https://www.hhkungfu.tv/',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        const dom = new JSDOM(body)
        var el = dom.window.document.querySelector("video#my-video").querySelectorAll("source");
        if(el.length > 0) {
            res.send(createResponse({
                url : "https:"+el[0].getAttribute('src')
            },"Success", true));
        }
    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send("");
    })
})

router.get('/api/dailymotion', (req, res) => {
    var options = {
        url: 'https://www.dailymotion.com/embed/video/'+req.query.id,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        console.log(body)
        progressDataM3u8PlayList(body, res)
    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send("");
    })
})

function progressDataM3u8PlayList(body, res){
    var myArray = body.match(/window.__PLAYER_CONFIG__\s=\s{.*}/)
    if(myArray.length > 0) {
        var jsonString = myArray[0].replace(" ", "").replace("window.__PLAYER_CONFIG__=", "");
        var jsonObject = JSON.parse(jsonString);
        console.log(jsonObject)
        var qualities = jsonObject.metadata.qualities.auto
        if (qualities.length > 0) {
            getM3u8(qualities[0].url, res)
        }
    }
}
function getM3u8(url, res) {
    var options = {
        url: url,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        res.send(body);
    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send("");
    })
}






  
 
// Start the server
app.use('/', router);
const port = process.env.PORT || 8000;
const host = process.env.HOST || '::';
app.use(express.static(__dirname + '/css'));
const server = app.listen(port, host, (error) => {
    if (error) return console.log(`Error: ${error}`);
 
    console.log(`Server listening on port ${server.address().port}`);
});