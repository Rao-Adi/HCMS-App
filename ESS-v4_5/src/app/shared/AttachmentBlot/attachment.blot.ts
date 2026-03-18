import Quill from 'quill';

// 1️⃣ Get the base class
const BlockEmbed = Quill.import('blots/block/embed') as any;

// 2️⃣ Create your custom embed
export class AttachmentBlot extends BlockEmbed {
  static blotName = 'attachment';     // used in insertEmbed()
  static tagName = 'div';              // HTML tag
  static className = 'ql-attachment';  // CSS class

  static create(value: any) {
    const node = super.create();

    node.setAttribute('data-url', value.url);
    node.setAttribute('data-name', value.name);
    node.setAttribute('data-size', value.size);

    node.innerHTML = `
      📎 <a href="${value.url}" target="_blank">${value.name}</a>
      <span class="size">(${value.size})</span>
    `;

    return node;
  }

  static value(node: HTMLElement) {
    return {
      url: node.getAttribute('data-url'),
      name: node.getAttribute('data-name'),
      size: node.getAttribute('data-size'),
    };
  }
}

// 3️⃣ Register it ONCE
Quill.register(AttachmentBlot);
