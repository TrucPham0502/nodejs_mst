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
router.post('/api/films', (req, res) => {
    var urlPage = "https://www.hhkungfu.tv/"
    if (req.body.urlPage != null) {
        urlPage = decodeURI(req.body.urlPage)
       
    }
    console.log(urlPage)
    var options = {
        url: urlPage,
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        res.send(createResponse(progressDataList(body),"Success", true))
    }).catch(error => { 
        console.log("error: "+ error.message)
        res.send(createResponse({}, "error", false));
    })
})

router.post('/api/filmdetail', (req, res) => {
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
                    var link = myArrayLink[0].replace("\"", "").replace(/['"]+/g, '')
                    console.log(link)
                    if(link.includes('fileone')) {
                        const episodeUrlArray = link.match(/\b(\w+)$/);
                        if(episodeUrlArray.length > 0) {
                            var id = episodeUrlArray[0]
                            result.push({
                                episode : newEpisode,
                                id: id,
                                link : "https://fileone.tv/v/"+id,
                                isNew : _new,
                                type: "fileone"
                            })
                        }
                    }
                    else if(link.includes('dailymotion')){
                        var episodeUrl = link.split("?")[0]
                        const episodeUrlArray = episodeUrl.match(/\b(\w+)$/);
                        if(episodeUrlArray.length > 0) {
                            var id = episodeUrlArray[0]
                            result.push({
                                episode : newEpisode,
                                id : id,
                                isNew : _new,
                                type: "dailymotion"
                            })
                        }
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
        })
    });
    var urlPage = dom.window.document.querySelector("a.blog-pager-older-link").getAttribute('href');
    console.log(data)
    var res = {
        urlPage : urlPage,
        data : data
    }
    return res
}


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