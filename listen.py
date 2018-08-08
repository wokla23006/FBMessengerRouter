import os
import time
import queue
import threading
import json

import wget
import fbchat
import requests

with open("./credentials.json") as c:
    credentials = json.load(c)
email = credentials["username"]
psswd = credentials["password"]

#email = "mbot.receiver@gmail.com"
#psswd = "sdasdfgdsfgaf34t937hnx9027y"

#email = "bernardo.covas@hotmail.com"
#psswd = "uoT5f8y4johsIJDECXMBHL7j"

class Downloader(fbchat.Client):

    files   = []
    threads = []

    def onMessage(self, mid, author_id, message_object, thread_id, thread_type, ts, metadata, msg, **kwargs):
        print("Got message.")
        
        dirname = "./downloads/" + thread_id
        if not os.path.exists("./downloads"):
            os.mkdir("./downloads")
        
        assert isinstance(message_object, fbchat.models.Message )

        if message_object.text == "done":
            print("Done.")
            for t in self.threads:
                t.join()

            print("Joining shards...")
            join_files(dirname, self.files)
            print("Done Joining.")
            
            self.files = []
            self.threads = []
            
            return

        if len(message_object.attachments) > 0:
            
            attch = message_object.attachments[0]
            assert len(message_object.attachments) == 1
            assert isinstance(attch, fbchat.models.FileAttachment)

            filename = dirname + "/" + attch.name

            if not os.path.exists(dirname):
                os.mkdir(dirname)

            t = threading.Thread(target=handle_attach, args=(attch.url, filename))
            t.start()
            self.threads.append(t)
            self.files.append(filename)
            
        return

def handle_attach(url, filename:str):

    def _clean_url(dirty_url: str):
        
        i = dirty_url.find("document.location.replace")
        dirty_url = dirty_url[i:]
        i = dirty_url.find('");')
        dirty_url = dirty_url[:i]
        dirty_url = dirty_url.replace('document.location.replace("', "")
        dirty_url = dirty_url.replace("\\", "")
        return dirty_url

    while True:
        try:
            dirty_url = requests.get(url, allow_redirects=True).text
        except Exception:
            print("Failed getting attatchment: " + filename + ". Retrying...")
            time.sleep(5)
            continue
        break

    url = _clean_url(dirty_url)

    while True:
        print("Downloading", filename)
        try:
            wget.download(url, bar=None, out=filename)
        except Exception:
            print("Failed downloading: " + filename + ". Retrying...")
            time.sleep(5)
            continue
        break
    print("Downloaded " + filename)

    return

def join_files(out:str, files_list: []):

    if not os.path.exists(out):
        os.makedirs(out)

    with open(out + "/payload", "wb") as p:
        files_list.sort()
        for download_filename in files_list:
            with open(download_filename, "rb") as f:
                p.write(f.read())

    return

client = Downloader(email, psswd, logging_level=0)
client.listen()