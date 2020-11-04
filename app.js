// Require packages and set the port
const routes = require('./routes/routes');
const express = require('express');
const port = 80;
const bodyParser = require('body-parser');
const request = require('request-promise');
const randomUseragent = require('random-useragent');
const randomip = require('random-ip');
const http = require('http');
const fs = require('fs');
const app = express();
const router = express.Router();
const path = require('path');
// Use Node.js body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

var useAgent = ""
var ip = ""
router.get('/',function(req,res){
    useAgent = randomUseragent.getRandom()
    ip = randomip('192.168.1.0', 24)
    res.sendFile(path.join(__dirname+'/index.html'));
});


router.post('/api/search', (req, res) => {
    var params = {  
        q: req.body.q,
        type: req.body.type
    };
    var options = {
        url: 'https://masothue.vn/Ajax/Search',
        headers: {
            'Host': ip.toString(),
            'user-agent': useAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
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