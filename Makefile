NAME=cbrs-api
build:
	docker build -t express .
	touch $@
run:
	@read -p "Enter a name for this web app (it will create folders on /var/<name>): " name; \
	echo "$$name" > .name
	@read -p "Enter a port for this web app: " port; \
	echo "$$port" > .port
	sudo mkdir -p /var/express/$$(cat .name);
	docker run \
		--restart always \
		--mount type=volume,dst=/usr/src/app,volume-driver=local,volume-opt=type=none,volume-opt=o=bind,volume-opt=device=/var/express/$$(cat .name) \
		-p $$(cat .port):80 --name=$$(cat .name) --hostname=$$(cat .name) -e "hostname=$$(cat .name)" \
		-d express
	rm .port
	rm .name
test:
	@read -p "Enter a name for this web app:" name; \
	echo $$name > .name
	echo $$(cat .name)
