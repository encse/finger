FROM node:18.12 as frotzbuilder
RUN apt update
#RUN apt-get install -y wget curl git make gcc  libncurses5-dev sudo zip
RUN apt-get install -y wget curl git make gcc sudo zip
WORKDIR /tmp
RUN git clone https://github.com/DavidGriffith/frotz.git; git checkout 2.50
RUN cd frotz && make dfrotz 

# Stage to build JavaScript deps
FROM node:18.12 AS builder
WORKDIR /
COPY package*.json ./
RUN npm install

# Stage to run the app
FROM node:18.12 AS runner
WORKDIR /usr/src/app
RUN apt update
RUN apt-get install -y locales &&\
    sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# hu_HU.UTF-8 UTF-8/hu_HU.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# hu_HU ISO-8859-2/hu_HU ISO-8859-2/' /etc/locale.gen && \
    dpkg-reconfigure --frontend=noninteractive locales && \
    update-locale LANG=en_US.UTF-8
ENV LANG en_US.UTF-8 
COPY . .
COPY --from=builder /node_modules node_modules

ENV DFROTZ /usr/bin/dfrotz 
COPY --from=frotzbuilder /tmp/frotz/dfrotz $DFROTZ

CMD [ "npm", "run", "service" ]
