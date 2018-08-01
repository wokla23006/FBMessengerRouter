const fs  = require("fs")
var login = require("facebook-chat-api")

const download = require("./download")

class Sender {
    constructor(api, threadID, parallel=5) {
        this.api = api
        this.threadID = threadID
        this.files_to_send = []
        this.shard = 0
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
        context.shard++
        context.api.sendMessage({
            body: context.shard,
            attachment: fs.createReadStream(filename)
        }, context.threadID, (err) => {context._send_sync(context)})
    }

}

login({email: "mswebbot@gmail.com", password: "sakjrhkwarfkjsbh"}, (err, api) => {
    
    if(err) return console.error(err);

    api.listen((err, event) => {
        
        if (event == undefined) {
            return
        }
        
        var sender = new Sender(api, event.threadID)
        
        var url = event.body
        console.log(url)

        download.shardedDownload(url, event.threadID, (dwnld, err) => {
            
            if (err) {
                api.sendMessage({
                    body: err.message
                }, event.threadID)
                return
            }

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