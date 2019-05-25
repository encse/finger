let node.js run on ports under 1024:
setcap 'cap_net_bind_service=+ep' /usr/bin/node


2015 answer: nearly every Linux distro comes with systemd, which means forever, monit, etc are no longer necessary - your OS already handles these tasks.

Make a myapp.service file (replacing 'myapp' with your app's name, obviously):

[Unit]
Description=My app

[Service]
ExecStart=/var/www/myapp/app.js
Restart=always
User=nobody
# Note Debian/Ubuntu uses 'nogroup', RHEL/Fedora uses 'nobody'
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/var/www/myapp

[Install]
WantedBy=multi-user.target
Note if you're new to Unix: /var/www/myapp/app.js should have #!/usr/bin/env node on the very first line.

Copy your service file into the /etc/systemd/system.

Start it with systemctl start myapp.

Enable it to run on boot with systemctl enable myapp.

See logs with journalctl -u myapp




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