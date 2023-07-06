import { default as Asciidoctor } from "asciidoctor";

var asciidoctor = Asciidoctor();

//global entry
CompileAsciidoc = function (text, opts = {}) {
  let doc = asciidoctor.load(text);
  let tagsText = doc.getAttribute("tags", null);

  var tags = [];
  if (tagsText != null) {
    tags = tagsText.split(/\s*,\s*/);
  }

  let attrs = doc.getAttributes();

  let result = {
    title: doc.getDoctitle(),
    tags: tags,
    date: attrs.date,
    content: doc.convert(),
    attrs: attrs,
  };

  if (opts.extractPreamble) {
    result.preamble = "";
  }

  return result;
};
