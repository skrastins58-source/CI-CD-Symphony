FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
  curl git unzip xz-utils nginx \
  && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/flutter/flutter.git /flutter
ENV PATH="/flutter/bin:/flutter/bin/cache/dart-sdk/bin:${PATH}"
RUN flutter doctor

WORKDIR /app
COPY . /app

RUN flutter config --enable-web && \
    flutter pub get && \
    flutter build web --release

RUN rm -rf /usr/share/nginx/html/* && \
    cp -r build/web/* /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
