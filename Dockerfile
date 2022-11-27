FROM node:16.6 as frotzbuilder
RUN apt update
#RUN apt-get install -y wget curl git make gcc  libncurses5-dev sudo zip
RUN apt-get install -y wget curl git make gcc sudo zip
WORKDIR /tmp
RUN git clone https://github.com/DavidGriffith/frotz.git
RUN cd frotz && make dfrotz 

# Stage to build JavaScript deps
FROM node:16.6 AS builder
WORKDIR /
COPY package*.json ./
RUN npm install

# Stage to run the app
FROM node:16.6 AS runner
WORKDIR /usr/src/app
COPY . .
COPY --from=builder /node_modules node_modules
COPY --from=frotzbuilder /tmp/frotz/dfrotz /usr/bin/dfrotz
CMD [ "npm", "run", "service" ]
