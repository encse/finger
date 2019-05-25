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


