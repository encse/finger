
# A tribute to the finger protocol
I wanted to do something historical, and set up a simple `finger` service on my [server](https://csokavar.hu). 
As finger is totally outdated today due to security and privacy concerns, I decided to implement something very 
simple that is still the reminiscence of the internet of the 1980's.

Finger used to have a feature to show the contents of the user's `.plan` and `.project` files. Today's equivalent 
of this would be to show the recent activity on social media sites. I decided to go with twitter.

It works on the traditional finger port (79), but it's not compliant to RFC 1288, as it is just my server, with 
a single user. It's more like an auto response when somebody connects to it to TCP port.

We live in the 21st century, and everything is on the the web nowadays, so I added a second access point and 
exposed it on websocket as well. Now if you open the developer window on my website you see the same message 
dumped into the console.

```
                                      99X                                      
                                 riG   @@@   Gi;                                
                                 B@@G  @@@  @@@9                                
                                  @@@; @@@ i@@G                                 
                                   @@@:B@G,@@@                                  
                                   :@@@BBB@@@                                   
                                    ,@BBBB@@                                    
                     5M525252525253ir@BBBBBBri3225252525259i                    
                     @@@@@@@@@@@@@@@@BBBBBBB@@@@@@@@@@@@@@@@                    
                    :@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@                    
                    r@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@:                   
                    9@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@r                   
                    @@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@G                   
                    @@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@                   
                   :@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@                   
                   i@BBBBBBB@@@@@BBBBBBBBBBBBBB@@@@@BBBBBBBB@,                  
                   9@BBBBBB@BrrrG@@BBBBBBBBBBB@BirrM@@BBBBBB@i                  
                   @@BBBBB@r     ;@BBBBBBBBBB@5      @BBBBBB@G                  
                   @@BBBBB@;     :@BBBBBBBBBB@3      @@BBBBB@@                  
                  :@BBBBBBB@X;:;2@BBBB@@@@BBBB@Gr:,i@@BBBBBB@@                  
 :                i@BBBBBBBB@@@@@@B@@@@M3@@@@B@@@@@@@BBBBBBBB@;                 
 3@@@@@@@@@@@@@@@@@BBBBBBBBBBBBBB@@@Br    ,G@@@@BBBBBBBBBBBBB@@@@@@@@@@@@@@@@@@r
  :@@@@@@@@@@@@@@@@BBBBBBBBBBBBB@Gr          ;XBBBBBBBBBBBBBBB@@@@@@@G@@@@@@@B: 
    r@@@BBB; :,;:3@BBBBBBBBBBBBB@r   5B@GBBi   BBBBBBBBBBBBBBB@:     r@BB@@@r   
      B@@B@B     i@BBBBBBBBBBBBBB@@G, :9@M;,3@@BBBBBBBBBBBBBBB@r    B@@B@@9     
       r@@@@@G   B@BBBBBBBBBBBBBBB@@@@r  ;9@@@BBBBBBBBBBBBBBBB@9  5@@@@@@,      
         9@@@@@; @@BBBBBBBBBBBBBBBBBB@@@@@@BBBBBBBBBBBBBBBBBBB@B:@@@@@@2        
          ,@@@@@B@BBBBBBBBBBBBBBBBBBBBB@BBBBBBBBBBBBBBBBBBBBBBB@@@B@@@          
            5@@@@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@@i           
             :@@@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@B             
               r@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@r              
                G@BBBBBBBBB@@@@BBBBBBBBBBBBBBBBBB@@@@@BBBBBBBBB@i               
                @@BBB@@@@@@GBGB@@@@@BBBBBBBB@@@@@BBBBB@@@@@BBBB@B               
               :@@BBBGr:;@B   ;@9 ;i@BBBBBB@9r r@G   i@5 ;3@BBB@@               
               r@BBB@B   9@   3@   r@BBBBBB@G   @@   9@   i@BBBB@               
               M@BBBB@G   B   5r  ,@BBBBBBBB@9   B   G:  r@@BBBB@r              
               B@BBBBB@i          @@BBBBBBBB@@r         :@@BBBBB@X              
               @@BBBBB@@,        @@BBBBBBBBBB@@:        @@BBBBBB@@              
              :@@BBBBBB@@       9@BBBBBBBBBBBB@@       G@BBBBBBB@@              
              r@BBGBGBGB@@@@@@@@@BGBGBGBGGGBGBB@@@@@@@@@BBGGGBGBB@     
```

## Setting it up
I tried to make it simple and wrapped it in a Dockerfile. All you have to do is editing the `config.js`.
You get the `twitter_auth` tokens by registering a developer account and creating an app 
at https://developer.twitter.com/. 

Now test it with
```
./service run
```

And in a separate window:
```
finger @localhost
```
You can also try it in the browser by opening the attached `index.html` file.

### Nginx as a wss proxy

If you want to access the websocket through SSL, you need set up a proxy that terminates the 
SSL connection and forwards the requests to the finger service on localhost.

Supposed that the `websocket_port` is set to the 7979 in your `config.json` adjust your nginx 
config file like this: 

```
server {
	listen 443 ssl
  ... other settings ...

  location ~ ^/finger {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Host $host;
            proxy_set_header X-NginX-Proxy true;

            proxy_pass http://127.0.0.1:7979;
            proxy_redirect off;

            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
    }

}
```
