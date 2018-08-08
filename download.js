const fs = require("fs")
const path = require("path")
const https = require("https")
const http = require("http" )
const EventEmitter = require('events')

const request = require("request")
var youtubedl = require("youtube-dl")

const gen_shard = function(folder, id) {
    id = ("00000" + id).slice(-5)
    return folder + "/" + id + ".shard"
}

const shardedDownload = function(url, folder, callback) {
    
    var protocol = url.split(":")[0]
    folder = "./uploads/" + folder
    
    if (!fs.existsSync('./uploads/')) {
        fs.mkdirSync("./uploads/")
    }
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }
    
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

    if (url.indexOf("youtube.com") > -1) {
        var stream = youtubedl(url)
        var downloadEvent = chunkStream(stream, folder)
        callback(downloadEvent)
        downloadEvent.emit("info", ["Downloading youtube video..."])
        return
    }
    

    var req = protocol.request(url, (res) => {
        var downloadEvent = chunkStream(res, folder)
        callback(downloadEvent)
    })

    req.end()
}

const chunkStream = function(stream, folder) {
    
    var downloadEvent = new EventEmitter()
    var filename = gen_shard(folder, 0)
    var file = fs.createWriteStream(filename)

    
    var shard = 0
    var size = 0
    var max_size = 20 * 1000 * 1000

    stream.on("data", (chunk) => {
        size += chunk.length

        if (size > max_size) {
            
            var prev_file_name = filename
            file.write(chunk)
            file.end(() => {
                downloadEvent.emit("file", prev_file_name)
            })
            
            size = 0
            shard++
            filename = gen_shard(folder, shard)
            file = fs.createWriteStream(filename)
        } else {
            file.write(chunk)
        }
    })

    stream.on("end", () => {
        file.end(() => {
            downloadEvent.emit("file", filename)
            downloadEvent.emit("end")
        })
    })
    
    stream.on("error", (err) => {
        console.log("RESPONSE: " + err.message)
    })

    return downloadEvent
}

const getAttachment = function(url, filename, callback) {

    var base_headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.84 Safari/537.36"
    }

    var dirname = path.dirname(filename)
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname)
    }

    var file = fs.createWriteStream(filename)
    
    request({
        url: url,
        headers: base_headers
    }, (error, response, body) => {
        var fist_search_value = 'document.location.replace("'
        var second_search_value = '");'

        var new_url = body.substring(
            body.indexOf(fist_search_value),
            body.lastIndexOf(second_search_value)
        ).replace(fist_search_value, "").replace(second_search_value, "").split("\\/").join("/")
        
        console.log(new_url)
        request({
            url: new_url,
            headers: base_headers
        }, () => {
            callback(filename)
        }).pipe(file)
    })
} 

module.exports = {
    shardedDownload: shardedDownload,
    getAttachment: getAttachment
}