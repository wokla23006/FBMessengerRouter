import fbchat

email = "mbot.receiver@gmail.com"
psswd = "sdasdfgdsfgaf34t937hnx9027y"

email = "bernardo.covas@hotmail.com"
psswd = "uoT5f8y4johsIJDECXMBHL7j"

client = fbchat.Client(email, psswd)

class Listener(fbchat.Client):

    def onMessage(self, author_id, message_object: fbchat.Message, 
                        thread_id, thread_type, **kwargs):
                        
        attatchments = message_object.attatchments

        for attatchment in attatchments:
            
            print(message_object)        
        return


client = Listener(email, psswd)
client.listen()