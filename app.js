const API = "http://127.0.0.1:5000/api";
const mensagem = document.querySelector("#mensagem");
let paginaAtual = "livros";

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(API + caminho, {
    ...opcoes,
    headers: {"Content-Type": "application/json", ...opcoes.headers}
  });
  if (!resposta.ok) {
    let erro = {erro: `Erro HTTP ${resposta.status}`};
    try { erro = await resposta.json(); } catch (_) {}
    throw new Error(erro.erro || "Falha na operação.");
  }
  return resposta.status === 204 ? null : resposta.json();
}

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? "erro" : "";
}
function elemento(tag, texto, classe) {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = String(texto);
  if (classe) el.className = classe;
  return el;
}
function botao(texto, acao, classe = "") {
  const b = elemento("button", texto, classe);
  b.type = "button";
  b.addEventListener("click", () => executar(acao));
  return b;
}
async function executar(acao) {
  try {
    await acao();
    avisar("Operação realizada.");
    await atualizar();
  } catch (erro) { avisar(erro.message, true); }
}
function listaVazia(pai, itens) {
  pai.replaceChildren();
  if (!itens.length) pai.append(elemento("p", "Nenhum item encontrado."));
}
function linha(pai, titulo, detalhe, acoes = []) {
  const div = elemento("div", undefined, "item");
  const info = elemento("div");
  info.append(elemento("strong", titulo), elemento("small", detalhe));
  const botoes = elemento("div", undefined, "acoes");
  acoes.forEach(b => botoes.append(b));
  div.append(info, botoes); pai.append(div);
}
async function carregarLivros() {
  const termo = document.querySelector("#busca").value.trim();
  const livros = await requisitar("/livros?busca=" + encodeURIComponent(termo));
  const pai = document.querySelector("#lista-livros"); listaVazia(pai, livros);
  for (const l of livros) linha(pai, l.titulo, `Autor: ${l.autor} | ID: ${l.id}`, [
    botao("Carrinho", () => requisitar(`/carrinho/${l.id}`, {method:"POST"})),
    botao("Favorito", () => requisitar(`/favoritos/${l.id}/alternar`, {method:"POST"}), "secundario"),
    botao("Excluir", () => requisitar(`/livros/${l.id}`, {method:"DELETE"}), "perigo")
  ]);
}
async function carregarCarrinho() {
  const itens = await requisitar("/carrinho");
  const pai = document.querySelector("#lista-carrinho"); listaVazia(pai, itens);
  for (const i of itens) linha(pai, i.livro.titulo, `Quantidade: ${i.quantidade}`, [
    botao("Remover", () => requisitar(`/carrinho/${i.livro_id}`, {method:"DELETE"}), "perigo")
  ]);
}
async function carregarFavoritos() {
  const livros = await requisitar("/favoritos");
  const pai = document.querySelector("#lista-favoritos"); listaVazia(pai, livros);
  for (const l of livros) linha(pai, l.titulo, l.autor, [
    botao("Desfavoritar", () => requisitar(`/favoritos/${l.id}/alternar`, {method:"POST"}), "secundario")
  ]);
}
async function carregarReservas() {
  const [reservas, livros] = await Promise.all([requisitar("/reservas"), requisitar("/livros")]);
  const select = document.querySelector("#livro-reserva");
  select.replaceChildren();
  for (const l of livros) {
    const op = elemento("option", l.titulo);
    op.value = l.id;
    select.append(op);
  }
  const pai = document.querySelector("#lista-reservas"); listaVazia(pai, reservas);
  for (const r of reservas) linha(pai, r.livro?.titulo || "Livro excluído", `Reservado por: ${r.nome} | ${r.status}`, [
    botao("Cancelar", () => requisitar(`/reservas/${r.id}`, {method:"DELETE"}), "perigo")
  ]);
}
async function atualizar() {
  const carregar = {livros:carregarLivros,carrinho:carregarCarrinho,favoritos:carregarFavoritos,reservas:carregarReservas};
  try {await carregar[paginaAtual]();} catch (e) {avisar(`Não foi possível acessar o servidor: ${e.message}`, true);}
}
function abrir(pagina) {
  paginaAtual = pagina;
  document.querySelectorAll(".pagina").forEach(s => s.hidden = s.id !== pagina);
  document.querySelectorAll("[data-pagina]").forEach(b => b.classList.toggle("ativo", b.dataset.pagina === pagina));
  avisar(""); atualizar();
}
document.querySelectorAll("[data-pagina]").forEach(b => b.addEventListener("click", () => abrir(b.dataset.pagina)));
document.querySelector("#form-busca").addEventListener("submit", e => {e.preventDefault(); executar(carregarLivros);});
document.querySelector("#form-livro").addEventListener("submit", e => {
  e.preventDefault(); const form = e.target;
  executar(async () => {
    await requisitar("/livros", {method:"POST",body:JSON.stringify({titulo:form.elements.namedItem("titulo").value,autor:form.elements.namedItem("autor").value})});
    form.reset();
  });
});
document.querySelector("#form-reserva").addEventListener("submit", e => {
  e.preventDefault(); const form = e.target;
  executar(async () => {
    await requisitar("/reservas", {method:"POST",body:JSON.stringify({nome:form.elements.namedItem("nome").value,livro_id:Number(form.elements.namedItem("livro_id").value)})});
    form.reset();
  });
});
atualizar();
