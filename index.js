const fs  = require("fs")
const events = require("events")
var login = require("facebook-chat-api")

const download = require("./download")

var credentials = JSON.parse(fs.readFileSync("./server_credentials.json"))
credentials = credentials[0]
var email = credentials["username"]
var psswd = credentials["password"]

class Sender {

    constructor(api, threadID, parallel=5) {
        this.status = new events.EventEmitter()
        this.api = api
        this.threadID = threadID
        this.files_to_send = []
        this._done = false
        this.parallel = parallel
        this._theads_done=0
        this._await_finish(this)
     
        for (var i=0; i<parallel; i++){
            this._send_sync(this)
        }
    }

    send(filename) {
        this.files_to_send.push(filename)
    }
    
    done() {
        this._done = true
    }

    _await_finish(context) {
        if (context._theads_done == context.parallel) {
            context.api.sendMessage({
                body: "done"
            }, context.threadID)
        }
        else {
            setTimeout(() => {context._await_finish(context)}, 1000)
        }
    }

    _send_sync(context) {
        var filename = context.files_to_send.pop()

        if (filename == undefined) {
            if (context._done) {
                context._theads_done++
            } else {
                setTimeout(() => {context._send_sync(context)}, 1000)
            }
            return
        }

        console.log("Sending: " + filename)
        context.api.sendMessage({
            body: "",
            attachment: fs.createReadStream(filename)
        }, context.threadID, (err) => {
            if (err) {
                context.status.emit("error", [err.message])
            } else {
                context._send_sync(context)
            }
        })
    }
}

login({email: email, password: psswd}, (err, api) => {
    
    if(err) return console.error(err);

    api.listen((err, event) => {
        
        var sendMessage = function(msg) {
            api.sendMessage({
                body: msg
            }, event.threadID)
        }
        
        if (event == undefined) {
            return
        }
        
        var sender = new Sender(api, event.threadID)
        sender.status.on("error", (msg) => {
            sendMessage(msg)
        })
        
        var url = event.body
        console.log(url)

        download.shardedDownload(url, event.threadID, (dwnld, err) => {
            
            if (err) {
                sendMessage(err.message)
                return
            }

            dwnld.on("info", (msg) => {
                sendMessage(msg)
            })

            dwnld.on("file", (filename) => {
                console.log("Got: " + filename)
                sender.send(filename)
            })

            dwnld.on("end", () => {
                sender.done()
            })
        })

    });

});