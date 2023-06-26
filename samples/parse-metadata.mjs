import { default as Asciidoctor } from "asciidoctor";

let asciidoctor = Asciidoctor();

const docString = `
= XXXXXXX
:tags: foo,bar  
:category: x

这里是preamble

== Sidebar block!!!!!!!

A sidebar can be titled and contain any type of content such as source code and images.

.Sidebar
----
.Optional title of sidebar
****
Sidebars are used to visually separate short, auxiliary bits of content that supplement the main text.
****
----

.Optional title of sidebar
****
Sidebars are used to visually separate short, auxiliary bits of content that supplement the main text.
****

=== subsection

sss222

`;

let doc = asciidoctor.load(docString);

console.log(doc.getDoctitle());
console.log(doc.getTitle());
console.log(doc.getDocumentTitle());

let blocks = doc.getBlocks();

let firstBlock = blocks[0];
let secondBlock = blocks[1];

// console.log("---------------");
// console.log(firstBlock.convert());
// console.log("---------------");
// console.log(firstBlock.getContent());
// console.log("---------------");
// console.log(firstBlock.getLevel());
// console.log("---------------");
// console.log(firstBlock.getTitle());
// console.log(firstBlock.hasTitle());
// console.log("-------------------------------------------");

// console.log(secondBlock.getTitle());
// console.log("---------------");
// console.log(secondBlock.getLevel());

let sections = doc.getSections();
console.log(sections.length);

let firstSection = sections[0];

console.log(firstSection.getId());
console.log(firstSection.getTitle());

console.log(firstSection.getSections()[0].getTitle());
