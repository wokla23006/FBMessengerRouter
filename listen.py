import fbchat
import requests
import threading
import queue
import os
import wget

email = "mbot.receiver@gmail.com"
psswd = "sdasdfgdsfgaf34t937hnx9027y"

email = "bernardo.covas@hotmail.com"
psswd = "uoT5f8y4johsIJDECXMBHL7j"


class Downloader(fbchat.Client):

    downloaded = []

    def _cleanFirstRequest(self, dirty_request):
        
        i = dirty_request.find("document.location.replace")
        dirty_request = dirty_request[i:]
        i = dirty_request.find('");')
        dirty_request = dirty_request[:i]
        dirty_request = dirty_request.replace('document.location.replace("', "")
        dirty_request = dirty_request.replace("\\", "")
        return dirty_request

    def onMessage(self, mid, author_id, message_object, thread_id, thread_type, ts, metadata, msg, **kwargs):
        print("Got message.")
        
        dirname = "./" + thread_id
        assert isinstance(message_object, fbchat.models.Message )

        if message_object.text == "done":
            print("Done.")
            with open(dirname + "/payload", "wb") as p:
                self.downloaded.sort()
                for download_filename in self.downloaded:
                    with open(download_filename, "rb") as f:
                        p.write(f.read())
            return

        if len(message_object.attachments) > 0:
        
            attch = message_object.attachments[0]
            assert isinstance(attch, fbchat.models.FileAttachment)
            filename = dirname + "/" + attch.name

            html_new_request = requests.get(attch.url, allow_redirects=True).text
            url = self._cleanFirstRequest(html_new_request)

            if not os.path.exists(dirname):
                os.mkdir(dirname)

            if (os.path.exists(filename)):
                os.remove(filename)

            wget.download(url, bar=None, out=filename)
            self.downloaded.append(filename)

            print(url)
            
        return

client = Downloader(email, psswd)
client.listen()