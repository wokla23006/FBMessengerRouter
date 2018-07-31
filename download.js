const fs = require("fs")
const https  = require("https")
const http   = require("http" )
const EventEmitter = require('events');

const gen_shard = function(prefix, id) {
    return "data/" + prefix + id + ".txt"
}

const shardedDownload = function(url, callback, filename_prefix="shard-") {
    var downloadEvent = new EventEmitter()
    callback(downloadEvent)

    var shards_list = []
    var protocol = url.split(":")[0]
    
    switch (protocol){
        case "http":
        protocol = http
        break
        case "https":
        protocol = https
        break
        default:
        console.log("No protocol. Must be one of ['http', 'https']")
        break
    }

    var req = protocol.request(url, (res) => {
        
        var filename = gen_shard(filename_prefix, 0)
        shards_list.push(filename)
        var file = fs.createWriteStream(filename)
        
        var shard = 0
        var size = 0

        res.on("data", (chunk) => {
            file.write(chunk)
            size += chunk.length
            if (size > 20 * 1000 * 1000) {
                file.close()
                downloadEvent.emit("file", filename)
                
                size = 0
                shard++
                filename = gen_shard(filename_prefix, shard)
                file = fs.createWriteStream(filename)
            }
        })

        res.on("end", () => {
            file.close()
            downloadEvent.emit("file", filename)
            downloadEvent.emit("end")
        })

        
        res.on("error", (err) => {
            console.log(err)
        })

    })
    
    req.on("error", (err) => {
        console.log(err)
    })
    
    req.end()

}

module.exports = {
    shardedDownload: shardedDownload
}