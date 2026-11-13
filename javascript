/* ==========================================================
   1) CONFIGURAÇÕES — edite aqui
   ========================================================== */
const CONFIG = {
  whatsapp: "5538900000000",   // seu número com 55 + DDD, só números
  loja: "MSN Doces Gourmet",
  diasAntecedencia: 2          // antecedência mínima para encomendas
};

/* ==========================================================
   2) PRODUTOS — adicione, edite ou apague blocos { ... }
   - nome:      nome do doce (não repita nomes)
   - categoria: cria o filtro automaticamente
   - preco:     use ponto, ex.: 4.5
   - unidade:   "unidade", "pote", "caixa com 12"...
   - minimo:    quantidade mínima por pedido (opcional)
   - imagem:    caminho da foto, ex.: "img/brigadeiro.jpg" (opcional)
   - bio:       descrição curta do produto
   ========================================================== */
const PRODUTOS = [
  { nome: "Brigadeiro Gourmet", categoria: "Brigadeiros", preco: 4.5, unidade: "unidade", minimo: 10, imagem: "", bio: "Chocolate belga cremoso, enrolado no granulado fino." },
  { nome: "Beijinho de Coco", categoria: "Brigadeiros", preco: 4.0, unidade: "unidade", minimo: 10, imagem: "", bio: "Coco fresco, leite condensado e cravo por cima." },
  { nome: "Trufa de Maracujá", categoria: "Trufas", preco: 6.0, unidade: "unidade", minimo: 6, imagem: "", bio: "Ganache de chocolate branco com maracujá, casquinha crocante." },
  { nome: "Trufa de Chocolate Meio Amargo", categoria: "Trufas", preco: 6.0, unidade: "unidade", minimo: 6, imagem: "", bio: "Recheio intenso de cacau 55% com cobertura fina." },
  { nome: "Bolo no Pote Ninho com Morango", categoria: "Bolos no pote", preco: 14.0, unidade: "pote", minimo: 1, imagem: "", bio: "Massa fofinha, creme de leite ninho e morangos." },
  { nome: "Caixa Presente", categoria: "Presentes", preco: 69.0, unidade: "caixa com 12", minimo: 1, imagem: "", bio: "Seleção de doces da casa em caixa para presentear." }
];

/* ==========================================================
   3) CÓDIGO DO SITE — não precisa mexer daqui para baixo
   ========================================================== */
const $ = s => document.querySelector(s);
const R = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const CHAVE = "msn_carrinho";
const minimo = p => p.minimo || 1;

let filtro = "Todos";
let cart = (() => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } })();

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(cart)); } catch {}
  desenharCarrinho();
}

function aviso(texto) {
  const a = $("#aviso");
  a.textContent = texto;
  a.classList.add("on");
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => a.classList.remove("on"), 2200);
}

