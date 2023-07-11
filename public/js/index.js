function html2el(str) {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
}

async function main() {
  const data = await fetch('/dir');
  const files = await data.json();
  files.sort();
  console.log(files);

  let list = html2el('<ol></ol>');
  for (const file of files) {
    let listitem = html2el(`<li><a href="covreport.html?path=${file}">${file}</a></li>`);
    list.appendChild(listitem);
  }

  const listDiv = document.querySelector('#dir');
  listDiv.appendChild(list);
}

main();
