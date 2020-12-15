// Require packages and set the port
const routes = require('./routes/routes');
const express = require('express');
const port = 8000;
const bodyParser = require('body-parser');
const request = require('request-promise');
const randomUseragent = require('random-useragent');
const randomip = require('random-ip');
const http = require('http');
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
router.get('/',function(req,res){
    ip = randomip('192.168.1.0', 24)
    res.sendFile(path.join(__dirname+'/index.html'));
});

router.post("/api/test", (req, res) => {
    res.send({
        code : 0,
        message: 'Test ok',
        data: {}
    });
})

router.post('/api/searchv2', (req, res) => {
    var options = {
        url: 'https://masothue.vn/Search?q='+req.body.q+'&type='+req.body.type+'&force-search=1&token=7TCIW1AxKo',
        headers: {
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        method: "GET",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        res.send({
            code : 1,
            message: 'Success',
            data: progressDataHtml(body)
        });
    }).catch(error => { 
        console.log("error: "+ error.message)
        useAgent = randomUseragent.getRandom()
        console.log("change useAgent to ", useAgent)
        res.send({
            code : 0,
            message: 'Error',
            data: {}
        });
    })
})

function progressDataHtml(body){
    var res = {
        success: 0,
        mst: "",
        name: "",
        status: ""
    }
    const dom = new JSDOM(body)
    var el = dom.window.document.querySelector("title");
    var data = el.textContent
    console.log(data)
    var dataArray = data.split("-");
    if(dataArray.length > 0)
    {
        var mst = dataArray[0].trim()
        if(validation.isNumber(mst))
        {
            res.success = 1
            res.mst = mst
            if(dataArray.length > 1)
            {
                res.name = dataArray[1].trim()
            }
        }
        
    }
    return res
}

var validation = {
    isEmailAddress:function(str) {
        var pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return pattern.test(str);  // returns a boolean
    },
    isNotEmpty:function (str) {
        var pattern =/\S+/;
        return pattern.test(str);  // returns a boolean
    },
    isNumber:function(str) {
        var pattern = /^\d+$/;
        return pattern.test(str);  // returns a boolean
    },
    isSame:function(str1,str2){
        return str1 === str2;
    }
};   


router.post('/api/search', (req, res) => {
    var params = {  
        q: req.body.q,
        type: req.body.type,
        token: "NOn9sval2X"
    };
    var options = {
        url: 'http://masothue.vn/Ajax/Search',
        headers: {
            'host': ip.toString(),
            'proxy': "139.99.122.37",
            'port':80,
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Connection': 'keep-alive'
        },
        // body: JSON.stringify(params),
        form: params,
        method: "POST",
    };
    console.log(options)
    request(options)
    .then( (body) =>  { 
        var r = JSON.parse(body)
        console.log(r); 
        res.send({
            code : 1,
            message: 'Success',
            data: progressData(r)
        });
    }).catch(error => { 
        console.log(error.message)
        res.send({
            code : 0,
            message: 'Error',
            data: {}
        });
    })
});

function progressData(data) {
    var res = {
        success: 0,
        mst: "",
        name: ""
    }
   if(data.success == 1)
   {
       res.success = 1
       var url = data.url
       var dataArray = url.replace("/", "").split("-");
       if(dataArray.length > 0)
       {
            res.mst = dataArray[0]
            var i = 1
            while(i < dataArray.length)
            {
                res.name += capitalizeFirstLetter(dataArray[i]) + " "
                i++
            }
       }
   }
   return res
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
  
 
// Start the server
app.use('/', router);
app.use(express.static(__dirname + '/css'));
const server = app.listen(port, (error) => {
    if (error) return console.log(`Error: ${error}`);
 
    console.log(`Server listening on port ${server.address().port}`);
});