/* ---------- produtos ---------- */
function desenharProdutos() {
  const cats = ["Todos", ...new Set(PRODUTOS.map(p => p.categoria).filter(Boolean))];
  $("#filtros").innerHTML = cats.map(c =>
    `<button class="${c === filtro ? "ativo" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");

  $("#grade").innerHTML = PRODUTOS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => filtro === "Todos" || p.categoria === filtro)
    .map(({ p, i }) => `
      <article class="card">
        <div class="foto">${p.imagem
          ? `<img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy">`
          : `<span>MSN</span>`}</div>
        <div class="info">
          <h3>${esc(p.nome)}</h3>
          <p class="bio">${esc(p.bio)}</p>
          <div class="linha">
            <span class="preco">${R(p.preco)}</span>
            <small>${esc(p.unidade || "")}${minimo(p) > 1 ? ` · mín. ${minimo(p)}` : ""}</small>
          </div>
          <div class="compra">
            <div class="qtd">
              <button data-menos="${i}" aria-label="Diminuir">−</button>
              <output id="q${i}">${minimo(p)}</output>
              <button data-mais="${i}" aria-label="Aumentar">+</button>
            </div>
            <button class="btn" data-add="${i}">Adicionar</button>
          </div>
        </div>
      </article>`).join("");
}

$("#filtros").addEventListener("click", e => {
  const b = e.target.closest("button[data-cat]");
  if (b) { filtro = b.dataset.cat; desenharProdutos(); }
});

$("#grade").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset, q = i => $("#q" + i);
  if (d.mais !== undefined) q(d.mais).textContent = +q(d.mais).textContent + 1;
  if (d.menos !== undefined) q(d.menos).textContent = Math.max(minimo(PRODUTOS[d.menos]), +q(d.menos).textContent - 1);
  if (d.add !== undefined) {
    const p = PRODUTOS[d.add], n = +q(d.add).textContent;
    cart[p.nome] = (cart[p.nome] || 0) + n;
    salvar();
    aviso(`${n}x ${p.nome} no pedido`);
  }
});

/* ---------- carrinho ---------- */
function itensDoCarrinho() {
  return Object.entries(cart)
    .map(([nome, q]) => ({ p: PRODUTOS.find(x => x.nome === nome), q }))
    .filter(x => x.p && x.q > 0);
}
const totalCarrinho = () => itensDoCarrinho().reduce((s, { p, q }) => s + p.preco * q, 0);

function desenharCarrinho() {
  const itens = itensDoCarrinho();
  $("#itens").innerHTML = itens.length
    ? itens.map(({ p, q }) => `
      <div class="item">
        <div><strong>${esc(p.nome)}</strong><small>${R(p.preco)} / ${esc(p.unidade || "un.")}</small></div>
        <div class="qtd">
          <button data-c="-" data-n="${esc(p.nome)}" ${q <= minimo(p) ? "disabled" : ""} aria-label="Diminuir">−</button>
          <output>${q}</output>
          <button data-c="+" data-n="${esc(p.nome)}" aria-label="Aumentar">+</button>
        </div>
        <button class="x" data-c="x" data-n="${esc(p.nome)}" aria-label="Remover">×</button>
        <b>${R(p.preco * q)}</b>
      </div>`).join("")
    : `<p class="vazio">Seu pedido está vazio. Escolha um doce para começar.</p>`;
  $("#total").textContent = R(totalCarrinho());
  $("#contador").textContent = itens.reduce((s, { q }) => s + q, 0);
}

$("#itens").addEventListener("click", e => {
  const b = e.target.closest("button[data-c]");
  if (!b) return;
  const n = b.dataset.n, p = PRODUTOS.find(x => x.nome === n);
  if (b.dataset.c === "+") cart[n]++;
  if (b.dataset.c === "-") cart[n] = Math.max(minimo(p), cart[n] - 1);
  if (b.dataset.c === "x") delete cart[n];
  salvar();
});

const abrir = () => document.body.classList.add("aberto");
const fechar = () => document.body.classList.remove("aberto");
$("#abrirCarrinho").addEventListener("click", abrir);
$("#fechar").addEventListener("click", fechar);
$("#fundo").addEventListener("click", fechar);
document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });

/* ---------- formulário e WhatsApp ---------- */
$("#tipo").addEventListener("change", e => {
  const entrega = e.target.value === "Entrega";
  $("#campoEndereco").hidden = !entrega;
  $("#campoEndereco input").required = entrega;
});

$("#formPedido").addEventListener("submit", e => {
  e.preventDefault();
  const itens = itensDoCarrinho();
  if (!itens.length) return aviso("Adicione ao menos um doce ao pedido");

  const f = new FormData(e.target);
  const [a, m, d] = f.get("data").split("-");
  const entrega = f.get("tipo") === "Entrega";
  const linhas = [
    `*Novo pedido — ${CONFIG.loja}*`, "",
    `*Cliente:* ${f.get("nome")}`,
    entrega ? `*Entrega em:* ${f.get("endereco")}` : "*Retirada no local*",
    `*Data desejada:* ${d}/${m}/${a}`, "",
    "*Itens:*",
    ...itens.map(({ p, q }) => `• ${q}x ${p.nome} — ${R(p.preco * q)}`), "",
    `*Total:* ${R(totalCarrinho())}`
  ];
  if (f.get("obs").trim()) linhas.push("", `*Observações:* ${f.get("obs").trim()}`);

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(linhas.join("\n"))}`, "_blank");
});

/* ---------- início ---------- */
(function iniciar() {
  const min = new Date();
  min.setDate(min.getDate() + CONFIG.diasAntecedencia);
  $("#data").min = min.toISOString().split("T")[0];
  $("#diasMin").textContent = CONFIG.diasAntecedencia;
  $("#linkZap").href = `https://wa.me/${CONFIG.whatsapp}`;
  desenharProdutos();
  desenharCarrinho();
})();
