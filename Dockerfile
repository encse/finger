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
RUN apt update
RUN apt-get install -y locales &&\
    sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    dpkg-reconfigure --frontend=noninteractive locales && \
    update-locale LANG=en_US.UTF-8
ENV LANG en_US.UTF-8 
COPY . .
COPY --from=builder /node_modules node_modules
COPY --from=frotzbuilder /tmp/frotz/dfrotz /usr/bin/dfrotz
CMD [ "npm", "run", "service" ]
