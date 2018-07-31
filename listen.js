const fs     = require("fs")
var login = require("facebook-chat-api")

const download = require("./download")

const handler = function(message_event) {
    var name = message_event.body
    console.log(name)

    //NOTE:(bcovas) if "shard" is in the message body
    if (name.indexOf("shard") < 0) {
        return
    }

    var n = ""
    var shard_idxs = n.match(/\d+/g).map(Number)


    download.shardedDownload(url, (shards_list) => {
        console.log("Finished.")
        console.log(shards_list)
        
        for (var i = 0; i<shards_list.length; i++) {
            console.log("Sending: " + i)
            var file = fs.createReadStream(shards_list[i])
            
            if (file.fd == undefined) {
                console.log("Error on " + shards_list[i])
                continue
            }

            api.sendMessage({
                body: "shard-" + i + "-" + shards_list.length,
                attachment: fs.createReadStream(shards_list[i])
            }, message.threadID)
        }
    })
}

login({email: "mbot.receiver@gmail.com", password: "sdasdfgdsfgaf34t937hnx9027y"}, (err, api) => {
    
    if(err) return console.error(err);

    api.listen((err, event) => {

        if (event == undefined) {
            return
        }
        
        switch (event.type) {
            case "message":
            handler(event)
            break
            default:
            break
        }

        if (event == undefined) {
            return
        }
        
        var name = message.body
        console.log(name)

        //NOTE:(bcovas) if "shard" is in the message body
        if (name.indexOf("shard") > -1) {

        }

    });

});