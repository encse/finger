
# A tribute to the finger protocol
I wanted to something historycal, and set up a simple `finger` service on my server. As finger is totally outdated today due to security and privacy concerns, I decided to implement something very simple that can still the reminiscence of the internet of the 1980's.

Finger used to have a feature to show the contents of the user's `.plan` and `.project` folders. Today's equivalent of this could be to show the recent activity on social sites. I decided to go with twitter.

I set it up so that it works on the traditional finger port (79). It's not compliant to RFC 1288, as it is just my server, with a single user. It's more like an auto response when somebody connects to it.

We live in the 21th century, and everything is on the the web nowadays, so I added a second access point and exposed everything on websocket as well. Now if you open  the developer window on my website you see the same message dumped into the console.

## Setting it up
Run `npm install` to download dependencies.

Create a file `config.js` with the following content:

```
module.exports = {
    twitter_auth: {
        consumer_key: '...',
        consumer_secret: '...',
        access_token_key: '...',
        access_token_secret: '...',
    },
    twitter_user: 'encse',
    finger_port: 79,
    websocket_port: 7979
}
```

You get the `twitter_auth` tokens by registering a developer account and creating an app at https://developer.twitter.com/. 


Now test it with

```
node app.js
finger @localhost
```

You can also try it in the browser bby opening the attached `index.html` file.

### Setting up as service (on Ubuntu at least)

Copy the `finger.service` file to `/etc/systemd/system`, adjust paths to `app.js` and working directory properly.

Add privileges to `/usr/local/bin/node` so that it can access ports under 1024 (in our case 79, which is the finger port).

```
setcap 'cap_net_bind_service=+ep' /usr/local/bin/node
```


Start the service with
```
systemctl start myapp
```


Enable it to run on boot with 
```
systemctl enable myapp
```

Now you can try it locally with

```
finger @localhost
```
If something goes wrong, check the logs with

```
journalctl -u myapp
```

### Set up Nginx as a wss proxy

If you want to access the websocket through ssl, you need set up a proxy that terminates the SSL connection and forwards the requests to the finger service.

Supposed that the `websocket_port` is set to the 7979 in your `config.js` adjust your nginx config file like this: 

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
