FROM node:10.16.3-alpine

ARG private_pem
ENV PRIVATE_PEM=${private_pem}

WORKDIR /Users/jamunoz/repos/queue-manager

COPY . .

RUN npm install

EXPOSE 3000

CMD npm dev
