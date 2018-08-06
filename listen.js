const fs = require("fs")
const login = require("facebook-chat-api")
const download = require("./download")

var email = "mbot.receiver@gmail.com"
var psswd = "sdasdfgdsfgaf34t937hnx9027y"

email = "bernardo.covas@hotmail.com"
psswd = "uoT5f8y4johsIJDECXMBHL7j"

class ThreadHandler {
    constructor() {
        this.threads = {}
    }
    
    new_message(message){
        this._new_message(this, message)
    }

    _watcher(thread, threadID, joined_function) {
        console.log(JSON.stringify(thread))

        thread["attatchments"].sort()
        thread["downloaded"].sort()

        if  (
                thread["done"] && 
                JSON.stringify(thread["attatchments"]) == 
                JSON.stringify(thread["downloaded"])
            ) {
            var payload_name = './' + threadID + "/payload"

            if (fs.existsSync(payload_name)) {
                fs.unlinkSync(payload_name)
            }

            console.log("Joining...")
            this._join_files(thread["downloaded"], payload_name)
            joined_function()
        }
    }

    _new_message(context, message) {

        var threadID = message.threadID

        if (context.threads[threadID] == undefined) {
            context.threads[threadID] = {
                "attatchments": [],
                "downloaded": [],
                "done": false
            }
        }
        
        if (message.body == "done") {
            context.threads[threadID]["done"] = true
            context._watcher(context.threads[threadID], threadID, () => {context.threads[threadID] = []})
        } else if(message.attachments != undefined) {
            var attch = message.attachments[0]
            
            var filename = "./" + threadID + "/" + attch.filename
            context.threads[threadID]["attatchments"].push(filename)

            download.getAttachment(attch.url, filename, (filename) => {
                context.threads[threadID]["downloaded"].push(filename)
                context._watcher(context.threads[threadID], threadID, () => {context.threads[threadID] = []})
            })
        }
    }

    _join_files(files_list, payload_name) {
        files_list.sort()
        console.log(files_list)
        
        if (fs.existsSync(payload_name)) {
            fs.unlinkSync(payload_name)
        }
        
        for (var i=0; i<files_list.length; i++) {
            var data = fs.readFileSync(files_list[i])
            fs.appendFileSync(payload_name, data)
        }
    }
}

login({email: email, password: psswd}, (err, api) => {

    var handler = new ThreadHandler()
    
    if(err) return console.error(err);

    api.listen((err, event) => {
        
        if (event == undefined) {
            return
        }

        switch (event.type) {
            case "message":
            handler.new_message(event)
            break
        }
    });
});