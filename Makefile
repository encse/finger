.PHONY: all build logs run

all: build

build:
	docker build -t finger-service -f Dockerfile .

run: build
	docker run --rm -d -p79:79 -p7979:7979 --name finger-service finger-service 

logs:
	docker logs --follow finger-service

stop:
	docker stop finger-service
