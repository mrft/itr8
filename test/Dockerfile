# syntax=docker/dockerfile:1.5
# previous line enables DOCKER_BUILDKIT !

ARG nodeVersion=16

FROM node:${nodeVersion} as itr8_on_node_generic
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
WORKDIR /home/node/itr8
RUN rm -rf node_modules package-lock.json build docs
RUN npm install --foreground-scripts=true
RUN npm audit fix


FROM node:12 as itr8_on_node12
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
# WORKDIR /home/node/itr8
# RUN rm -rf node_modules package-lock.json build docs
# RUN npm install --foreground-scripts=true
# RUN npm audit fix

FROM node:14 as itr8_on_node14
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
# WORKDIR /home/node/itr8
# RUN rm -rf node_modules package-lock.json build docs
# RUN npm install --foreground-scripts=true
# RUN npm audit fix

FROM node:16 as itr8_on_node16
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
# WORKDIR /home/node/itr8
# RUN rm -rf node_modules package-lock.json build docs
# RUN npm install --foreground-scripts=true || cat /root/.npm/_logs/*.log
# RUN npm audit fix

FROM node:18 as itr8_on_node18
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
# WORKDIR /home/node/itr8
# RUN rm -rf node_modules package-lock.json build docs
# RUN npm install --foreground-scripts=true || cat /root/.npm/_logs/*.log
# RUN npm audit fix

FROM node:19 as itr8_on_node19
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
# WORKDIR /home/node/itr8
# RUN rm -rf node_modules package-lock.json build docs
# RUN npm install --foreground-scripts=true || cat /root/.npm/_logs/*.log
# RUN npm audit fix

FROM node:20 as itr8_on_node20
ENV TERM=xterm-256color
COPY  --chown=node:node . /home/node/itr8
