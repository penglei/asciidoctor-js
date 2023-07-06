.PHONY: build

build:
	@./node_modules/.bin/gulp build
#	rsync -avh build-out/* dist --delete

wasm: dist/asciidoctor/javy_wasm_asciidoctor.js
	./local/tools/javy compile -d -o build-out/wasm/asciidoctor-dynamiclink.wasm $<
	./local/tools/javy emit-provider -o build-out/wasm/provider.wasm

demo:
	@cat samples/demo.adoc | ./local/tools/wasmtime run \
		--preload javy_quickjs_provider_v1=build-out/wasm/provider.wasm \
		build-out/wasm/asciidoctor-dynamiclink.wasm
