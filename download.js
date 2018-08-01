const fs = require("fs")
const https = require("https")
const http = require("http" )
const EventEmitter = require('events')

const gen_shard = function(folder, id) {
    return folder + "/" + id + ".shard"
}

const shardedDownload = function(url, folder, callback) {
    var downloadEvent = new EventEmitter()
    
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
        callback(null, Error("Error: No protocol. Must be one of ['http', 'https']"))
        return
    }

    callback(downloadEvent)
    
    folder = "./data/" + folder
    
    if (!fs.existsSync('./data/')) {
        fs.mkdirSync("./data/")
    }
    
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }

    var req = protocol.request(url, (res) => {
        
        var filename = gen_shard(folder, 0)

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
                filename = gen_shard(folder, shard)
                file = fs.createWriteStream(filename)
            }
        })

        res.on("end", () => {
            file.close()
            downloadEvent.emit("file", filename)
            downloadEvent.emit("end")
        })
        
        res.on("error", (err) => {
            console.log("RESPONSE: " + err.message)
        })

    })
    
    req.on("error", (err) => {
        console.log("REQUEST: " + err.message)
    })
    
    req.end()

}

module.exports = {
    shardedDownload: shardedDownload
}