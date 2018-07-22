const https  = require("https")
const fs     = require("fs")
const stream = require("stream")

var login = require("facebook-chat-api")
var tmp_file = "requests/request.txt"

login({email: "mswebbot@gmail.com", password: "sakjrhkwarfkjsbh"}, (err, api) => {
    if(err) return console.error(err);
 

    api.listen((err, message) => {
        //var body = JSON.parse(message.body)
        if (message == undefined) {
            return
        }
        //console.log(message)
        
        var body = message.body.split(",")
        var host = body[0]
        var path = body[1]

        console.log(host + "->" + path)
        var req = https.get(
                {
                    hostname: host, 
                    path: path, 
                    headers: {
                        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/67.0.3396.99 Chrome/67.0.3396.99 Safari/537.36"
                    }
                }, 
        (res) => {
            if (!fs.exists("requests")) {
                fs.mkdir("requests")
            }
            
            fs.writeFileSync(tmp_file, "")
            
            res.on("data", (chunk) => {
                fs.appendFileSync(tmp_file, chunk)
            })
            
            res.on("end", () => {
                console.log("Finished.")
                api.sendMessage({
                    body: "Done.",
                    attachment: fs.createReadStream(tmp_file)
                }, message.threadID)
            })
        })
        req.on("error", (err) => {
            console.log(err.message)
        })
        req.end()
    });
});